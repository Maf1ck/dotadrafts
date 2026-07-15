import type { Hero } from '../types/draft'
import type { ItemInfo } from './opendotaItems'
import { isShopExcluded } from '../data/patchItems'

export interface ItemSuggestion {
  item: ItemInfo
  /** i18n key under tips.* */
  reasonKey: string
  priority: number
}

export interface PopularBuckets {
  starting: { id: number; count?: number }[]
  early: { id: number; count?: number }[]
  core: { id: number; count?: number }[]
  luxury: { id: number; count?: number }[]
}

type Rule = {
  shortNames: string[]
  againstRoles?: string[]
  allyRoles?: string[]
  heroRoles?: string[]
  attrs?: Array<'str' | 'agi' | 'int' | 'all'>
  reasonKey: string
  priority: number
}

const COUNTER_RULES: Rule[] = [
  { shortNames: ['black_king_bar'], againstRoles: ['Disabler', 'Nuker', 'Initiator'], reasonKey: 'bkb', priority: 12 },
  { shortNames: ['blade_mail'], againstRoles: ['Carry', 'Nuker'], heroRoles: ['Durable', 'Initiator'], reasonKey: 'bladeMail', priority: 8 },
  { shortNames: ['ghost'], againstRoles: ['Carry'], heroRoles: ['Support', 'Nuker', 'Escape'], reasonKey: 'ghost', priority: 7 },
  { shortNames: ['force_staff', 'hurricane_pike'], againstRoles: ['Initiator', 'Disabler'], reasonKey: 'force', priority: 8 },
  { shortNames: ['glimmer_cape'], againstRoles: ['Nuker', 'Carry'], heroRoles: ['Support', 'Escape'], reasonKey: 'glimmer', priority: 7 },
  { shortNames: ['pipe'], againstRoles: ['Nuker'], heroRoles: ['Support', 'Durable', 'Initiator'], reasonKey: 'pipe', priority: 9 },
  { shortNames: ['crimson_guard'], againstRoles: ['Carry', 'Pusher'], heroRoles: ['Durable', 'Support', 'Initiator'], reasonKey: 'crimson', priority: 8 },
  { shortNames: ['heaven_halberd'], againstRoles: ['Carry'], heroRoles: ['Durable', 'Initiator', 'Disabler'], reasonKey: 'halberd', priority: 9 },
  { shortNames: ['orchid', 'bloodthorn'], againstRoles: ['Nuker', 'Escape'], heroRoles: ['Carry', 'Nuker', 'Disabler'], reasonKey: 'orchid', priority: 8 },
  { shortNames: ['sheepstick'], againstRoles: ['Carry', 'Escape'], heroRoles: ['Nuker', 'Support', 'Disabler'], reasonKey: 'hex', priority: 9 },
  { shortNames: ['aeon_disk'], againstRoles: ['Nuker', 'Disabler'], reasonKey: 'aeon', priority: 8 },
  { shortNames: ['lotus_orb'], againstRoles: ['Disabler', 'Nuker'], reasonKey: 'lotus', priority: 7 },
  { shortNames: ['linkens'], againstRoles: ['Disabler'], heroRoles: ['Carry', 'Nuker', 'Escape'], reasonKey: 'linkens', priority: 8 },
  { shortNames: ['satanic'], againstRoles: ['Nuker', 'Disabler'], heroRoles: ['Carry', 'Durable'], reasonKey: 'satanic', priority: 6 },
  { shortNames: ['mjollnir', 'monkey_king_bar'], againstRoles: ['Escape'], heroRoles: ['Carry'], reasonKey: 'trueStrike', priority: 7 },
  { shortNames: ['silver_edge'], againstRoles: ['Durable', 'Initiator'], heroRoles: ['Carry', 'Escape'], reasonKey: 'break', priority: 8 },
  { shortNames: ['nullifier'], againstRoles: ['Durable', 'Support'], heroRoles: ['Carry', 'Nuker'], reasonKey: 'nullifier', priority: 7 },
  { shortNames: ['radiance'], againstRoles: ['Carry'], heroRoles: ['Durable', 'Pusher'], reasonKey: 'radiance', priority: 6 },
  { shortNames: ['shivas'], againstRoles: ['Carry', 'Pusher'], heroRoles: ['Durable', 'Nuker', 'Initiator'], reasonKey: 'shivas', priority: 7 },
  { shortNames: ['abyssal_blade'], againstRoles: ['Escape', 'Carry'], heroRoles: ['Carry', 'Initiator'], reasonKey: 'hex', priority: 7 },
  { shortNames: ['ethereal_blade'], againstRoles: ['Carry', 'Durable'], heroRoles: ['Nuker'], reasonKey: 'ghost', priority: 6 },
]

const ALLY_RULES: Rule[] = [
  { shortNames: ['solar_crest'], allyRoles: ['Carry'], heroRoles: ['Support'], reasonKey: 'solar', priority: 7 },
  { shortNames: ['glimmer_cape', 'force_staff', 'lotus_orb'], allyRoles: ['Carry', 'Nuker'], heroRoles: ['Support'], reasonKey: 'save', priority: 8 },
  { shortNames: ['pipe', 'crimson_guard', 'guardian_greaves'], allyRoles: ['Carry', 'Durable'], heroRoles: ['Support', 'Durable'], reasonKey: 'aura', priority: 6 },
]

function findItems(shortNames: string[], constants: Record<number, ItemInfo>): ItemInfo[] {
  const byShort = new Map(
    Object.values(constants)
      .filter((i) => !i.isNeutral && !isShopExcluded(i.shortName, i.isNeutral))
      .map((i) => [i.shortName, i]),
  )
  return shortNames.map((s) => byShort.get(s)).filter((i): i is ItemInfo => !!i)
}

function applyRules(
  rules: Rule[],
  hero: Hero,
  enemyRoles: Set<string>,
  allyRoles: Set<string>,
  constants: Record<number, ItemInfo>,
  scored: Map<number, ItemSuggestion>,
  requireEnemy: boolean,
  coreExclude: Set<number>,
) {
  const attr = hero.primaryAttr
  const heroRoles = new Set(hero.roles)

  for (const rule of rules) {
    if (requireEnemy && !enemyRoles.size) continue

    if (rule.againstRoles?.length) {
      const hits = rule.againstRoles.filter((r) => enemyRoles.has(r))
      if (!hits.length) continue
    }
    if (rule.allyRoles?.length) {
      const hits = rule.allyRoles.filter((r) => allyRoles.has(r))
      if (!hits.length) continue
    }
    if (rule.heroRoles?.length) {
      const hits = rule.heroRoles.filter((r) => heroRoles.has(r as Hero['roles'][number]))
      if (!hits.length) continue
    }
    if (rule.attrs?.length && !rule.attrs.includes(attr) && attr !== 'all') continue

    const roleHits =
      (rule.againstRoles?.filter((r) => enemyRoles.has(r)).length ?? 0) +
      (rule.allyRoles?.filter((r) => allyRoles.has(r)).length ?? 0) +
      (rule.heroRoles?.filter((r) => heroRoles.has(r as Hero['roles'][number])).length ?? 0)

    for (const item of findItems(rule.shortNames, constants)) {
      // Prefer truly situational — boost if not already a frequent core item
      const inCore = coreExclude.has(item.id)
      const priority = rule.priority + roleHits * 0.8 + (inCore ? -4 : 3)
      if (priority < 4) continue
      const prev = scored.get(item.id)
      if (!prev || prev.priority < priority) {
        scored.set(item.id, { item, reasonKey: rule.reasonKey, priority })
      }
    }
  }
}

function addPopular(
  constants: Record<number, ItemInfo>,
  scored: Map<number, ItemSuggestion>,
  buckets: PopularBuckets | undefined,
  reasonKey: string,
  basePriority: number,
) {
  if (!buckets) return
  const lists = [
    { rows: buckets.luxury, boost: 0 },
    { rows: buckets.core, boost: 1.5 },
    { rows: buckets.early, boost: 0.5 },
  ]
  for (const { rows, boost } of lists) {
    rows.forEach((row, idx) => {
      const item = constants[row.id]
      if (!item || item.isNeutral || isShopExcluded(item.shortName, item.isNeutral)) return
      const priority = basePriority + boost + Math.max(0, 4 - idx) * 0.4
      const prev = scored.get(item.id)
      if (!prev || prev.priority < priority) {
        scored.set(item.id, { item, reasonKey, priority })
      }
    })
  }
}

/**
 * Situational suggestions: matchup/ally counters first, then hero-popular flex items.
 * Pass popularity so heroes get different "frequent" suggestions.
 */
export function suggestItemsForDraft(
  hero: Hero,
  allies: Hero[],
  enemies: Hero[],
  constants: Record<number, ItemInfo>,
  limit = 12,
  popular?: PopularBuckets,
): ItemSuggestion[] {
  const enemyRoles = new Set(enemies.flatMap((h) => h.roles))
  const allyRoles = new Set(allies.flatMap((h) => h.roles))
  const scored = new Map<number, ItemSuggestion>()

  const coreExclude = new Set<number>()
  for (const row of [...(popular?.starting ?? []), ...(popular?.early ?? []), ...(popular?.core ?? [])]) {
    coreExclude.add(row.id)
  }

  applyRules(COUNTER_RULES, hero, enemyRoles, allyRoles, constants, scored, true, coreExclude)
  applyRules(ALLY_RULES, hero, enemyRoles, allyRoles, constants, scored, false, coreExclude)

  // Hero-frequent late/flex picks that aren't generic counters
  addPopular(constants, scored, popular, 'popular', enemies.length ? 4 : 7)

  // If still thin (no enemies / weak rules), fill from core popularity exclusive to this hero
  if (scored.size < 5 && popular) {
    addPopular(constants, scored, popular, 'frequent', 5)
  }

  return [...scored.values()].sort((a, b) => b.priority - a.priority).slice(0, limit)
}

/** Merge timed popular lists for the Core tab */
export function buildTimedCore(
  constants: Record<number, ItemInfo>,
  openDota: PopularBuckets,
  stratz?: {
    startingItems: { itemId: number }[]
    earlyItems: { itemId: number }[]
    coreItems: { itemId: number }[]
    lateItems: { itemId: number }[]
  } | null,
): Record<'start' | 'early' | 'mid' | 'late', ItemInfo[]> {
  const take = (ids: number[], limit: number) => {
    const out: ItemInfo[] = []
    const seen = new Set<number>()
    for (const id of ids) {
      if (seen.has(id)) continue
      const item = constants[id]
      if (!item || item.isNeutral || isShopExcluded(item.shortName, item.isNeutral)) continue
      seen.add(id)
      out.push(item)
      if (out.length >= limit) break
    }
    return out
  }

  const od = {
    start: openDota.starting.map((x) => x.id),
    early: openDota.early.map((x) => x.id),
    mid: openDota.core.map((x) => x.id),
    late: openDota.luxury.map((x) => x.id),
  }

  if (stratz) {
    const sz = {
      start: stratz.startingItems.map((x) => x.itemId),
      early: stratz.earlyItems.map((x) => x.itemId),
      mid: stratz.coreItems.map((x) => x.itemId),
      late: stratz.lateItems.map((x) => x.itemId),
    }
    return {
      start: take([...sz.start, ...od.start], 6),
      early: take([...sz.early, ...od.early], 6),
      mid: take([...sz.mid, ...od.mid], 6),
      late: take([...sz.late, ...od.late], 6),
    }
  }

  return {
    start: take(od.start, 6),
    early: take(od.early, 6),
    mid: take(od.mid, 6),
    late: take(od.late, 6),
  }
}
