/**
 * Primary / secondary positions for heroes whose OpenDota role tags
 * misrepresent where they actually play (e.g. Bounty Hunter as mid).
 * Position: 1 Carry · 2 Mid · 3 Offlane · 4 Soft Support · 5 Hard Support
 */
export type HeroPosition = 1 | 2 | 3 | 4 | 5

/** Hero internal name (without npc_dota_hero_) → preferred positions (best first) */
export const HERO_PRIMARY_POSITIONS: Record<string, HeroPosition[]> = {
  // Supports often tagged without Support / with Nuker → wrongly suggested mid
  bounty_hunter: [4, 5],
  vengefulspirit: [5, 4],
  shadow_shaman: [5, 4],
  witch_doctor: [5, 4],
  jakiro: [5, 4],
  crystal_maiden: [5],
  disruptor: [5, 4],
  ancient_apparition: [5, 4],
  warlock: [5],
  undying: [5, 4],
  oracle: [5],
  winter_wyvern: [5, 4],
  grimstroke: [5, 4],
  shadow_demon: [5, 4],
  bane: [5, 4],
  lion: [5, 4],
  lich: [5],
  dazzle: [5],
  treant: [5, 4],
  abaddon: [5, 3, 4],
  omniknight: [5, 3],
  chen: [5],
  enchantress: [5, 4],
  io: [5],
  phoenix: [4, 5],
  earth_spirit: [4],
  sniper: [2, 1],
  silencer: [5, 2, 4],
  nyx_assassin: [4],
  riki: [4, 1],
  techies: [4, 5],
  tusk: [4, 3],
  clockwerk: [4, 3],
  dark_willow: [4, 5],
  hoodwink: [4, 5, 1],
  marci: [4, 1],
  snapfire: [4, 5],
  ringmaster: [5, 4],
  // Typical offlaners
  axe: [3],
  tidehunter: [3],
  centaur: [3],
  dark_seer: [3],
  underlord: [3],
  mars: [3],
  brewmaster: [3],
  beastmaster: [3],
  dawnbreaker: [3, 4],
  legion_commander: [3],
  slardar: [3],
  bristleback: [3, 1],
  sand_king: [3],
  broodmother: [3, 2],
  lycan: [3, 1],
  necrolyte: [3, 2],
  abyssal_underlord: [3],
  // Typical mids
  invoker: [2],
  storm_spirit: [2],
  queenofpain: [2],
  puck: [2],
  death_prophet: [2, 3],
  leshrac: [2, 3],
  zuus: [2],
  huskar: [2],
  meepo: [2, 1],
  dragon_knight: [2, 3],
  primal_beast: [3, 2],
  magnataur: [3, 2],
  tiny: [2, 4],
  // Typical carries
  antimage: [1],
  spectre: [1],
  terrorblade: [1],
  medusa: [1],
  phantom_assassin: [1],
  faceless_void: [1],
  juggernaut: [1],
  luna: [1],
  morphling: [1, 2],
  sven: [1],
  slark: [1],
  ursa: [1],
  troll_warlord: [1],
  chaos_knight: [1, 3],
  life_stealer: [1],
  monkey_king: [1, 2, 4],
  // Flex cores that are NOT mid first
  spirit_breaker: [4, 3],
  mirana: [4, 2, 1],
  windrunner: [2, 4, 1],
  nature_prophet: [4, 3, 2],
  earthshaker: [4, 3],
  pudge: [4, 3],
}

export function shortHeroName(name: string): string {
  return name.replace(/^npc_dota_hero_/, '')
}

export function getPrimaryPositions(heroName: string): HeroPosition[] | null {
  return HERO_PRIMARY_POSITIONS[shortHeroName(heroName)] ?? null
}

export function getBestPosition(heroName: string): HeroPosition | null {
  const list = getPrimaryPositions(heroName)
  return list?.[0] ?? null
}

const POSITION_LABELS: Record<HeroPosition, string> = {
  1: 'Safe Lane (Position 1)',
  2: 'Mid Lane (Position 2)',
  3: 'Offlane (Position 3)',
  4: 'Soft Support (Position 4)',
  5: 'Hard Support (Position 5)',
}

export function suggestedLaneLabel(heroName: string, roles: string[]): string {
  const best = getBestPosition(heroName)
  if (best) return POSITION_LABELS[best]

  // Prefer Support before Carry — many dual-role heroes play support in pubs
  if (roles.includes('Support')) return 'Hard/Soft Support (Position 4/5)'
  if (roles.includes('Carry')) return 'Safe Lane (Position 1)'
  if (roles.includes('Initiator') && roles.includes('Durable')) return 'Offlane (Position 3)'
  if (roles.includes('Nuker') && !roles.includes('Escape')) return 'Mid Lane (Position 2)'
  return 'Flex / situational'
}
