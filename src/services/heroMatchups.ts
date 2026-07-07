/** OpenDota matchup cache: enemyHeroId -> (candidateHeroId -> enemy win rate %) */
const enemyMatchupCache = new Map<number, Map<number, number>>()
const inflight = new Map<number, Promise<Map<number, number>>>()

export type EnemyMatchupData = Map<number, Map<number, number>>

export async function fetchEnemyMatchups(enemyHeroId: number): Promise<Map<number, number>> {
  const cached = enemyMatchupCache.get(enemyHeroId)
  if (cached) return cached

  const pending = inflight.get(enemyHeroId)
  if (pending) return pending

  const promise = (async () => {
    try {
      const res = await fetch(`https://api.opendota.com/api/heroes/${enemyHeroId}/matchups`)
      if (!res.ok) return new Map<number, number>()
      const rows: { hero_id: number; games_played: number; wins: number }[] = await res.json()
      const map = new Map<number, number>()
      for (const row of rows) {
        if (row.games_played >= 80) {
          map.set(row.hero_id, (row.wins / row.games_played) * 100)
        }
      }
      enemyMatchupCache.set(enemyHeroId, map)
      return map
    } catch {
      return new Map<number, number>()
    } finally {
      inflight.delete(enemyHeroId)
    }
  })()

  inflight.set(enemyHeroId, promise)
  return promise
}

export async function loadMatchupsForEnemies(enemyIds: number[]): Promise<EnemyMatchupData> {
  const data: EnemyMatchupData = new Map()
  await Promise.all(
    enemyIds.map(async (id) => {
      const map = await fetchEnemyMatchups(id)
      data.set(id, map)
    }),
  )
  return data
}

/**
 * How good is `candidate` vs enemy team based on OpenDota matchup win rates.
 * Uses enemy's historical win rate vs candidate — lower enemy WR = better for candidate.
 */
export function scoreCandidateVsEnemies(
  candidateId: number,
  enemyIds: number[],
  matchupData: EnemyMatchupData,
): { bonus: number; details: string[] } {
  if (!enemyIds.length || !matchupData.size) return { bonus: 0, details: [] }

  const details: string[] = []
  let totalDelta = 0
  let count = 0

  for (const enemyId of enemyIds) {
    const enemyMap = matchupData.get(enemyId)
    if (!enemyMap) continue
    const enemyWrVsCandidate = enemyMap.get(candidateId)
    if (enemyWrVsCandidate === undefined) continue

    // enemy WR 40% => candidate advantaged (+10 scaled)
    const delta = 50 - enemyWrVsCandidate
    totalDelta += delta
    count++
    if (delta >= 4) details.push(`слабкий проти ворога #${enemyId}`)
    if (delta <= -4) details.push(`поганий матчап`)
  }

  if (!count) return { bonus: 0, details: [] }

  const avgDelta = totalDelta / count
  return {
    bonus: avgDelta * 0.35,
    details: details.slice(0, 2),
  }
}
