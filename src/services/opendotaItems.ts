/**
 * Item constants catalog.
 * Primary: Stratz GraphQL constants (neutral flags, tiers, costs).
 * Fallback: OpenDota constants (+ patch allowlists).
 * Images always via Steam CDN shortName.
 */
import {
  isHiddenCatalogItem,
  isCurrentNeutral,
  isShopExcluded,
  neutralTierFor,
  normalizeShortName,
  CYCLED_NEUTRAL_SHORTNAMES,
} from '../data/patchItems'
import {
  clearStratzItemMetaCache,
  fetchStratzItemMeta,
  type StratzItemMeta,
} from './stratz'

export interface ItemInfo {
  id: number
  shortName: string
  displayName: string
  imageUrl: string
  /** Neutral artifact tier 1–5 when known */
  tier: number | null
  isNeutral: boolean
  cost: number
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

/** Force reload after patch-list updates (HMR / testing) */
export function clearItemConstantsCache() {
  constantsCache = null
  clearStratzItemMetaCache()
}

function resolveIsNeutral(sn: string, stratzNeutral: boolean | null): boolean {
  if (stratzNeutral === true) {
    // Trust Stratz current patch, but drop known cycled leftovers
    if (CYCLED_NEUTRAL_SHORTNAMES.has(sn) && !isCurrentNeutral(sn)) return false
    return true
  }
  if (stratzNeutral === false) return isCurrentNeutral(sn)
  return isCurrentNeutral(sn)
}

function toItemInfo(opts: {
  id: number
  shortName: string
  displayName: string
  isNeutral: boolean
  tier: number | null
  cost: number
}): ItemInfo | null {
  const sn = normalizeShortName(opts.shortName)
  if (!sn) return null
  if (isHiddenCatalogItem(sn, opts.displayName)) return null
  if (opts.isNeutral && !isCurrentNeutral(sn) && CYCLED_NEUTRAL_SHORTNAMES.has(sn)) {
    return null
  }
  // Neutrals must be on the current patch list (or enchanted)
  if (opts.isNeutral && !isCurrentNeutral(sn)) return null
  if (!opts.isNeutral && isShopExcluded(sn, false)) return null

  return {
    id: opts.id,
    shortName: sn,
    displayName: opts.displayName || sn,
    imageUrl: itemCdnUrl(sn),
    tier: opts.isNeutral ? opts.tier ?? neutralTierFor(sn) : null,
    isNeutral: opts.isNeutral,
    cost: opts.cost,
  }
}

function buildFromStratz(meta: StratzItemMeta[]): Record<number, ItemInfo> {
  const map: Record<number, ItemInfo> = {}
  for (const m of meta) {
    const sn = normalizeShortName(m.shortName)
    const isNeutral = resolveIsNeutral(sn, m.isNeutral)
    const info = toItemInfo({
      id: m.id,
      shortName: sn,
      displayName: m.displayName,
      isNeutral,
      tier: m.neutralTier ?? neutralTierFor(sn),
      cost: m.cost ?? 0,
    })
    if (info) map[info.id] = info
  }
  return map
}

async function fetchOpenDotaRaw(): Promise<
  Record<string, { id?: number; dname?: string; tier?: number; cost?: number }>
> {
  const odRes = await fetch('https://api.opendota.com/api/constants/items')
  if (!odRes.ok) throw new Error(`OpenDota constants ${odRes.status}`)
  return odRes.json()
}

function buildFromOpenDota(
  data: Record<string, { id?: number; dname?: string; tier?: number; cost?: number }>,
  stratzById?: Map<number, StratzItemMeta>,
  stratzByShort?: Map<string, StratzItemMeta>,
): Record<number, ItemInfo> {
  const map: Record<number, ItemInfo> = {}
  for (const [shortName, item] of Object.entries(data)) {
    if (typeof item?.id !== 'number' || item.id <= 0) continue
    const sn = normalizeShortName(shortName)
    const displayName = item.dname || shortName
    const stratz = stratzById?.get(item.id) ?? stratzByShort?.get(sn)
    const openDotaTier = typeof item.tier === 'number' ? item.tier : null

    let isNeutral = resolveIsNeutral(sn, stratz?.isNeutral ?? null)
    // OpenDota still tags many cycled neutrals with tier — skip unknowns
    if (openDotaTier != null && !isNeutral) continue
    if (stratz?.isNeutral === true && !isCurrentNeutral(sn)) continue

    const info = toItemInfo({
      id: item.id,
      shortName: sn,
      displayName: stratz?.displayName || displayName,
      isNeutral,
      tier: isNeutral
        ? neutralTierFor(sn) ?? openDotaTier ?? stratz?.neutralTier ?? null
        : null,
      cost: stratz?.cost ?? (typeof item.cost === 'number' ? item.cost : 0),
    })
    if (info) map[info.id] = info
  }
  return map
}

export function fetchItemConstantsMap(): Promise<Record<number, ItemInfo>> {
  if (constantsCache) return Promise.resolve(constantsCache)
  if (constantsPromise) return constantsPromise

  constantsPromise = (async () => {
    try {
      // 1) Stratz-first
      const stratzMeta = await fetchStratzItemMeta().catch(() => [] as StratzItemMeta[])
      if (stratzMeta.length) {
        const fromStratz = buildFromStratz(stratzMeta)
        // Fill missing cost / gaps from OpenDota when possible
        try {
          const od = await fetchOpenDotaRaw()
          for (const [shortName, item] of Object.entries(od)) {
            if (typeof item?.id !== 'number') continue
            const sn = normalizeShortName(shortName)
            const existing = fromStratz[item.id]
            if (existing) {
              if (!existing.cost && typeof item.cost === 'number') {
                existing.cost = item.cost
              }
              if (existing.isNeutral && existing.tier == null && typeof item.tier === 'number') {
                existing.tier = item.tier
              }
              continue
            }
            // Current neutrals missing from Stratz but present in OD
            if (!isCurrentNeutral(sn)) continue
            const info = toItemInfo({
              id: item.id,
              shortName: sn,
              displayName: item.dname || sn,
              isNeutral: true,
              tier: neutralTierFor(sn) ?? (typeof item.tier === 'number' ? item.tier : null),
              cost: 0,
            })
            if (info) fromStratz[info.id] = info
          }
        } catch {
          /* CDN/cost enrichment optional */
        }
        constantsCache = fromStratz
        return fromStratz
      }

      // 2) OpenDota fallback (no Stratz key / empty response)
      console.warn('[Items] Stratz unavailable — falling back to OpenDota constants')
      const od = await fetchOpenDotaRaw()
      constantsCache = buildFromOpenDota(od)
      return constantsCache
    } catch (e) {
      console.warn('[Items] constants fetch failed:', e)
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
    if (info.isNeutral || isShopExcluded(info.shortName, info.isNeutral)) continue
    out.push({
      id: info.id,
      name: info.displayName,
      imageUrl: info.imageUrl,
      count: b.count,
    })
  }
  return out
}

export function listShopItems(constants: Record<number, ItemInfo>): ItemInfo[] {
  return Object.values(constants)
    .filter((i) => !isShopExcluded(i.shortName, i.isNeutral))
    .filter((i) => !i.isNeutral)
    .sort((a, b) => a.displayName.localeCompare(b.displayName))
}

export function listNeutralItems(constants: Record<number, ItemInfo>): ItemInfo[] {
  return Object.values(constants)
    .filter((i) => i.isNeutral && isCurrentNeutral(i.shortName))
    .sort(
      (a, b) =>
        (a.tier ?? 99) - (b.tier ?? 99) || a.displayName.localeCompare(b.displayName),
    )
}

export interface HeroBenchmarks {
  gpm: number
  xpm: number
  kda: number
  lastHits: number
  heroDamage: number
}

const benchCache = new Map<number, HeroBenchmarks>()
const benchInflight = new Map<number, Promise<HeroBenchmarks>>()

function percentile50(rows: { percentile: number; value: number }[] | undefined): number {
  if (!rows?.length) return 0
  const sorted = [...rows].sort((a, b) => a.percentile - b.percentile)
  const hit = sorted.find((r) => r.percentile >= 0.5) ?? sorted[sorted.length - 1]
  return hit?.value ?? 0
}

export async function fetchHeroBenchmarks(heroId: number): Promise<HeroBenchmarks> {
  const cached = benchCache.get(heroId)
  if (cached) return cached
  const pending = benchInflight.get(heroId)
  if (pending) return pending

  const promise = (async (): Promise<HeroBenchmarks> => {
    try {
      const res = await fetch(`https://api.opendota.com/api/benchmarks?hero_id=${heroId}`)
      if (!res.ok) throw new Error(`benchmarks ${res.status}`)
      const data = await res.json()
      const r = data.result ?? {}
      const gpm = percentile50(r.gold_per_min)
      const xpm = percentile50(r.xp_per_min)
      const kills = percentile50(r.kills_per_min)
      const deaths = percentile50(r.deaths_per_min) || 0.01
      const assists = percentile50(r.assists_per_min)
      const result: HeroBenchmarks = {
        gpm: Math.round(gpm),
        xpm: Math.round(xpm),
        kda: Math.round(((kills + assists) / deaths) * 10) / 10,
        lastHits: Math.round(percentile50(r.last_hits_per_min) * 40),
        heroDamage: Math.round(percentile50(r.hero_damage_per_min)),
      }
      benchCache.set(heroId, result)
      return result
    } catch (e) {
      console.warn(`[OpenDota] benchmarks failed for ${heroId}:`, e)
      const empty = { gpm: 0, xpm: 0, kda: 0, lastHits: 0, heroDamage: 0 }
      benchCache.set(heroId, empty)
      return empty
    } finally {
      benchInflight.delete(heroId)
    }
  })()

  benchInflight.set(heroId, promise)
  return promise
}
