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
  }
}

export function mapHeroesFromApi(list: HeroList[]): Hero[] {
  return list
    .map(mapHeroFromApi)
    .sort((a, b) => a.localizedName.localeCompare(b.localizedName))
}
