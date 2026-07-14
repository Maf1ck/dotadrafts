/**
 * Stratz GraphQL API service
 * Fetches real synergies, counters and item builds for heroes.
 *
 * Docs: https://api.stratz.com/graphiql/
 * Env: VITE_STRATZ_API_KEY in frontend/.env
 */

const STRATZ_TOKEN = (import.meta.env.VITE_STRATZ_API_KEY as string | undefined)?.trim() || ''

const STRATZ_URL = 'https://api.stratz.com/graphql'

export const hasStratzKey = Boolean(STRATZ_TOKEN)

if (!hasStratzKey) {
  console.warn('[Stratz] VITE_STRATZ_API_KEY is missing in .env — live Stratz data disabled')
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StratzMatchupEntry {
  heroId2: number
  winCount: number
  matchCount: number
  /** win rate for the queried hero WHEN vs heroId2 */
  winRate: number
}

export interface StratzSynergyEntry {
  heroId2: number
  winCount: number
  matchCount: number
  /** win rate when queried hero is WITH heroId2 */
  winRate: number
}

export interface StratzHeroMatchup {
  counters: StratzMatchupEntry[]   // heroes that BEAT the queried hero
  synergies: StratzSynergyEntry[]  // heroes that PAIR well WITH queried hero
}

export interface StratzItemEntry {
  itemId: number
  matchCount: number
  winCount: number
  winRate: number
  /** avg game time in seconds when item is purchased */
  avgPurchaseTime: number
}

export interface StratzHeroItems {
  startingItems: StratzItemEntry[]
  earlyItems: StratzItemEntry[]
  coreItems: StratzItemEntry[]
  lateItems: StratzItemEntry[]
}

// ─── Internal cache ───────────────────────────────────────────────────────────

const matchupCache = new Map<number, StratzHeroMatchup>()
const itemCache = new Map<number, StratzHeroItems>()
const inflight = new Map<number, Promise<StratzHeroMatchup>>()
const itemInflight = new Map<number, Promise<StratzHeroItems>>()

// ─── GraphQL helper ───────────────────────────────────────────────────────────

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  if (!STRATZ_TOKEN) {
    throw new Error('VITE_STRATZ_API_KEY is not set')
  }

  const res = await fetch(STRATZ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${STRATZ_TOKEN}`,
    },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) throw new Error(`Stratz HTTP ${res.status}`)
  const json = await res.json()
  if (json.errors?.length) throw new Error(json.errors[0].message)
  return json.data as T
}

// ─── Hero matchups (counters + synergies) ─────────────────────────────────────

/**
 * Fetches hero vs hero data from Stratz:
 *   - counters: heroes with HIGH win rate AGAINST the queried hero
 *   - synergies: heroes with HIGH win rate TOGETHER WITH the queried hero
 *
 * Uses `heroMatchup` query which returns matchup rows with:
 *   winRateHeroWins  — times THIS hero won when matched vs opponent
 *   with / vs arrays
 */
export async function fetchHeroMatchup(heroId: number): Promise<StratzHeroMatchup> {
  const cached = matchupCache.get(heroId)
  if (cached) return cached

  const pending = inflight.get(heroId)
  if (pending) return pending

  const promise = (async (): Promise<StratzHeroMatchup> => {
    try {
      const data = await gql<{
        heroStats: {
          heroVsHeroMatchup: {
            advantage: {
              heroId: number
              with: { heroId2: number; winCount: number; matchCount: number }[]
              vs: { heroId2: number; winCount: number; matchCount: number }[]
            }[]
          }
        }
      }>(
        `query HeroMatchup($heroId: Short!) {
          heroStats {
            heroVsHeroMatchup(heroId: $heroId) {
              advantage {
                heroId
                with {
                  heroId2
                  winCount
                  matchCount
                }
                vs {
                  heroId2
                  winCount
                  matchCount
                }
              }
            }
          }
        }`,
        { heroId },
      )

      const rows = data.heroStats.heroVsHeroMatchup.advantage
      const row = rows.find((r) => r.heroId === heroId)

      if (!row) {
        const empty = { counters: [], synergies: [] }
        matchupCache.set(heroId, empty)
        return empty
      }

      // counters: heroes where THIS hero loses (low winRate for the hero → hero is countered)
      // row.vs[i] = { heroId2, winCount, matchCount }
      // winRate here = hero win rate when AGAINST heroId2
      // Low winRate → heroId2 counters the hero
      const counters: StratzMatchupEntry[] = row.vs
        .filter((v) => v.matchCount >= 100)
        .map((v) => ({
          heroId2: v.heroId2,
          winCount: v.winCount,
          matchCount: v.matchCount,
          winRate: v.matchCount > 0 ? (v.winCount / v.matchCount) * 100 : 50,
        }))
        .sort((a, b) => a.winRate - b.winRate) // lowest winRate first = best counter
        .slice(0, 8)

      // synergies: heroes where THIS hero wins most when playing together
      // row.with[i] = { heroId2, winCount, matchCount }
      // winRate = win rate when hero plays alongside heroId2
      const synergies: StratzSynergyEntry[] = row.with
        .filter((w) => w.matchCount >= 100)
        .map((w) => ({
          heroId2: w.heroId2,
          winCount: w.winCount,
          matchCount: w.matchCount,
          winRate: w.matchCount > 0 ? (w.winCount / w.matchCount) * 100 : 50,
        }))
        .sort((a, b) => b.winRate - a.winRate) // highest winRate first = best synergy
        .slice(0, 8)

      const result = { counters, synergies }
      matchupCache.set(heroId, result)
      return result
    } catch (e) {
      console.warn(`[Stratz] matchup fetch failed for hero ${heroId}:`, e)
      const empty = { counters: [], synergies: [] }
      matchupCache.set(heroId, empty)
      return empty
    } finally {
      inflight.delete(heroId)
    }
  })()

  inflight.set(heroId, promise)
  return promise
}

// ─── Hero items ───────────────────────────────────────────────────────────────

/**
 * Fetches popular item builds for a hero from Stratz.
 * Categorizes by avg purchase time into starting/early/core/late buckets.
 */
export async function fetchHeroItems(heroId: number): Promise<StratzHeroItems> {
  const cached = itemCache.get(heroId)
  if (cached) return cached

  const pending = itemInflight.get(heroId)
  if (pending) return pending

  const promise = (async (): Promise<StratzHeroItems> => {
    try {
      const data = await gql<{
        heroStats: {
          itemBootstrap: {
            itemId: number
            matchCount: number
            winCount: number
            avgPurchaseTime: number
          }[]
        }
      }>(
        `query HeroItems($heroId: Short!) {
          heroStats {
            itemBootstrap(heroId: $heroId) {
              itemId
              matchCount
              winCount
              avgPurchaseTime
            }
          }
        }`,
        { heroId },
      )

      const items = data.heroStats.itemBootstrap
        .filter((i) => i.matchCount >= 20 && i.itemId > 0)
        .map((i) => ({
          itemId: i.itemId,
          matchCount: i.matchCount,
          winCount: i.winCount,
          winRate: i.matchCount > 0 ? (i.winCount / i.matchCount) * 100 : 50,
          avgPurchaseTime: i.avgPurchaseTime,
        }))

      // Categorize by purchase time (seconds)
      // Starting:  0 – 90s  (pre-min 1.5)
      // Early:    91 – 600s  (1.5 – 10 min)
      // Core:    601 – 2400s  (10 – 40 min)
      // Late:   2401+s        (40+ min)
      const startingItems = items
        .filter((i) => i.avgPurchaseTime <= 90)
        .sort((a, b) => b.matchCount - a.matchCount)
        .slice(0, 6)

      const earlyItems = items
        .filter((i) => i.avgPurchaseTime > 90 && i.avgPurchaseTime <= 600)
        .sort((a, b) => b.matchCount - a.matchCount)
        .slice(0, 5)

      const coreItems = items
        .filter((i) => i.avgPurchaseTime > 600 && i.avgPurchaseTime <= 2400)
        .sort((a, b) => b.winRate - a.winRate)
        .slice(0, 5)

      const lateItems = items
        .filter((i) => i.avgPurchaseTime > 2400)
        .sort((a, b) => b.winRate - a.winRate)
        .slice(0, 4)

      const result = { startingItems, earlyItems, coreItems, lateItems }
      itemCache.set(heroId, result)
      return result
    } catch (e) {
      console.warn(`[Stratz] items fetch failed for hero ${heroId}:`, e)
      const empty = { startingItems: [], earlyItems: [], coreItems: [], lateItems: [] }
      itemCache.set(heroId, empty)
      return empty
    } finally {
      itemInflight.delete(heroId)
    }
  })()

  itemInflight.set(heroId, promise)
  return promise
}

// ─── Item name resolution ─────────────────────────────────────────────────────

/** Stratz item constants cache */
let itemConstantsCache: Record<string, { displayName: string; shortName: string }> | null = null

export interface StratzItemMeta {
  id: number
  displayName: string
  shortName: string
  isNeutral: boolean | null
  neutralTier: number | null
  cost: number | null
}

let stratzItemMetaCache: StratzItemMeta[] | null = null
let stratzItemMetaPromise: Promise<StratzItemMeta[]> | null = null

export function clearStratzItemMetaCache() {
  stratzItemMetaCache = null
  stratzItemMetaPromise = null
  itemConstantsCache = null
}

/**
 * Fetch full item catalog from Stratz constants.
 * Tries richest field set first; peels fields if schema rejects them.
 */
export async function fetchStratzItemMeta(): Promise<StratzItemMeta[]> {
  if (stratzItemMetaCache) return stratzItemMetaCache
  if (stratzItemMetaPromise) return stratzItemMetaPromise
  if (!STRATZ_TOKEN) return []

  stratzItemMetaPromise = (async () => {
    const fieldSets = [
      'id displayName shortName isNeutral neutralItemTier cost',
      'id displayName shortName isNeutral neutralItemTier',
      'id displayName shortName isNeutral cost',
      'id displayName shortName cost',
      'id displayName shortName',
    ]

    const tryQuery = async (fields: string) => {
      const data = await gql<{
        constants: {
          items: {
            id: number
            displayName?: string | null
            shortName?: string | null
            isNeutral?: boolean | null
            neutralItemTier?: number | null
            cost?: number | null
          }[]
        }
      }>(
        `{
          constants {
            items {
              ${fields}
            }
          }
        }`,
      )
      return (data.constants.items ?? [])
        .filter((item) => typeof item.id === 'number' && item.id > 0)
        .map((item) => ({
          id: item.id,
          displayName: item.displayName?.trim() || item.shortName || String(item.id),
          shortName: (item.shortName || '').replace(/^item_/, ''),
          isNeutral: typeof item.isNeutral === 'boolean' ? item.isNeutral : null,
          neutralTier:
            typeof item.neutralItemTier === 'number' ? item.neutralItemTier : null,
          cost: typeof item.cost === 'number' ? item.cost : null,
        }))
    }

    try {
      let lastError: unknown = null
      for (const fields of fieldSets) {
        try {
          stratzItemMetaCache = await tryQuery(fields)
          if (stratzItemMetaCache.length) return stratzItemMetaCache
        } catch (e) {
          lastError = e
        }
      }
      if (lastError) console.warn('[Stratz] item meta fetch failed:', lastError)
      stratzItemMetaCache = []
      return stratzItemMetaCache
    } finally {
      stratzItemMetaPromise = null
    }
  })()

  return stratzItemMetaPromise
}

export async function fetchItemConstants(): Promise<
  Record<string, { displayName: string; shortName: string }>
> {
  if (itemConstantsCache) return itemConstantsCache

  try {
    const meta = await fetchStratzItemMeta()
    if (meta.length) {
      const map: Record<string, { displayName: string; shortName: string }> = {}
      for (const item of meta) {
        map[String(item.id)] = {
          displayName: item.displayName,
          shortName: item.shortName,
        }
      }
      itemConstantsCache = map
      return map
    }
    throw new Error('empty Stratz item meta')
  } catch (e) {
    console.warn('[Stratz] failed to fetch item constants, trying OpenDota fallback:', e)
    try {
      const res = await fetch('https://api.opendota.com/api/constants/items')
      if (res.ok) {
        const data = await res.json()
        const map: Record<string, { displayName: string; shortName: string }> = {}
        for (const [sName, item] of Object.entries(data)) {
          const id = (item as any).id
          if (id) {
            map[String(id)] = {
              displayName: (item as any).dname || sName,
              shortName: sName,
            }
          }
        }
        itemConstantsCache = map
        return map
      }
    } catch (err) {
      console.error('[Fallback] OpenDota items fetch failed:', err)
    }
    itemConstantsCache = {}
    return {}
  }
}

/** Build CDN image URL for an item by its Stratz shortName */
export function itemImageUrl(shortName: string): string {
  return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/${shortName}.png`
}
