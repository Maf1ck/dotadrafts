import type { ItemInfo } from './opendotaItems'

/** Rough gold/tier → win leverage for sandbox builds */
export function itemPowerScore(item: ItemInfo): number {
  if (item.isNeutral) {
    const t = item.tier ?? 3
    return 0.35 + t * 0.35 // T1 ~0.7 … T5 ~2.1
  }
  const cost = item.cost || 0
  if (cost >= 5000) return 1.4
  if (cost >= 4000) return 1.1
  if (cost >= 2800) return 0.85
  if (cost >= 1500) return 0.5
  if (cost >= 500) return 0.25
  return 0.12
}

export function scoreHeroBuild(
  itemIds: number[],
  neutralIds: number[],
  constants: Record<number, ItemInfo>,
): number {
  let score = 0
  for (const id of itemIds) {
    const info = constants[id]
    if (info) score += itemPowerScore(info)
  }
  for (const id of neutralIds) {
    const info = constants[id]
    if (info) score += itemPowerScore(info)
  }
  // Cap per-hero so one stuffed core can’t dominate
  return Math.min(6.5, score)
}

export function teamBuildScore(
  heroIds: number[],
  builds: Record<number, { items: number[]; neutrals: number[] }>,
  constants: Record<number, ItemInfo>,
): number {
  let total = 0
  for (const id of heroIds) {
    const b = builds[id]
    if (!b) continue
    total += scoreHeroBuild(b.items, b.neutrals, constants)
  }
  return total
}
