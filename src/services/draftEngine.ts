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
import { getPrimaryPositions } from '../data/heroPositions'

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
  2: ['Nuker', 'Carry'],
  3: ['Initiator', 'Durable', 'Disabler'],
  4: ['Support', 'Disabler', 'Escape'],
  5: ['Support', 'Disabler'],
}

/** Heroes tagged only as Nuker/Escape should not default to mid */
const SUPPORTISH_WITHOUT_SUPPORT_TAG = new Set([
  'bounty_hunter',
  'nyx_assassin',
  'riki',
  'techies',
  'earth_spirit',
  'tusk',
  'rattletrap',
])

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
  buildBonus?: { radiant: number; dire: number },
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
  const radiantBuild = buildBonus?.radiant ?? 0
  const direBuild = buildBonus?.dire ?? 0

  let radiantScore =
    50 +
    matchups.radiant * 2.5 +
    radiantSyn * 2 +
    radiantMeta * 0.4 +
    radiantCompBonus +
    radiantBuild * 1.35
  let direScore =
    50 +
    matchups.dire * 2.5 +
    direSyn * 2 +
    direMeta * 0.4 +
    direCompBonus +
    direBuild * 1.35

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

    const prev = analyzeDraft(otherRadiant, otherDire, winRates, null, matchupsCache, buildBonus)
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
    {
      label: 'Item Builds',
      radiantValue: radiantBuild > 0.05 ? `+${radiantBuild.toFixed(1)}` : '—',
      direValue: direBuild > 0.05 ? `+${direBuild.toFixed(1)}` : '—',
      advantage:
        radiantBuild > direBuild + 0.15
          ? 'radiant'
          : direBuild > radiantBuild + 0.15
            ? 'dire'
            : 'neutral',
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

function shortName(hero: Hero): string {
  return hero.name.replace(/^npc_dota_hero_/, '')
}

function roleFitScore(hero: Hero, position: number): number {
  const primary = getPrimaryPositions(hero.name)
  if (primary) {
    const idx = primary.indexOf(position as 1 | 2 | 3 | 4 | 5)
    if (idx === 0) return 4
    if (idx === 1) return 3
    if (idx >= 2) return 1.5
    // Listed for other positions → bad fit for this slot
    return -4
  }

  const sn = shortName(hero)
  if (SUPPORTISH_WITHOUT_SUPPORT_TAG.has(sn) || SUPPORTISH_WITHOUT_SUPPORT_TAG.has(hero.name)) {
    if (position === 4 || position === 5) return 3.5
    if (position === 3) return 0.5
    return -4
  }

  const needed = POSITION_ROLES[position] ?? []
  const isSupport = hero.roles.includes('Support')
  const isCarry = hero.roles.includes('Carry')

  // Support heroes should not be suggested as mid/carry first
  if (isSupport && !isCarry) {
    if (position === 4 || position === 5) return 3.5
    if (position === 3) return 1
    return -3.5
  }
  if (isSupport && isCarry) {
    if (position === 1 || position === 4 || position === 5) return 3
    if (position === 3) return 1.5
    return -1
  }

  const matches = hero.roles.filter((r) => needed.includes(r)).length
  if (matches > 0) return 3 + (matches - 1) * 0.5

  if (position === 2 && hero.roles.includes('Nuker') && !isSupport) return 2
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

  // 1. Meta — soft bias only (Max 8 pts). Prefer draft context over winrate.
  const wr = winRates.get(candidate.id) ?? 50
  let metaComponent = Math.min(8, Math.max(0, (wr - 48) * 0.8))
  if (wr >= 53 && teamHeroes.length + enemyHeroes.length === 0) {
    tags.push({ label: 'solid WR', type: 'meta' })
  }

  // 2. Synergy (Max 38 pts) — main signal once allies exist
  let synergyComponent = 0
  let synergyHits = 0
  for (const ally of teamHeroes) {
    const syn = getSynergyEntry(candidate, ally)
    if (syn) {
      synergyHits++
      synergyComponent += syn.synergyScore * 2.2
      if (tags.length < 4) {
        tags.push({ label: `synergy w/ ${ally.localizedName}`, type: 'synergy' })
      }
    }
  }
  const missingRoles = teamMissingRoles(teamHeroes)
  for (const role of candidate.roles) {
    if (missingRoles.has(role)) {
      synergyComponent += 5
      tags.push({ label: `fills ${role}`, type: 'role' })
      break
    }
  }
  if (!teamHeroes.length) {
    synergyComponent = 4 // small baseline when no allies yet
  } else if (synergyHits === 0) {
    synergyComponent += 2
  }
  synergyComponent = Math.min(38, Math.max(0, synergyComponent))

  // 3. Matchup / Counter (Max 40 pts) — primary when enemies are known
  let matchupComponent = 0
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
      matchupComponent += diff * 2.4
      if (diff >= 2.5) {
        tags.push({ label: `good vs ${enemy.localizedName}`, type: 'counter' })
      } else if (diff <= -2.5) {
        tags.push({ label: `weak vs ${enemy.localizedName}`, type: 'counter' })
      }
    } else {
      const entry = getCounterEntry(candidate, enemy)
      if (entry && entry.counter.id === candidate.id) {
        const bonus = entry.severity === 'high' ? 11 : entry.severity === 'medium' ? 7 : 3
        matchupComponent += bonus
        tags.push({ label: `counters ${enemy.localizedName}`, type: 'counter' })
      } else if (entry && entry.victim.id === candidate.id) {
        const penalty = entry.severity === 'high' ? 10 : entry.severity === 'medium' ? 6 : 3
        matchupComponent -= penalty
      }
    }
  }
  if (!enemyHeroes.length) {
    matchupComponent = 5
  } else {
    matchupComponent = matchupComponent / Math.max(1, Math.sqrt(enemyHeroes.length)) + 8
  }
  matchupComponent = Math.min(40, Math.max(0, matchupComponent))

  // 4. Role & Lane Fit (Max 18 pts)
  const roleFit = roleFitScore(candidate, position)
  let roleFitComponent = 0
  if (roleFit >= 3.5) {
    roleFitComponent = 18
    tags.push({ label: POSITION_LABELS[position] ?? `pos ${position}`, type: 'role' })
  } else if (roleFit >= 3) {
    roleFitComponent = 16
    tags.push({ label: POSITION_LABELS[position] ?? `pos ${position}`, type: 'role' })
  } else if (roleFit >= 2) {
    roleFitComponent = 11
  } else if (roleFit >= 1) {
    roleFitComponent = 7
  } else if (roleFit >= 0) {
    roleFitComponent = 3
  } else {
    roleFitComponent = 0
  }

  // Prefer drafting into the earliest empty role (already scored per position)
  let totalScore = metaComponent + synergyComponent + matchupComponent + roleFitComponent
  totalScore = Math.min(100, Math.max(1, totalScore))

  // Prefer synergy/counter tags in the reason string
  const priorityTags = [...tags].sort((a, b) => {
    const order = { synergy: 0, counter: 1, role: 2, meta: 3 }
    return order[a.type] - order[b.type]
  })
  const uniqueTags = [...new Map(priorityTags.map((t) => [t.label, t])).values()].slice(0, 3)
  const reason =
    uniqueTags.length > 0
      ? uniqueTags.map((t) => t.label).join(' · ')
      : `Fits ${POSITION_LABELS[position] ?? 'flex'}`

  return {
    hero: candidate,
    score: totalScore,
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
  limit = 12,
): ScoredRecommendation[] {
  const positions = orderEmptyPositions(emptyPositions)
  const bestByHero = new Map<number, ScoredRecommendation>()

  for (const position of positions) {
    for (const hero of available) {
      // Skip heroes that are a terrible fit for this lane (keeps mid clear of supports)
      if (roleFitScore(hero, position) < 0) continue

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

  const byPosition = new Map<number, ScoredRecommendation[]>()
  for (const rec of results) {
    const pos = rec.suggestedPosition
    if (!byPosition.has(pos)) byPosition.set(pos, [])
    byPosition.get(pos)!.push(rec)
  }

  const diversified: ScoredRecommendation[] = []
  const usedIds = new Set<number>()

  // Round-robin across empty positions so top list isn't 12 meta carries
  let added = true
  while (diversified.length < limit && added) {
    added = false
    for (const pos of positions) {
      if (diversified.length >= limit) break
      const pool = byPosition.get(pos) ?? []
      const pick = pool.find((r) => !usedIds.has(r.hero.id))
      if (pick) {
        diversified.push(pick)
        usedIds.add(pick.hero.id)
        added = true
      }
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
