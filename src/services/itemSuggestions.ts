import type { Hero } from '../types/draft'
import type { ItemInfo } from './opendotaItems'

export interface ItemSuggestion {
  item: ItemInfo
  reason: string
  priority: number
}

/** Item shortName → when to suggest based on enemy roles */
const COUNTER_ITEMS: {
  shortNames: string[]
  againstRoles: string[]
  reason: string
  priority: number
}[] = [
  {
    shortNames: ['black_king_bar'],
    againstRoles: ['Disabler', 'Nuker', 'Initiator'],
    reason: 'Spell immunity vs heavy CC / magic',
    priority: 10,
  },
  {
    shortNames: ['blade_mail'],
    againstRoles: ['Carry', 'Nuker'],
    reason: 'Reflect vs bursty cores',
    priority: 7,
  },
  {
    shortNames: ['ghost'],
    againstRoles: ['Carry'],
    reason: 'Ethereal vs physical cores',
    priority: 6,
  },
  {
    shortNames: ['force_staff', 'hurricane_pike'],
    againstRoles: ['Initiator', 'Disabler'],
    reason: 'Displace / escape initiators',
    priority: 7,
  },
  {
    shortNames: ['glimmer_cape'],
    againstRoles: ['Nuker', 'Carry'],
    reason: 'Invis save vs burst',
    priority: 6,
  },
  {
    shortNames: ['pipe'],
    againstRoles: ['Nuker'],
    reason: 'Magic resistance for the team',
    priority: 8,
  },
  {
    shortNames: ['crimson_guard'],
    againstRoles: ['Carry', 'Pusher'],
    reason: 'Block vs physical push / carry',
    priority: 7,
  },
  {
    shortNames: ['heaven_halberd'],
    againstRoles: ['Carry'],
    reason: 'Disarm vs right-click carries',
    priority: 8,
  },
  {
    shortNames: ['orchid', 'bloodthorn'],
    againstRoles: ['Nuker', 'Escape'],
    reason: 'Silence squishy casters / mobiles',
    priority: 7,
  },
  {
    shortNames: ['sheepstick'],
    againstRoles: ['Carry', 'Escape'],
    reason: 'Hard hex vs slippery cores',
    priority: 8,
  },
  {
    shortNames: ['aeon_disk'],
    againstRoles: ['Nuker', 'Disabler'],
    reason: 'Survive burst lock-down',
    priority: 7,
  },
  {
    shortNames: ['lotus_orb'],
    againstRoles: ['Disabler', 'Nuker'],
    reason: 'Reflect targeted spells',
    priority: 6,
  },
  {
    shortNames: ['linkens'],
    againstRoles: ['Disabler'],
    reason: 'Block single-target disables',
    priority: 7,
  },
  {
    shortNames: ['satanic'],
    againstRoles: ['Nuker', 'Disabler'],
    reason: 'Lifesteal + strong dispel',
    priority: 5,
  },
  {
    shortNames: ['mjollnir', 'monkey_king_bar'],
    againstRoles: ['Escape'],
    reason: 'True strike / attack speed vs evasion',
    priority: 6,
  },
  {
    shortNames: ['silver_edge'],
    againstRoles: ['Durable', 'Initiator'],
    reason: 'Break passive tanks',
    priority: 7,
  },
]

const ALLY_ITEMS: {
  shortNames: string[]
  allyRoles: string[]
  reason: string
  priority: number
}[] = [
  {
    shortNames: ['assault', 'vladmir', 'pipe', 'mekansm', 'guardian_greaves'],
    allyRoles: ['Carry', 'Durable'],
    reason: 'Aura / save for your cores',
    priority: 5,
  },
  {
    shortNames: ['solar_crest', 'ghost_scepter'],
    allyRoles: ['Carry'],
    reason: 'Peel / amplify your carry',
    priority: 5,
  },
]

function findItems(
  shortNames: string[],
  constants: Record<number, ItemInfo>,
): ItemInfo[] {
  const byShort = new Map(
    Object.values(constants)
      .filter((i) => !i.isNeutral)
      .map((i) => [i.shortName, i]),
  )
  return shortNames.map((s) => byShort.get(s)).filter((i): i is ItemInfo => !!i)
}

/**
 * Suggest situational items from the full item pool based on ally / enemy heroes.
 */
export function suggestItemsForDraft(
  _hero: Hero,
  allies: Hero[],
  enemies: Hero[],
  constants: Record<number, ItemInfo>,
  limit = 10,
): ItemSuggestion[] {
  const enemyRoles = new Set(enemies.flatMap((h) => h.roles))
  const allyRoles = new Set(allies.flatMap((h) => h.roles))
  const scored = new Map<number, ItemSuggestion>()

  for (const rule of COUNTER_ITEMS) {
    const hits = rule.againstRoles.filter((r) => enemyRoles.has(r as Hero['roles'][number]))
    if (!hits.length || !enemies.length) continue
    for (const item of findItems(rule.shortNames, constants)) {
      const prev = scored.get(item.id)
      const priority = rule.priority + hits.length
      if (!prev || prev.priority < priority) {
        scored.set(item.id, {
          item,
          reason: rule.reason,
          priority,
        })
      }
    }
  }

  for (const rule of ALLY_ITEMS) {
    const hits = rule.allyRoles.filter((r) => allyRoles.has(r as Hero['roles'][number]))
    if (!hits.length) continue
    for (const item of findItems(rule.shortNames, constants)) {
      const prev = scored.get(item.id)
      const priority = rule.priority + hits.length * 0.5
      if (!prev || prev.priority < priority) {
        scored.set(item.id, {
          item,
          reason: rule.reason,
          priority,
        })
      }
    }
  }

  return [...scored.values()].sort((a, b) => b.priority - a.priority).slice(0, limit)
}
