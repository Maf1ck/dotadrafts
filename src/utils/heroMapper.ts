import type { Hero, HeroList } from '../types/draft'

const HERO_IMG_BASE =
  'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes'

export function heroShortName(apiName: string): string {
  return apiName.replace('npc_dota_hero_', '')
}

export function heroImageUrl(apiName: string): string {
  return `${HERO_IMG_BASE}/${heroShortName(apiName)}.png`
}

export function mapHeroFromApi(raw: HeroList): Hero {
  return {
    id: raw.id,
    name: heroShortName(raw.name),
    localizedName: raw.localized_name,
    imageUrl: heroImageUrl(raw.name),
    roles: raw.roles as Hero['roles'],
    primaryAttr: raw.primary_attr,
    // Base stats — populated when fetched from /heroStats (not /heroes)
    baseStr: raw.base_str ?? 20,
    baseAgi: raw.base_agi ?? 20,
    baseInt: raw.base_int ?? 20,
    strGain: raw.str_gain ?? 2.0,
    agiGain: raw.agi_gain ?? 2.0,
    intGain: raw.int_gain ?? 2.0,
    baseArmor: raw.base_armor ?? 0,
    baseAttackMin: raw.base_attack_min ?? 25,
    baseAttackMax: raw.base_attack_max ?? 35,
    attackRange: raw.attack_range ?? 150,
    moveSpeed: raw.move_speed ?? 300,
    attackRate: raw.attack_rate ?? 1.7,
    attackType: (raw.attack_type === 'Ranged' ? 'Ranged' : 'Melee') as Hero['attackType'],
  }
}

export function mapHeroesFromApi(list: HeroList[]): Hero[] {
  return list
    .map(mapHeroFromApi)
    .sort((a, b) => a.localizedName.localeCompare(b.localizedName))
}
