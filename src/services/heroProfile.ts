/**
 * Derive simple profile metrics for a hero (0–100) for build impact UI.
 * Uses roles, attributes, armor/MS and published win rate — not fake match data.
 */
import type { Hero } from '../types/draft'

export interface HeroProfileMetrics {
  winRate: number
  survivability: number
  lanePressure: number
  teamfight: number
  scaling: number
  burst: number
  radar: { key: string; value: number }[]
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(n)))
}

export function computeHeroProfile(hero: Hero, winRate = 50): HeroProfileMetrics {
  const roles = new Set(hero.roles)
  const isCarry = roles.has('Carry')
  const isSupport = roles.has('Support')
  const isNuker = roles.has('Nuker')
  const isInit = roles.has('Initiator')
  const isDisabler = roles.has('Disabler')
  const isDurable = roles.has('Durable')
  const isEscape = roles.has('Escape')
  const isPusher = roles.has('Pusher')
  const melee = hero.attackType === 'Melee'

  const armorScore = clamp(40 + hero.baseArmor * 4)
  const msScore = clamp((hero.moveSpeed - 280) * 1.2 + 45)
  const dmgScore = clamp(((hero.baseAttackMin + hero.baseAttackMax) / 2 - 25) * 1.5 + 45)

  const survivability = clamp(
    (isDurable ? 28 : 0) +
      (isSupport ? 8 : 0) +
      (isEscape ? 10 : 0) +
      armorScore * 0.35 +
      (hero.primaryAttr === 'str' ? 18 : 6) +
      (melee ? 6 : 0),
  )

  const lanePressure = clamp(
    (isCarry ? 22 : 0) +
      (isNuker ? 16 : 0) +
      (isPusher ? 12 : 0) +
      (isSupport ? -8 : 0) +
      dmgScore * 0.35 +
      (hero.attackRange > 400 ? 8 : 0) +
      20,
  )

  const teamfight = clamp(
    (isInit ? 26 : 0) +
      (isDisabler ? 22 : 0) +
      (isNuker ? 14 : 0) +
      (isDurable ? 10 : 0) +
      (isSupport ? 12 : 0) +
      18,
  )

  const scaling = clamp(
    (isCarry ? 32 : 0) +
      (isEscape ? 10 : 0) +
      (hero.primaryAttr === 'agi' ? 16 : hero.primaryAttr === 'int' ? 10 : 8) +
      (isPusher ? 8 : 0) +
      (isSupport ? -6 : 0) +
      22,
  )

  const burst = clamp(
    (isNuker ? 28 : 0) +
      (isCarry ? 14 : 0) +
      (isInit ? 8 : 0) +
      dmgScore * 0.3 +
      (hero.primaryAttr === 'int' ? 12 : 4) +
      18,
  )

  const wr = clamp(winRate)

  return {
    winRate: wr,
    survivability,
    lanePressure,
    teamfight,
    scaling,
    burst,
    radar: [
      { key: 'win', value: wr },
      { key: 'scale', value: scaling },
      { key: 'burst', value: burst },
      { key: 'fight', value: teamfight },
      { key: 'lane', value: lanePressure },
      { key: 'survive', value: survivability },
    ],
  }
}
