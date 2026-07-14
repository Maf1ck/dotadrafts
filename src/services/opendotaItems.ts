/**
 * OpenDota item builds — reliable fallback when Stratz is blocked / empty.
 */

export interface ItemInfo {
  id: number
  shortName: string
  displayName: string
  imageUrl: string
}

export interface PopularityBucket {
  itemId: number
  count: number
}

export interface HeroItemPopularity {
  starting: PopularityBucket[]
  early: PopularityBucket[]
  mid: PopularityBucket[]
  late: PopularityBucket[]
}

let constantsCache: Record<number, ItemInfo> | null = null
let constantsPromise: Promise<Record<number, ItemInfo>> | null = null

const popularityCache = new Map<number, HeroItemPopularity>()
const popularityInflight = new Map<number, Promise<HeroItemPopularity>>()

export function itemCdnUrl(shortName: string): string {
  return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/${shortName}.png`
}

export async function fetchItemConstantsMap(): Promise<Record<number, ItemInfo>> {
  if (constantsCache) return constantsCache
  if (constantsPromise) return constantsPromise

  constantsPromise = (async () => {
    try {
      const res = await fetch('https://api.opendota.com/api/constants/items')
      if (!res.ok) throw new Error(`OpenDota constants ${res.status}`)
      const data: Record<string, { id?: number; dname?: string }> = await res.json()
      const map: Record<number, ItemInfo> = {}
      for (const [shortName, item] of Object.entries(data)) {
        if (typeof item?.id !== 'number' || item.id <= 0) continue
        map[item.id] = {
          id: item.id,
          shortName,
          displayName: item.dname || shortName,
          imageUrl: itemCdnUrl(shortName),
        }
      }
      constantsCache = map
      return map
    } catch (e) {
      console.warn('[OpenDota] constants/items failed:', e)
      constantsCache = {}
      return constantsCache
    } finally {
      constantsPromise = null
    }
  })()

  return constantsPromise
}

function sortBuckets(raw: Record<string, number> | undefined, limit: number): PopularityBucket[] {
  if (!raw) return []
  return Object.entries(raw)
    .map(([id, count]) => ({ itemId: Number(id), count: Number(count) }))
    .filter((b) => b.itemId > 0 && b.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

export async function fetchHeroItemPopularity(heroId: number): Promise<HeroItemPopularity> {
  const cached = popularityCache.get(heroId)
  if (cached) return cached

  const pending = popularityInflight.get(heroId)
  if (pending) return pending

  const promise = (async (): Promise<HeroItemPopularity> => {
    try {
      const res = await fetch(`https://api.opendota.com/api/heroes/${heroId}/itemPopularity`)
      if (!res.ok) throw new Error(`itemPopularity ${res.status}`)
      const data = await res.json()
      const result: HeroItemPopularity = {
        starting: sortBuckets(data.start_game_items, 6),
        early: sortBuckets(data.early_game_items, 6),
        mid: sortBuckets(data.mid_game_items, 6),
        late: sortBuckets(data.late_game_items, 5),
      }
      popularityCache.set(heroId, result)
      return result
    } catch (e) {
      console.warn(`[OpenDota] itemPopularity failed for ${heroId}:`, e)
      const empty = { starting: [], early: [], mid: [], late: [] }
      popularityCache.set(heroId, empty)
      return empty
    } finally {
      popularityInflight.delete(heroId)
    }
  })()

  popularityInflight.set(heroId, promise)
  return promise
}

export function resolvePopularItems(
  buckets: PopularityBucket[],
  constants: Record<number, ItemInfo>,
): { id: number; name: string; imageUrl: string; count: number }[] {
  const out: { id: number; name: string; imageUrl: string; count: number }[] = []
  for (const b of buckets) {
    const info = constants[b.itemId]
    if (!info) continue
    out.push({
      id: info.id,
      name: info.displayName,
      imageUrl: info.imageUrl,
      count: b.count,
    })
  }
  return out
}
