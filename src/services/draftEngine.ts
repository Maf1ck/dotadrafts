import type {
  Hero,
  WinPrediction,
  MetaStatRow,
  RecommendedHero,
  SynergyEntry,
  CounterEntry,
  TeamSide,
} from '../types/draft'
import { COMPOSITION_TAGS, HERO_COUNTERS, HERO_SYNERGIES } from '../data/matchups'

export interface HeroWinRate {
  id: number
  winRate: number
}

export interface DraftAnalysis {
  prediction: WinPrediction
  metaRows: MetaStatRow[]
  synergies: SynergyEntry[]
  counters: CounterEntry[]
  radiantComposition: string[]
  direComposition: string[]
  radiantMatchupWins: number
  direMatchupWins: number
  totalMatchups: number
}

export interface RecommendationTag {
  label: string
  type: 'synergy' | 'counter' | 'meta' | 'role'
}

export interface ScoredRecommendation extends RecommendedHero {
  reason: string
  tags: RecommendationTag[]
  suggestedPosition: number
}

const POSITION_ROLES: Record<number, string[]> = {
  1: ['Carry'],
  2: ['Carry', 'Nuker'],
  3: ['Initiator', 'Durable', 'Disabler'],
  4: ['Support', 'Disabler', 'Nuker'],
  5: ['Support'],
}

function heroByName(heroes: Hero[], name: string): Hero | undefined {
  return heroes.find((h) => h.name === name)
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join(':')
}

function getCuratedCounterEntry(counter: Hero, victim: Hero): CounterEntry | null {
  const row = HERO_COUNTERS.find(
    ([c, v]) =>
      (c === counter.name && v === victim.name) ||
      (c === victim.name && v === counter.name),
  )
  if (!row) return null

  const [counterName, victimName, severity, description] = row
  if (counterName === counter.name && victimName === victim.name) {
    return { counter, victim, severity, description }
  }
  return { counter: victim, victim: counter, severity, description }
}

function getCuratedSynergyEntry(a: Hero, b: Hero): SynergyEntry | null {
  const row = HERO_SYNERGIES.find(
    ([x, y]) =>
      (x === a.name && y === b.name) || (x === b.name && y === a.name),
  )
  if (!row) return null
  const [, , score, description] = row
  return { heroA: a, heroB: b, synergyScore: score, description }
}

const ROLE_PAIR_SYNERGIES: [string, string, number, string][] = [
  ['Initiator', 'Disabler', 6.5, 'Setup into lockdown combo'],
  ['Initiator', 'Nuker', 6.2, 'AoE initiation enables burst damage'],
  ['Carry', 'Support', 6.0, 'Lane sustain and peel for carry'],
  ['Disabler', 'Nuker', 5.8, 'CC chain into burst window'],
  ['Durable', 'Initiator', 5.5, 'Frontline absorbs damage during engage'],
  ['Pusher', 'Support', 5.2, 'Early pressure with sustain'],
]

const ROLE_COUNTERS: [string, string, 'low' | 'medium' | 'high', string][] = [
  ['Disabler', 'Carry', 'medium', 'Lockdown punishes immobile carry'],
  ['Nuker', 'Carry', 'low', 'Burst threatens squishy cores'],
  ['Escape', 'Disabler', 'medium', 'Mobility dodges hard CC'],
  ['Durable', 'Nuker', 'low', 'Tankiness absorbs magic burst'],
  ['Initiator', 'Escape', 'medium', 'Gap-close catches mobile heroes'],
]

function inferPairSynergy(a: Hero, b: Hero): SynergyEntry | null {
  for (const [roleA, roleB, score, desc] of ROLE_PAIR_SYNERGIES) {
    const aHasA = a.roles.includes(roleA as Hero['roles'][number])
    const aHasB = a.roles.includes(roleB as Hero['roles'][number])
    const bHasA = b.roles.includes(roleA as Hero['roles'][number])
    const bHasB = b.roles.includes(roleB as Hero['roles'][number])
    if ((aHasA && bHasB) || (aHasB && bHasA)) {
      return { heroA: a, heroB: b, synergyScore: score, description: desc }
    }
  }
  return null
}

function inferCounterEntry(counter: Hero, victim: Hero): CounterEntry | null {
  for (const [cRole, vRole, severity, desc] of ROLE_COUNTERS) {
    if (
      counter.roles.includes(cRole as Hero['roles'][number]) &&
      victim.roles.includes(vRole as Hero['roles'][number])
    ) {
      return { counter, victim, severity, description: desc }
    }
  }
  return null
}

function getSynergyEntry(a: Hero, b: Hero): SynergyEntry | null {
  return getCuratedSynergyEntry(a, b) ?? inferPairSynergy(a, b)
}

function getCounterEntry(heroA: Hero, heroB: Hero): CounterEntry | null {
  const curated = getCuratedCounterEntry(heroA, heroB)
  if (curated) return curated

  const aCountersB = inferCounterEntry(heroA, heroB)
  if (aCountersB) return aCountersB

  const bCountersA = inferCounterEntry(heroB, heroA)
  if (bCountersA) {
    return {
      counter: heroB,
      victim: heroA,
      severity: bCountersA.severity,
      description: bCountersA.description,
    }
  }
  return null
}

function roleSynergyScore(heroes: Hero[]): number {
  if (heroes.length < 2) return 0
  let score = 0
  const roles = heroes.flatMap((h) => h.roles)

  if (roles.includes('Initiator') && roles.includes('Disabler')) score += 1.5
  if (roles.includes('Carry') && roles.includes('Support')) score += 1.2
  if (roles.includes('Nuker') && roles.includes('Disabler')) score += 1
  if (roles.filter((r) => r === 'Initiator').length >= 2) score += 0.8
  if (!roles.includes('Carry') && heroes.length >= 3) score -= 1.5
  if (!roles.includes('Support') && heroes.length >= 3) score -= 1
  if (!roles.includes('Disabler') && heroes.length >= 4) score -= 0.8

  return score
}

function compositionTags(heroes: Hero[]): string[] {
  const tags: string[] = []
  const roleSet = new Set(heroes.flatMap((h) => h.roles))

  for (const [tag, needed] of Object.entries(COMPOSITION_TAGS)) {
    const matches = needed.filter((r) => roleSet.has(r as Hero['roles'][number])).length
    if (matches >= Math.min(2, needed.length)) tags.push(tag)
  }

  if (heroes.length >= 3 && roleSet.has('Carry')) tags.push('scaling')
  return [...new Set(tags)].slice(0, 5)
}

function matchupAdvantage(
  radiantHeroes: Hero[],
  direHeroes: Hero[],
  matchupsCache?: Record<number, Record<number, { wins: number; games: number }>>,
): { radiant: number; dire: number } {
  let radiantPoints = 0
  let direPoints = 0

  for (const r of radiantHeroes) {
    for (const d of direHeroes) {
      let winRateR = 50
      let hasDynamic = false

      if (matchupsCache) {
        const cacheR = matchupsCache[r.id]
        const cacheD = matchupsCache[d.id]
        if (cacheR && cacheR[d.id]) {
          const stats = cacheR[d.id]
          if (stats && stats.games > 5) {
            winRateR = (stats.wins / stats.games) * 100
            hasDynamic = true
          }
        } else if (cacheD && cacheD[r.id]) {
          const stats = cacheD[r.id]
          if (stats && stats.games > 5) {
            winRateR = 100 - (stats.wins / stats.games) * 100
            hasDynamic = true
          }
        }
      }

      if (hasDynamic) {
        const diff = winRateR - 50
        if (diff > 0) {
          radiantPoints += diff * 0.15
        } else {
          direPoints += Math.abs(diff) * 0.15
        }
      } else {
        const entry = getCounterEntry(r, d)
        if (entry) {
          const weight = entry.severity === 'high' ? 2 : entry.severity === 'medium' ? 1 : 0.5
          if (entry.counter.id === r.id) radiantPoints += weight
          else direPoints += weight
        }
      }
    }
  }

  return { radiant: radiantPoints, dire: direPoints }
}

function teamSynergyScore(heroes: Hero[]): number {
  let score = roleSynergyScore(heroes)
  for (let i = 0; i < heroes.length; i++) {
    for (let j = i + 1; j < heroes.length; j++) {
      const a = heroes[i]
      const b = heroes[j]
      if (!a || !b) continue
      const syn = getSynergyEntry(a, b)
      if (syn) score += syn.synergyScore / 4
    }
  }
  return score
}

function metaScore(heroes: Hero[], winRates: Map<number, number>): number {
  if (!heroes.length) return 0
  const rates = heroes.map((h) => winRates.get(h.id) ?? 50)
  return rates.reduce((a, b) => a + b, 0) / rates.length - 50
}

function synergyLabel(score: number): string {
  if (score >= 6) return 'High'
  if (score >= 3) return 'Medium'
  return 'Low'
}

export function analyzeDraft(
  radiantHeroes: Hero[],
  direHeroes: Hero[],
  winRates: Map<number, number>,
  lastPick?: { hero: Hero; team: TeamSide } | null,
  matchupsCache?: Record<number, Record<number, { wins: number; games: number }>>,
): DraftAnalysis {
  const matchups = matchupAdvantage(radiantHeroes, direHeroes, matchupsCache)
  const radiantSyn = teamSynergyScore(radiantHeroes)
  const direSyn = teamSynergyScore(direHeroes)
  const radiantMeta = metaScore(radiantHeroes, winRates)
  const direMeta = metaScore(direHeroes, winRates)
  const radiantComp = compositionTags(radiantHeroes)
  const direComp = compositionTags(direHeroes)

  const radiantCompBonus = radiantComp.length * 0.8
  const direCompBonus = direComp.length * 0.8

  let radiantScore =
    50 +
    matchups.radiant * 2.5 +
    radiantSyn * 2 +
    radiantMeta * 0.4 +
    radiantCompBonus
  let direScore =
    50 +
    matchups.dire * 2.5 +
    direSyn * 2 +
    direMeta * 0.4 +
    direCompBonus

  if (radiantHeroes.length === 0 && direHeroes.length === 0) {
    radiantScore = 50
    direScore = 50
  }

  const total = radiantScore + direScore
  const radiantWinRate = total > 0 ? (radiantScore / total) * 100 : 50
  const direWinRate = 100 - radiantWinRate

  let delta = 0
  let deltaHero = ''
  let deltaTeam: TeamSide = 'radiant'

  if (lastPick) {
    const without = lastPick.team === 'radiant'
      ? radiantHeroes.filter((h) => h.id !== lastPick.hero.id)
      : direHeroes.filter((h) => h.id !== lastPick.hero.id)
    const otherRadiant = lastPick.team === 'radiant' ? without : radiantHeroes
    const otherDire = lastPick.team === 'dire' ? without : direHeroes

    const prev = analyzeDraft(otherRadiant, otherDire, winRates, null)
    const prevRadiant = prev.prediction.radiantWinRate
    delta = radiantWinRate - prevRadiant
    deltaHero = lastPick.hero.localizedName
    deltaTeam = delta >= 0 ? 'radiant' : 'dire'
  }

  const totalMatchups = radiantHeroes.length * direHeroes.length
  const radiantMatchupWins = Math.round(matchups.radiant)
  const direMatchupWins = Math.round(matchups.dire)

  const synergies: SynergyEntry[] = []
  for (const team of [radiantHeroes, direHeroes]) {
    for (let i = 0; i < team.length; i++) {
      for (let j = i + 1; j < team.length; j++) {
        const a = team[i]
        const b = team[j]
        if (!a || !b) continue
        const syn = getSynergyEntry(a, b)
        if (syn) synergies.push(syn)
      }
    }
  }
  synergies.sort((a, b) => b.synergyScore - a.synergyScore)

  const counters: CounterEntry[] = []
  const seenCounterPairs = new Set<string>()
  for (const r of radiantHeroes) {
    for (const d of direHeroes) {
      const entry = getCounterEntry(r, d)
      if (!entry) continue
      const key = `${entry.counter.id}-${entry.victim.id}`
      if (seenCounterPairs.has(key)) continue
      seenCounterPairs.add(key)
      counters.push(entry)
    }
  }
  counters.sort((a, b) => {
    const order = { high: 3, medium: 2, low: 1 }
    return order[b.severity] - order[a.severity]
  })

  const metaRows: MetaStatRow[] = [
    {
      label: 'Matchups',
      radiantValue: totalMatchups ? `${radiantMatchupWins}/${totalMatchups}` : '—',
      direValue: totalMatchups ? `${direMatchupWins}/${totalMatchups}` : '—',
      advantage:
        matchups.radiant > matchups.dire
          ? 'radiant'
          : matchups.dire > matchups.radiant
            ? 'dire'
            : 'neutral',
    },
    {
      label: 'Synergy',
      radiantValue: radiantHeroes.length ? synergyLabel(radiantSyn) : '—',
      direValue: direHeroes.length ? synergyLabel(direSyn) : '—',
      advantage:
        radiantSyn > direSyn ? 'radiant' : direSyn > radiantSyn ? 'dire' : 'neutral',
    },
    {
      label: 'Composition',
      radiantValue: radiantComp.length ? `${Math.min(100, radiantComp.length * 20 + 60)}%` : '—',
      direValue: direComp.length ? `${Math.min(100, direComp.length * 20 + 60)}%` : '—',
      advantage:
        radiantComp.length > direComp.length
          ? 'radiant'
          : direComp.length > radiantComp.length
            ? 'dire'
            : 'neutral',
    },
    {
      label: 'Meta Score',
      radiantValue: radiantHeroes.length ? (50 + radiantMeta).toFixed(1) : '—',
      direValue: direHeroes.length ? (50 + direMeta).toFixed(1) : '—',
      advantage:
        radiantMeta > direMeta ? 'radiant' : direMeta > radiantMeta ? 'dire' : 'neutral',
    },
  ]

  return {
    prediction: {
      radiantWinRate,
      direWinRate,
      delta: Math.abs(delta),
      deltaHero,
      deltaTeam,
    },
    metaRows,
    synergies: synergies.slice(0, 8),
    counters: counters.slice(0, 8),
    radiantComposition: radiantComp,
    direComposition: direComp,
    radiantMatchupWins,
    direMatchupWins,
    totalMatchups,
  }
}

function roleFitScore(hero: Hero, position: number): number {
  const needed = POSITION_ROLES[position] ?? []
  const matches = hero.roles.filter((r) => needed.includes(r)).length
  if (matches > 0) return 3 + (matches - 1) * 0.5
  // Partial fit — e.g. Nuker can mid without Carry tag
  if (position === 2 && hero.roles.includes('Nuker')) return 2
  if (position === 3 && (hero.roles.includes('Durable') || hero.roles.includes('Initiator'))) return 1.5
  return -3
}

const POSITION_LABELS: Record<number, string> = {
  1: 'Carry',
  2: 'Mid',
  3: 'Offlane',
  4: 'Soft Sup',
  5: 'Hard Sup',
}

/** Draft order: carry → mid → offlane → supports */
function orderEmptyPositions(emptyPositions: number[]): number[] {
  return [...emptyPositions].sort((a, b) => a - b)
}

function teamMissingRoles(teamHeroes: Hero[]): Set<Hero['roles'][number]> {
  const filled = new Set(teamHeroes.flatMap((h) => h.roles))
  const needed: Hero['roles'][number][] = ['Carry', 'Support', 'Disabler', 'Initiator', 'Nuker']
  return new Set(needed.filter((r) => !filled.has(r)))
}

export function scoreRecommendations(
  candidate: Hero,
  _team: TeamSide,
  teamHeroes: Hero[],
  enemyHeroes: Hero[],
  winRates: Map<number, number>,
  position: number,
  matchupsCache?: Record<number, Record<number, { wins: number; games: number }>>,
): ScoredRecommendation {
  const tags: RecommendationTag[] = []
  let score = 5

  const wr = winRates.get(candidate.id) ?? 50
  score += (wr - 50) * 0.6
  if (wr >= 51.5) tags.push({ label: 'meta pick', type: 'meta' })

  for (const ally of teamHeroes) {
    const syn = getSynergyEntry(candidate, ally)
    if (syn) {
      score += syn.synergyScore * 0.3
      tags.push({ label: `synergy w/ ${ally.localizedName}`, type: 'synergy' })
    }
  }

  const missingRoles = teamMissingRoles(teamHeroes)
  for (const role of candidate.roles) {
    if (missingRoles.has(role)) {
      score += 1.2
      tags.push({ label: `fills ${role}`, type: 'role' })
      break
    }
  }

  for (const enemy of enemyHeroes) {
    let winRateAgainst = 50
    let hasDynamic = false

    if (matchupsCache) {
      const cacheCand = matchupsCache[candidate.id]
      const cacheEnemy = matchupsCache[enemy.id]
      if (cacheCand && cacheCand[enemy.id]) {
        const stats = cacheCand[enemy.id]
        if (stats && stats.games > 5) {
          winRateAgainst = (stats.wins / stats.games) * 100
          hasDynamic = true
        }
      } else if (cacheEnemy && cacheEnemy[candidate.id]) {
        const stats = cacheEnemy[candidate.id]
        if (stats && stats.games > 5) {
          winRateAgainst = 100 - (stats.wins / stats.games) * 100
          hasDynamic = true
        }
      }
    }

    if (hasDynamic) {
      const diff = winRateAgainst - 50
      score += diff * 0.4
      if (diff >= 3) {
        tags.push({ label: `good vs ${enemy.localizedName}`, type: 'counter' })
      } else if (diff <= -3) {
        tags.push({ label: `weak vs ${enemy.localizedName}`, type: 'counter' })
      }
    } else {
      const entry = getCounterEntry(candidate, enemy)
      if (entry && entry.counter.id === candidate.id) {
        const bonus = entry.severity === 'high' ? 3 : entry.severity === 'medium' ? 2 : 1
        score += bonus
        tags.push({ label: `counters ${enemy.localizedName}`, type: 'counter' })
      } else if (entry && entry.victim.id === candidate.id) {
        score -= entry.severity === 'high' ? 2.5 : entry.severity === 'medium' ? 1.5 : 0.8
      }
    }
  }

  const roleFit = roleFitScore(candidate, position)
  score += roleFit
  if (roleFit >= 3) {
    tags.push({ label: POSITION_LABELS[position] ?? `pos ${position}`, type: 'role' })
  }

  const uniqueTags = [...new Map(tags.map((t) => [t.label, t])).values()].slice(0, 3)
  const reason =
    uniqueTags.length > 0
      ? uniqueTags.map((t) => t.label).join(' · ')
      : `Strong ${POSITION_LABELS[position] ?? 'flex'} option`

  return {
    hero: candidate,
    score: Math.min(10, Math.max(1, score)),
    synergyWith: teamHeroes
      .filter((a) => getSynergyEntry(candidate, a))
      .map((a) => a.localizedName),
    counters: enemyHeroes
      .filter((e) => {
        let winRateAgainst = 50
        let hasDynamic = false
        if (matchupsCache) {
          const cacheCand = matchupsCache[candidate.id]
          const cacheEnemy = matchupsCache[e.id]
          if (cacheCand && cacheCand[e.id]) {
            const stats = cacheCand[e.id]
            if (stats && stats.games > 0) {
              winRateAgainst = (stats.wins / stats.games) * 100
              hasDynamic = true
            }
          } else if (cacheEnemy && cacheEnemy[candidate.id]) {
            const stats = cacheEnemy[candidate.id]
            if (stats && stats.games > 0) {
              winRateAgainst = 100 - (stats.wins / stats.games) * 100
              hasDynamic = true
            }
          }
        }
        if (hasDynamic) return winRateAgainst > 51.5
        const c = getCounterEntry(candidate, e)
        return c && c.counter.id === candidate.id
      })
      .map((e) => e.localizedName),
    role: `${POSITION_LABELS[position] ?? 'Flex'} · ${candidate.roles.slice(0, 2).join(' / ')}`,
    reason,
    tags: uniqueTags,
    suggestedPosition: position,
  }
}

export function getRecommendations(
  available: Hero[],
  team: TeamSide,
  teamHeroes: Hero[],
  enemyHeroes: Hero[],
  emptyPositions: number[],
  winRates: Map<number, number>,
  matchupsCache?: Record<number, Record<number, { wins: number; games: number }>>,
  limit = 8,
): ScoredRecommendation[] {
  const positions = orderEmptyPositions(emptyPositions)
  const bestByHero = new Map<number, ScoredRecommendation>()

  for (const position of positions) {
    for (const hero of available) {
      const scored = scoreRecommendations(
        hero,
        team,
        teamHeroes,
        enemyHeroes,
        winRates,
        position,
        matchupsCache,
      )
      const existing = bestByHero.get(hero.id)
      if (!existing || scored.score > existing.score) {
        bestByHero.set(hero.id, scored)
      }
    }
  }

  const results = [...bestByHero.values()].sort((a, b) => b.score - a.score)

  // Ensure variety across positions in top picks
  const byPosition = new Map<number, ScoredRecommendation[]>()
  for (const rec of results) {
    const pos = rec.suggestedPosition
    if (!byPosition.has(pos)) byPosition.set(pos, [])
    byPosition.get(pos)!.push(rec)
  }

  const diversified: ScoredRecommendation[] = []
  const usedIds = new Set<number>()

  for (const pos of positions) {
    const pool = byPosition.get(pos) ?? []
    const pick = pool.find((r) => !usedIds.has(r.hero.id))
    if (pick) {
      diversified.push(pick)
      usedIds.add(pick.hero.id)
    }
  }

  for (const rec of results) {
    if (diversified.length >= limit) break
    if (!usedIds.has(rec.hero.id)) {
      diversified.push(rec)
      usedIds.add(rec.hero.id)
    }
  }

  return diversified.slice(0, limit)
}

export function getUsedHeroIds(
  radiant: Hero[],
  dire: Hero[],
  radiantBans: (Hero | null)[],
  direBans: (Hero | null)[],
): Set<number> {
  const ids = new Set<number>()
  for (const h of [...radiant, ...dire, ...radiantBans, ...direBans]) {
    if (h) ids.add(h.id)
  }
  return ids
}
