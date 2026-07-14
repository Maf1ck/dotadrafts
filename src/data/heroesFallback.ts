// Fallback static data for heroes and win rates in case OpenDota API fails or is rate-limited.
// Generated on 2026-07-08T15:21:06.342Z

import type { HeroList } from '../types/draft'

export interface FallbackHero extends HeroList {
  winRate: number
}

export const FALLBACK_HEROES: FallbackHero[] = [
  {
    "id": 1,
    "name": "npc_dota_hero_antimage",
    "localized_name": "Anti-Mage",
    "primary_attr": "agi",
    "attack_type": "Melee",
    "roles": [
      "Carry",
      "Escape",
      "Nuker"
    ],
    "winRate": 49.26103060160379
  },
  {
    "id": 2,
    "name": "npc_dota_hero_axe",
    "localized_name": "Axe",
    "primary_attr": "str",
    "attack_type": "Melee",
    "roles": [
      "Initiator",
      "Durable",
      "Disabler",
      "Carry"
    ],
    "winRate": 50.680667118294146
  },
  {
    "id": 3,
    "name": "npc_dota_hero_bane",
    "localized_name": "Bane",
    "primary_attr": "all",
    "attack_type": "Ranged",
    "roles": [
      "Support",
      "Disabler",
      "Nuker",
      "Durable"
    ],
    "winRate": 52.00220764089042
  },
  {
    "id": 4,
    "name": "npc_dota_hero_bloodseeker",
    "localized_name": "Bloodseeker",
    "primary_attr": "agi",
    "attack_type": "Melee",
    "roles": [
      "Carry",
      "Disabler",
      "Nuker",
      "Initiator"
    ],
    "winRate": 50.61805664215303
  },
  {
    "id": 5,
    "name": "npc_dota_hero_crystal_maiden",
    "localized_name": "Crystal Maiden",
    "primary_attr": "int",
    "attack_type": "Ranged",
    "roles": [
      "Support",
      "Disabler",
      "Nuker"
    ],
    "winRate": 49.60697617293049
  },
  {
    "id": 6,
    "name": "npc_dota_hero_drow_ranger",
    "localized_name": "Drow Ranger",
    "primary_attr": "agi",
    "attack_type": "Ranged",
    "roles": [
      "Carry",
      "Disabler",
      "Pusher"
    ],
    "winRate": 52.151959605674435
  },
  {
    "id": 7,
    "name": "npc_dota_hero_earthshaker",
    "localized_name": "Earthshaker",
    "primary_attr": "str",
    "attack_type": "Melee",
    "roles": [
      "Support",
      "Initiator",
      "Disabler",
      "Nuker"
    ],
    "winRate": 50.96438596039451
  },
  {
    "id": 8,
    "name": "npc_dota_hero_juggernaut",
    "localized_name": "Juggernaut",
    "primary_attr": "agi",
    "attack_type": "Melee",
    "roles": [
      "Carry",
      "Pusher",
      "Escape"
    ],
    "winRate": 52.026082906381
  },
  {
    "id": 9,
    "name": "npc_dota_hero_mirana",
    "localized_name": "Mirana",
    "primary_attr": "agi",
    "attack_type": "Ranged",
    "roles": [
      "Carry",
      "Support",
      "Escape",
      "Nuker",
      "Disabler"
    ],
    "winRate": 49.73322837400507
  },
  {
    "id": 10,
    "name": "npc_dota_hero_morphling",
    "localized_name": "Morphling",
    "primary_attr": "agi",
    "attack_type": "Ranged",
    "roles": [
      "Carry",
      "Escape",
      "Durable",
      "Nuker",
      "Disabler"
    ],
    "winRate": 47.944106438456906
  },
  {
    "id": 11,
    "name": "npc_dota_hero_nevermore",
    "localized_name": "Shadow Fiend",
    "primary_attr": "agi",
    "attack_type": "Ranged",
    "roles": [
      "Carry",
      "Nuker"
    ],
    "winRate": 48.77112135176651
  },
  {
    "id": 12,
    "name": "npc_dota_hero_phantom_lancer",
    "localized_name": "Phantom Lancer",
    "primary_attr": "agi",
    "attack_type": "Melee",
    "roles": [
      "Carry",
      "Escape",
      "Pusher",
      "Nuker"
    ],
    "winRate": 52.53851605923826
  },
  {
    "id": 13,
    "name": "npc_dota_hero_puck",
    "localized_name": "Puck",
    "primary_attr": "int",
    "attack_type": "Ranged",
    "roles": [
      "Initiator",
      "Disabler",
      "Escape",
      "Nuker"
    ],
    "winRate": 49.17708667307898
  },
  {
    "id": 14,
    "name": "npc_dota_hero_pudge",
    "localized_name": "Pudge",
    "primary_attr": "str",
    "attack_type": "Melee",
    "roles": [
      "Disabler",
      "Initiator",
      "Durable",
      "Nuker"
    ],
    "winRate": 51.47845865667647
  },
  {
    "id": 15,
    "name": "npc_dota_hero_razor",
    "localized_name": "Razor",
    "primary_attr": "agi",
    "attack_type": "Ranged",
    "roles": [
      "Carry",
      "Durable",
      "Nuker",
      "Pusher"
    ],
    "winRate": 49.26925238898258
  },
  {
    "id": 16,
    "name": "npc_dota_hero_sand_king",
    "localized_name": "Sand King",
    "primary_attr": "all",
    "attack_type": "Melee",
    "roles": [
      "Initiator",
      "Disabler",
      "Support",
      "Nuker",
      "Escape"
    ],
    "winRate": 46.28067848005307
  },
  {
    "id": 17,
    "name": "npc_dota_hero_storm_spirit",
    "localized_name": "Storm Spirit",
    "primary_attr": "int",
    "attack_type": "Ranged",
    "roles": [
      "Carry",
      "Escape",
      "Nuker",
      "Initiator",
      "Disabler"
    ],
    "winRate": 48.37939389682902
  },
  {
    "id": 18,
    "name": "npc_dota_hero_sven",
    "localized_name": "Sven",
    "primary_attr": "str",
    "attack_type": "Melee",
    "roles": [
      "Carry",
      "Disabler",
      "Initiator",
      "Durable",
      "Nuker"
    ],
    "winRate": 50.73372849168442
  },
  {
    "id": 19,
    "name": "npc_dota_hero_tiny",
    "localized_name": "Tiny",
    "primary_attr": "str",
    "attack_type": "Melee",
    "roles": [
      "Carry",
      "Nuker",
      "Pusher",
      "Initiator",
      "Durable",
      "Disabler"
    ],
    "winRate": 45.208628683091305
  },
  {
    "id": 20,
    "name": "npc_dota_hero_vengefulspirit",
    "localized_name": "Vengeful Spirit",
    "primary_attr": "agi",
    "attack_type": "Ranged",
    "roles": [
      "Support",
      "Initiator",
      "Disabler",
      "Nuker",
      "Escape"
    ],
    "winRate": 51.93048183994172
  },
  {
    "id": 21,
    "name": "npc_dota_hero_windrunner",
    "localized_name": "Windranger",
    "primary_attr": "all",
    "attack_type": "Ranged",
    "roles": [
      "Carry",
      "Support",
      "Disabler",
      "Escape",
      "Nuker"
    ],
    "winRate": 48.98112900270749
  },
  {
    "id": 22,
    "name": "npc_dota_hero_zuus",
    "localized_name": "Zeus",
    "primary_attr": "int",
    "attack_type": "Ranged",
    "roles": [
      "Nuker",
      "Carry"
    ],
    "winRate": 50.77442443385155
  },
  {
    "id": 23,
    "name": "npc_dota_hero_kunkka",
    "localized_name": "Kunkka",
    "primary_attr": "str",
    "attack_type": "Melee",
    "roles": [
      "Carry",
      "Support",
      "Disabler",
      "Initiator",
      "Durable",
      "Nuker"
    ],
    "winRate": 49.88671851080767
  },
  {
    "id": 25,
    "name": "npc_dota_hero_lina",
    "localized_name": "Lina",
    "primary_attr": "int",
    "attack_type": "Ranged",
    "roles": [
      "Support",
      "Carry",
      "Nuker",
      "Disabler"
    ],
    "winRate": 50.965311568042694
  },
  {
    "id": 26,
    "name": "npc_dota_hero_lion",
    "localized_name": "Lion",
    "primary_attr": "int",
    "attack_type": "Ranged",
    "roles": [
      "Support",
      "Disabler",
      "Nuker",
      "Initiator"
    ],
    "winRate": 48.66569875756447
  },
  {
    "id": 27,
    "name": "npc_dota_hero_shadow_shaman",
    "localized_name": "Shadow Shaman",
    "primary_attr": "int",
    "attack_type": "Ranged",
    "roles": [
      "Support",
      "Pusher",
      "Disabler",
      "Nuker",
      "Initiator"
    ],
    "winRate": 51.46281012852288
  },
  {
    "id": 28,
    "name": "npc_dota_hero_slardar",
    "localized_name": "Slardar",
    "primary_attr": "str",
    "attack_type": "Melee",
    "roles": [
      "Carry",
      "Durable",
      "Initiator",
      "Disabler",
      "Escape"
    ],
    "winRate": 48.96337104167543
  },
  {
    "id": 29,
    "name": "npc_dota_hero_tidehunter",
    "localized_name": "Tidehunter",
    "primary_attr": "str",
    "attack_type": "Melee",
    "roles": [
      "Initiator",
      "Durable",
      "Disabler",
      "Nuker",
      "Carry"
    ],
    "winRate": 49.24207167076658
  },
  {
    "id": 30,
    "name": "npc_dota_hero_witch_doctor",
    "localized_name": "Witch Doctor",
    "primary_attr": "int",
    "attack_type": "Ranged",
    "roles": [
      "Support",
      "Nuker",
      "Disabler"
    ],
    "winRate": 50.49321824907521
  },
  {
    "id": 31,
    "name": "npc_dota_hero_lich",
    "localized_name": "Lich",
    "primary_attr": "int",
    "attack_type": "Ranged",
    "roles": [
      "Support",
      "Nuker"
    ],
    "winRate": 51.46554905371923
  },
  {
    "id": 32,
    "name": "npc_dota_hero_riki",
    "localized_name": "Riki",
    "primary_attr": "agi",
    "attack_type": "Melee",
    "roles": [
      "Carry",
      "Escape",
      "Disabler"
    ],
    "winRate": 51.41859774212716
  },
  {
    "id": 33,
    "name": "npc_dota_hero_enigma",
    "localized_name": "Enigma",
    "primary_attr": "all",
    "attack_type": "Ranged",
    "roles": [
      "Disabler",
      "Initiator",
      "Pusher"
    ],
    "winRate": 53.91077636152954
  },
  {
    "id": 34,
    "name": "npc_dota_hero_tinker",
    "localized_name": "Tinker",
    "primary_attr": "int",
    "attack_type": "Ranged",
    "roles": [
      "Carry",
      "Nuker",
      "Pusher"
    ],
    "winRate": 49.94254854647823
  },
  {
    "id": 35,
    "name": "npc_dota_hero_sniper",
    "localized_name": "Sniper",
    "primary_attr": "agi",
    "attack_type": "Ranged",
    "roles": [
      "Carry",
      "Nuker"
    ],
    "winRate": 47.73767748832237
  },
  {
    "id": 36,
    "name": "npc_dota_hero_necrolyte",
    "localized_name": "Necrophos",
    "primary_attr": "int",
    "attack_type": "Ranged",
    "roles": [
      "Carry",
      "Nuker",
      "Durable",
      "Disabler"
    ],
    "winRate": 50.525614168729774
  },
  {
    "id": 37,
    "name": "npc_dota_hero_warlock",
    "localized_name": "Warlock",
    "primary_attr": "int",
    "attack_type": "Ranged",
    "roles": [
      "Support",
      "Initiator",
      "Disabler"
    ],
    "winRate": 47.1045620140286
  },
  {
    "id": 38,
    "name": "npc_dota_hero_beastmaster",
    "localized_name": "Beastmaster",
    "primary_attr": "all",
    "attack_type": "Melee",
    "roles": [
      "Initiator",
      "Disabler",
      "Durable",
      "Nuker"
    ],
    "winRate": 45.23624343768229
  },
  {
    "id": 39,
    "name": "npc_dota_hero_queenofpain",
    "localized_name": "Queen of Pain",
    "primary_attr": "int",
    "attack_type": "Ranged",
    "roles": [
      "Carry",
      "Nuker",
      "Escape"
    ],
    "winRate": 46.585340692216434
  },
  {
    "id": 40,
    "name": "npc_dota_hero_venomancer",
    "localized_name": "Venomancer",
    "primary_attr": "all",
    "attack_type": "Ranged",
    "roles": [
      "Support",
      "Nuker",
      "Initiator",
      "Pusher",
      "Disabler"
    ],
    "winRate": 46.70060797785577
  },
  {
    "id": 41,
    "name": "npc_dota_hero_faceless_void",
    "localized_name": "Faceless Void",
    "primary_attr": "agi",
    "attack_type": "Melee",
    "roles": [
      "Carry",
      "Initiator",
      "Disabler",
      "Escape",
      "Durable"
    ],
    "winRate": 50.2231884057971
  },
  {
    "id": 42,
    "name": "npc_dota_hero_skeleton_king",
    "localized_name": "Wraith King",
    "primary_attr": "str",
    "attack_type": "Melee",
    "roles": [
      "Carry",
      "Support",
      "Durable",
      "Disabler",
      "Initiator"
    ],
    "winRate": 52.882879694191764
  },
  {
    "id": 43,
    "name": "npc_dota_hero_death_prophet",
    "localized_name": "Death Prophet",
    "primary_attr": "all",
    "attack_type": "Ranged",
    "roles": [
      "Carry",
      "Pusher",
      "Nuker",
      "Disabler"
    ],
    "winRate": 47.46259679723329
  },
  {
    "id": 44,
    "name": "npc_dota_hero_phantom_assassin",
    "localized_name": "Phantom Assassin",
    "primary_attr": "agi",
    "attack_type": "Melee",
    "roles": [
      "Carry",
      "Escape"
    ],
    "winRate": 48.837617027244995
  },
  {
    "id": 45,
    "name": "npc_dota_hero_pugna",
    "localized_name": "Pugna",
    "primary_attr": "int",
    "attack_type": "Ranged",
    "roles": [
      "Nuker",
      "Pusher"
    ],
    "winRate": 50.75823601185289
  },
  {
    "id": 46,
    "name": "npc_dota_hero_templar_assassin",
    "localized_name": "Templar Assassin",
    "primary_attr": "agi",
    "attack_type": "Ranged",
    "roles": [
      "Carry",
      "Escape"
    ],
    "winRate": 46.29012719563901
  },
  {
    "id": 47,
    "name": "npc_dota_hero_viper",
    "localized_name": "Viper",
    "primary_attr": "agi",
    "attack_type": "Ranged",
    "roles": [
      "Carry",
      "Durable",
      "Initiator",
      "Disabler"
    ],
    "winRate": 49.06684588740113
  },
  {
    "id": 48,
    "name": "npc_dota_hero_luna",
    "localized_name": "Luna",
    "primary_attr": "agi",
    "attack_type": "Ranged",
    "roles": [
      "Carry",
      "Nuker",
      "Pusher"
    ],
    "winRate": 49.15308312547131
  },
  {
    "id": 49,
    "name": "npc_dota_hero_dragon_knight",
    "localized_name": "Dragon Knight",
    "primary_attr": "str",
    "attack_type": "Melee",
    "roles": [
      "Carry",
      "Pusher",
      "Durable",
      "Disabler",
      "Initiator",
      "Nuker"
    ],
    "winRate": 47.2791519434629
  },
  {
    "id": 50,
    "name": "npc_dota_hero_dazzle",
    "localized_name": "Dazzle",
    "primary_attr": "all",
    "attack_type": "Ranged",
    "roles": [
      "Support",
      "Nuker",
      "Disabler"
    ],
    "winRate": 51.029288702928866
  },
  {
    "id": 51,
    "name": "npc_dota_hero_rattletrap",
    "localized_name": "Clockwerk",
    "primary_attr": "str",
    "attack_type": "Melee",
    "roles": [
      "Initiator",
      "Disabler",
      "Durable",
      "Nuker"
    ],
    "winRate": 50.756318459860594
  },
  {
    "id": 52,
    "name": "npc_dota_hero_leshrac",
    "localized_name": "Leshrac",
    "primary_attr": "int",
    "attack_type": "Ranged",
    "roles": [
      "Carry",
      "Support",
      "Nuker",
      "Pusher",
      "Disabler"
    ],
    "winRate": 51.52152573271631
  },
  {
    "id": 53,
    "name": "npc_dota_hero_furion",
    "localized_name": "Nature's Prophet",
    "primary_attr": "all",
    "attack_type": "Ranged",
    "roles": [
      "Carry",
      "Pusher",
      "Escape",
      "Nuker"
    ],
    "winRate": 43.71055790003485
  },
  {
    "id": 54,
    "name": "npc_dota_hero_life_stealer",
    "localized_name": "Lifestealer",
    "primary_attr": "str",
    "attack_type": "Melee",
    "roles": [
      "Carry",
      "Durable",
      "Escape",
      "Disabler"
    ],
    "winRate": 52.15423661437789
  },
  {
    "id": 55,
    "name": "npc_dota_hero_dark_seer",
    "localized_name": "Dark Seer",
    "primary_attr": "int",
    "attack_type": "Melee",
    "roles": [
      "Initiator",
      "Escape",
      "Disabler"
    ],
    "winRate": 50.39122299710835
  },
  {
    "id": 56,
    "name": "npc_dota_hero_clinkz",
    "localized_name": "Clinkz",
    "primary_attr": "agi",
    "attack_type": "Ranged",
    "roles": [
      "Carry",
      "Escape",
      "Pusher"
    ],
    "winRate": 51.09015910430171
  },
  {
    "id": 57,
    "name": "npc_dota_hero_omniknight",
    "localized_name": "Omniknight",
    "primary_attr": "str",
    "attack_type": "Melee",
    "roles": [
      "Support",
      "Durable",
      "Nuker"
    ],
    "winRate": 51.63351540760589
  },
  {
    "id": 58,
    "name": "npc_dota_hero_enchantress",
    "localized_name": "Enchantress",
    "primary_attr": "int",
    "attack_type": "Ranged",
    "roles": [
      "Support",
      "Pusher",
      "Durable",
      "Disabler"
    ],
    "winRate": 48.660714285714285
  },
  {
    "id": 59,
    "name": "npc_dota_hero_huskar",
    "localized_name": "Huskar",
    "primary_attr": "str",
    "attack_type": "Ranged",
    "roles": [
      "Carry",
      "Durable",
      "Initiator"
    ],
    "winRate": 46.09375
  },
  {
    "id": 60,
    "name": "npc_dota_hero_night_stalker",
    "localized_name": "Night Stalker",
    "primary_attr": "str",
    "attack_type": "Melee",
    "roles": [
      "Carry",
      "Initiator",
      "Durable",
      "Disabler",
      "Nuker"
    ],
    "winRate": 54.28094369376334
  },
  {
    "id": 61,
    "name": "npc_dota_hero_broodmother",
    "localized_name": "Broodmother",
    "primary_attr": "agi",
    "attack_type": "Melee",
    "roles": [
      "Carry",
      "Pusher",
      "Escape",
      "Nuker"
    ],
    "winRate": 50.05187798298402
  },
  {
    "id": 62,
    "name": "npc_dota_hero_bounty_hunter",
    "localized_name": "Bounty Hunter",
    "primary_attr": "agi",
    "attack_type": "Melee",
    "roles": [
      "Escape",
      "Nuker"
    ],
    "winRate": 55.316857499149755
  },
  {
    "id": 63,
    "name": "npc_dota_hero_weaver",
    "localized_name": "Weaver",
    "primary_attr": "agi",
    "attack_type": "Ranged",
    "roles": [
      "Carry",
      "Escape"
    ],
    "winRate": 47.129892229154855
  },
  {
    "id": 64,
    "name": "npc_dota_hero_jakiro",
    "localized_name": "Jakiro",
    "primary_attr": "int",
    "attack_type": "Ranged",
    "roles": [
      "Support",
      "Nuker",
      "Pusher",
      "Disabler"
    ],
    "winRate": 45.5206395148508
  },
  {
    "id": 65,
    "name": "npc_dota_hero_batrider",
    "localized_name": "Batrider",
    "primary_attr": "all",
    "attack_type": "Ranged",
    "roles": [
      "Initiator",
      "Disabler",
      "Escape"
    ],
    "winRate": 43.61381753764393
  },
  {
    "id": 66,
    "name": "npc_dota_hero_chen",
    "localized_name": "Chen",
    "primary_attr": "int",
    "attack_type": "Ranged",
    "roles": [
      "Support",
      "Pusher"
    ],
    "winRate": 51.00516944284894
  },
  {
    "id": 67,
    "name": "npc_dota_hero_spectre",
    "localized_name": "Spectre",
    "primary_attr": "agi",
    "attack_type": "Melee",
    "roles": [
      "Carry",
      "Durable",
      "Escape"
    ],
    "winRate": 53.195013757089114
  },
  {
    "id": 68,
    "name": "npc_dota_hero_ancient_apparition",
    "localized_name": "Ancient Apparition",
    "primary_attr": "int",
    "attack_type": "Ranged",
    "roles": [
      "Support",
      "Disabler",
      "Nuker"
    ],
    "winRate": 49.79093309859155
  },
  {
    "id": 69,
    "name": "npc_dota_hero_doom_bringer",
    "localized_name": "Doom",
    "primary_attr": "str",
    "attack_type": "Melee",
    "roles": [
      "Carry",
      "Disabler",
      "Initiator",
      "Durable",
      "Nuker"
    ],
    "winRate": 49.04613250086715
  },
  {
    "id": 70,
    "name": "npc_dota_hero_ursa",
    "localized_name": "Ursa",
    "primary_attr": "agi",
    "attack_type": "Melee",
    "roles": [
      "Carry",
      "Durable",
      "Disabler"
    ],
    "winRate": 47.73937412424101
  },
  {
    "id": 71,
    "name": "npc_dota_hero_spirit_breaker",
    "localized_name": "Spirit Breaker",
    "primary_attr": "str",
    "attack_type": "Melee",
    "roles": [
      "Carry",
      "Initiator",
      "Disabler",
      "Durable",
      "Escape"
    ],
    "winRate": 51.15016624821877
  },
  {
    "id": 72,
    "name": "npc_dota_hero_gyrocopter",
    "localized_name": "Gyrocopter",
    "primary_attr": "agi",
    "attack_type": "Ranged",
    "roles": [
      "Carry",
      "Nuker",
      "Disabler"
    ],
    "winRate": 42.432575356954
  },
  {
    "id": 73,
    "name": "npc_dota_hero_alchemist",
    "localized_name": "Alchemist",
    "primary_attr": "str",
    "attack_type": "Melee",
    "roles": [
      "Carry",
      "Support",
      "Durable",
      "Disabler",
      "Initiator",
      "Nuker"
    ],
    "winRate": 46.04789960976356
  },
  {
    "id": 74,
    "name": "npc_dota_hero_invoker",
    "localized_name": "Invoker",
    "primary_attr": "int",
    "attack_type": "Ranged",
    "roles": [
      "Carry",
      "Nuker",
      "Disabler",
      "Escape",
      "Pusher"
    ],
    "winRate": 52.82160382632461
  },
  {
    "id": 75,
    "name": "npc_dota_hero_silencer",
    "localized_name": "Silencer",
    "primary_attr": "int",
    "attack_type": "Ranged",
    "roles": [
      "Carry",
      "Support",
      "Disabler",
      "Initiator",
      "Nuker"
    ],
    "winRate": 50.084750550878574
  },
  {
    "id": 76,
    "name": "npc_dota_hero_obsidian_destroyer",
    "localized_name": "Outworld Destroyer",
    "primary_attr": "int",
    "attack_type": "Ranged",
    "roles": [
      "Carry",
      "Nuker",
      "Disabler"
    ],
    "winRate": 50.16984977730807
  },
  {
    "id": 77,
    "name": "npc_dota_hero_lycan",
    "localized_name": "Lycan",
    "primary_attr": "str",
    "attack_type": "Melee",
    "roles": [
      "Carry",
      "Pusher",
      "Durable",
      "Escape"
    ],
    "winRate": 52.54289215686274
  },
  {
    "id": 78,
    "name": "npc_dota_hero_brewmaster",
    "localized_name": "Brewmaster",
    "primary_attr": "all",
    "attack_type": "Melee",
    "roles": [
      "Carry",
      "Initiator",
      "Durable",
      "Disabler",
      "Nuker"
    ],
    "winRate": 52.526799387442566
  },
  {
    "id": 79,
    "name": "npc_dota_hero_shadow_demon",
    "localized_name": "Shadow Demon",
    "primary_attr": "int",
    "attack_type": "Ranged",
    "roles": [
      "Support",
      "Disabler",
      "Initiator",
      "Nuker"
    ],
    "winRate": 45.84105414865143
  },
  {
    "id": 80,
    "name": "npc_dota_hero_lone_druid",
    "localized_name": "Lone Druid",
    "primary_attr": "agi",
    "attack_type": "Ranged",
    "roles": [
      "Carry",
      "Pusher",
      "Durable"
    ],
    "winRate": 49.873552508984424
  },
  {
    "id": 81,
    "name": "npc_dota_hero_chaos_knight",
    "localized_name": "Chaos Knight",
    "primary_attr": "str",
    "attack_type": "Melee",
    "roles": [
      "Carry",
      "Disabler",
      "Durable",
      "Pusher",
      "Initiator"
    ],
    "winRate": 49.21540656205421
  },
  {
    "id": 82,
    "name": "npc_dota_hero_meepo",
    "localized_name": "Meepo",
    "primary_attr": "agi",
    "attack_type": "Melee",
    "roles": [
      "Carry",
      "Escape",
      "Nuker",
      "Disabler",
      "Initiator",
      "Pusher"
    ],
    "winRate": 53.318918918918925
  },
  {
    "id": 83,
    "name": "npc_dota_hero_treant",
    "localized_name": "Treant Protector",
    "primary_attr": "str",
    "attack_type": "Melee",
    "roles": [
      "Support",
      "Initiator",
      "Durable",
      "Disabler",
      "Escape"
    ],
    "winRate": 53.31703739916891
  },
  {
    "id": 84,
    "name": "npc_dota_hero_ogre_magi",
    "localized_name": "Ogre Magi",
    "primary_attr": "str",
    "attack_type": "Melee",
    "roles": [
      "Support",
      "Nuker",
      "Disabler",
      "Durable",
      "Initiator"
    ],
    "winRate": 49.45966114811641
  },
  {
    "id": 85,
    "name": "npc_dota_hero_undying",
    "localized_name": "Undying",
    "primary_attr": "str",
    "attack_type": "Melee",
    "roles": [
      "Support",
      "Durable",
      "Disabler",
      "Nuker"
    ],
    "winRate": 52.7797306037513
  },
  {
    "id": 86,
    "name": "npc_dota_hero_rubick",
    "localized_name": "Rubick",
    "primary_attr": "int",
    "attack_type": "Ranged",
    "roles": [
      "Support",
      "Disabler",
      "Nuker"
    ],
    "winRate": 49.81014357492617
  },
  {
    "id": 87,
    "name": "npc_dota_hero_disruptor",
    "localized_name": "Disruptor",
    "primary_attr": "int",
    "attack_type": "Ranged",
    "roles": [
      "Support",
      "Disabler",
      "Nuker",
      "Initiator"
    ],
    "winRate": 50.083247950819676
  },
  {
    "id": 88,
    "name": "npc_dota_hero_nyx_assassin",
    "localized_name": "Nyx Assassin",
    "primary_attr": "all",
    "attack_type": "Melee",
    "roles": [
      "Disabler",
      "Nuker",
      "Initiator",
      "Escape"
    ],
    "winRate": 52.74199623352166
  },
  {
    "id": 89,
    "name": "npc_dota_hero_naga_siren",
    "localized_name": "Naga Siren",
    "primary_attr": "agi",
    "attack_type": "Melee",
    "roles": [
      "Carry",
      "Support",
      "Pusher",
      "Disabler",
      "Initiator",
      "Escape"
    ],
    "winRate": 49.11830714972748
  },
  {
    "id": 90,
    "name": "npc_dota_hero_keeper_of_the_light",
    "localized_name": "Keeper of the Light",
    "primary_attr": "int",
    "attack_type": "Ranged",
    "roles": [
      "Support",
      "Nuker",
      "Disabler"
    ],
    "winRate": 53.51029628986011
  },
  {
    "id": 91,
    "name": "npc_dota_hero_wisp",
    "localized_name": "Io",
    "primary_attr": "all",
    "attack_type": "Ranged",
    "roles": [
      "Support",
      "Escape",
      "Nuker"
    ],
    "winRate": 49.996675310858436
  },
  {
    "id": 92,
    "name": "npc_dota_hero_visage",
    "localized_name": "Visage",
    "primary_attr": "all",
    "attack_type": "Ranged",
    "roles": [
      "Support",
      "Nuker",
      "Durable",
      "Disabler",
      "Pusher"
    ],
    "winRate": 55.11573297551158
  },
  {
    "id": 93,
    "name": "npc_dota_hero_slark",
    "localized_name": "Slark",
    "primary_attr": "agi",
    "attack_type": "Melee",
    "roles": [
      "Carry",
      "Escape",
      "Disabler",
      "Nuker"
    ],
    "winRate": 50.05013159543803
  },
  {
    "id": 94,
    "name": "npc_dota_hero_medusa",
    "localized_name": "Medusa",
    "primary_attr": "agi",
    "attack_type": "Ranged",
    "roles": [
      "Carry",
      "Disabler",
      "Durable"
    ],
    "winRate": 49.23647469458988
  },
  {
    "id": 95,
    "name": "npc_dota_hero_troll_warlord",
    "localized_name": "Troll Warlord",
    "primary_attr": "agi",
    "attack_type": "Ranged",
    "roles": [
      "Carry",
      "Pusher",
      "Disabler",
      "Durable"
    ],
    "winRate": 49.872173058013765
  },
  {
    "id": 96,
    "name": "npc_dota_hero_centaur",
    "localized_name": "Centaur Warrunner",
    "primary_attr": "str",
    "attack_type": "Melee",
    "roles": [
      "Durable",
      "Initiator",
      "Disabler",
      "Nuker",
      "Escape"
    ],
    "winRate": 49.808607973111755
  },
  {
    "id": 97,
    "name": "npc_dota_hero_magnataur",
    "localized_name": "Magnus",
    "primary_attr": "all",
    "attack_type": "Melee",
    "roles": [
      "Initiator",
      "Disabler",
      "Nuker",
      "Escape"
    ],
    "winRate": 49.87873888439774
  },
  {
    "id": 98,
    "name": "npc_dota_hero_shredder",
    "localized_name": "Timbersaw",
    "primary_attr": "str",
    "attack_type": "Melee",
    "roles": [
      "Nuker",
      "Durable",
      "Escape"
    ],
    "winRate": 44.15321414106347
  },
  {
    "id": 99,
    "name": "npc_dota_hero_bristleback",
    "localized_name": "Bristleback",
    "primary_attr": "str",
    "attack_type": "Melee",
    "roles": [
      "Carry",
      "Durable",
      "Initiator",
      "Nuker"
    ],
    "winRate": 45.524209570301416
  },
  {
    "id": 100,
    "name": "npc_dota_hero_tusk",
    "localized_name": "Tusk",
    "primary_attr": "str",
    "attack_type": "Melee",
    "roles": [
      "Initiator",
      "Disabler",
      "Nuker"
    ],
    "winRate": 49.49637171017004
  },
  {
    "id": 101,
    "name": "npc_dota_hero_skywrath_mage",
    "localized_name": "Skywrath Mage",
    "primary_attr": "int",
    "attack_type": "Ranged",
    "roles": [
      "Support",
      "Nuker",
      "Disabler"
    ],
    "winRate": 48.71186806079552
  },
  {
    "id": 102,
    "name": "npc_dota_hero_abaddon",
    "localized_name": "Abaddon",
    "primary_attr": "all",
    "attack_type": "Melee",
    "roles": [
      "Support",
      "Carry",
      "Durable"
    ],
    "winRate": 51.2996286775207
  },
  {
    "id": 103,
    "name": "npc_dota_hero_elder_titan",
    "localized_name": "Elder Titan",
    "primary_attr": "str",
    "attack_type": "Melee",
    "roles": [
      "Initiator",
      "Disabler",
      "Nuker",
      "Durable"
    ],
    "winRate": 53.76258611552729
  },
  {
    "id": 104,
    "name": "npc_dota_hero_legion_commander",
    "localized_name": "Legion Commander",
    "primary_attr": "str",
    "attack_type": "Melee",
    "roles": [
      "Carry",
      "Disabler",
      "Initiator",
      "Durable",
      "Nuker"
    ],
    "winRate": 51.22555694754616
  },
  {
    "id": 105,
    "name": "npc_dota_hero_techies",
    "localized_name": "Techies",
    "primary_attr": "all",
    "attack_type": "Ranged",
    "roles": [
      "Nuker",
      "Disabler"
    ],
    "winRate": 50.05296429181616
  },
  {
    "id": 106,
    "name": "npc_dota_hero_ember_spirit",
    "localized_name": "Ember Spirit",
    "primary_attr": "agi",
    "attack_type": "Melee",
    "roles": [
      "Carry",
      "Escape",
      "Nuker",
      "Disabler",
      "Initiator"
    ],
    "winRate": 50.70304437564499
  },
  {
    "id": 107,
    "name": "npc_dota_hero_earth_spirit",
    "localized_name": "Earth Spirit",
    "primary_attr": "str",
    "attack_type": "Melee",
    "roles": [
      "Nuker",
      "Escape",
      "Disabler",
      "Initiator",
      "Durable"
    ],
    "winRate": 52.60270422048469
  },
  {
    "id": 108,
    "name": "npc_dota_hero_abyssal_underlord",
    "localized_name": "Underlord",
    "primary_attr": "str",
    "attack_type": "Melee",
    "roles": [
      "Support",
      "Nuker",
      "Disabler",
      "Durable",
      "Escape"
    ],
    "winRate": 47.903186174133836
  },
  {
    "id": 109,
    "name": "npc_dota_hero_terrorblade",
    "localized_name": "Terrorblade",
    "primary_attr": "agi",
    "attack_type": "Melee",
    "roles": [
      "Carry",
      "Pusher",
      "Nuker"
    ],
    "winRate": 48.65655128813023
  },
  {
    "id": 110,
    "name": "npc_dota_hero_phoenix",
    "localized_name": "Phoenix",
    "primary_attr": "str",
    "attack_type": "Ranged",
    "roles": [
      "Support",
      "Nuker",
      "Initiator",
      "Escape",
      "Disabler"
    ],
    "winRate": 50.56767586821015
  },
  {
    "id": 111,
    "name": "npc_dota_hero_oracle",
    "localized_name": "Oracle",
    "primary_attr": "int",
    "attack_type": "Ranged",
    "roles": [
      "Support",
      "Nuker",
      "Disabler",
      "Escape"
    ],
    "winRate": 50.36951622202422
  },
  {
    "id": 112,
    "name": "npc_dota_hero_winter_wyvern",
    "localized_name": "Winter Wyvern",
    "primary_attr": "int",
    "attack_type": "Ranged",
    "roles": [
      "Support",
      "Disabler",
      "Nuker"
    ],
    "winRate": 51.57092986353538
  },
  {
    "id": 113,
    "name": "npc_dota_hero_arc_warden",
    "localized_name": "Arc Warden",
    "primary_attr": "all",
    "attack_type": "Ranged",
    "roles": [
      "Carry",
      "Escape",
      "Nuker"
    ],
    "winRate": 51.35676379293081
  },
  {
    "id": 114,
    "name": "npc_dota_hero_monkey_king",
    "localized_name": "Monkey King",
    "primary_attr": "agi",
    "attack_type": "Melee",
    "roles": [
      "Carry",
      "Escape",
      "Disabler",
      "Initiator"
    ],
    "winRate": 45.824075944253686
  },
  {
    "id": 119,
    "name": "npc_dota_hero_dark_willow",
    "localized_name": "Dark Willow",
    "primary_attr": "int",
    "attack_type": "Ranged",
    "roles": [
      "Support",
      "Nuker",
      "Disabler",
      "Escape"
    ],
    "winRate": 49.10303222733767
  },
  {
    "id": 120,
    "name": "npc_dota_hero_pangolier",
    "localized_name": "Pangolier",
    "primary_attr": "all",
    "attack_type": "Melee",
    "roles": [
      "Carry",
      "Nuker",
      "Disabler",
      "Durable",
      "Escape",
      "Initiator"
    ],
    "winRate": 46.48482319808073
  },
  {
    "id": 121,
    "name": "npc_dota_hero_grimstroke",
    "localized_name": "Grimstroke",
    "primary_attr": "int",
    "attack_type": "Ranged",
    "roles": [
      "Support",
      "Nuker",
      "Disabler",
      "Escape"
    ],
    "winRate": 50.85534642550933
  },
  {
    "id": 123,
    "name": "npc_dota_hero_hoodwink",
    "localized_name": "Hoodwink",
    "primary_attr": "agi",
    "attack_type": "Ranged",
    "roles": [
      "Support",
      "Nuker",
      "Escape",
      "Disabler"
    ],
    "winRate": 48.48244170874227
  },
  {
    "id": 126,
    "name": "npc_dota_hero_void_spirit",
    "localized_name": "Void Spirit",
    "primary_attr": "all",
    "attack_type": "Melee",
    "roles": [
      "Carry",
      "Escape",
      "Nuker",
      "Disabler"
    ],
    "winRate": 49.21276416603519
  },
  {
    "id": 128,
    "name": "npc_dota_hero_snapfire",
    "localized_name": "Snapfire",
    "primary_attr": "all",
    "attack_type": "Ranged",
    "roles": [
      "Support",
      "Nuker",
      "Disabler",
      "Escape"
    ],
    "winRate": 52.903523581639966
  },
  {
    "id": 129,
    "name": "npc_dota_hero_mars",
    "localized_name": "Mars",
    "primary_attr": "str",
    "attack_type": "Melee",
    "roles": [
      "Carry",
      "Initiator",
      "Disabler",
      "Durable"
    ],
    "winRate": 46.897177101403564
  },
  {
    "id": 131,
    "name": "npc_dota_hero_ringmaster",
    "localized_name": "Ringmaster",
    "primary_attr": "int",
    "attack_type": "Ranged",
    "roles": [
      "Support",
      "Nuker",
      "Escape",
      "Disabler"
    ],
    "winRate": 48.27924466606719
  },
  {
    "id": 135,
    "name": "npc_dota_hero_dawnbreaker",
    "localized_name": "Dawnbreaker",
    "primary_attr": "str",
    "attack_type": "Melee",
    "roles": [
      "Carry",
      "Durable"
    ],
    "winRate": 51.27340359578425
  },
  {
    "id": 136,
    "name": "npc_dota_hero_marci",
    "localized_name": "Marci",
    "primary_attr": "all",
    "attack_type": "Melee",
    "roles": [
      "Support",
      "Carry",
      "Initiator",
      "Disabler",
      "Escape"
    ],
    "winRate": 49.801178203240056
  },
  {
    "id": 137,
    "name": "npc_dota_hero_primal_beast",
    "localized_name": "Primal Beast",
    "primary_attr": "str",
    "attack_type": "Melee",
    "roles": [
      "Initiator",
      "Durable",
      "Disabler"
    ],
    "winRate": 51.40856278847684
  },
  {
    "id": 138,
    "name": "npc_dota_hero_muerta",
    "localized_name": "Muerta",
    "primary_attr": "int",
    "attack_type": "Ranged",
    "roles": [
      "Carry",
      "Nuker",
      "Disabler"
    ],
    "winRate": 45.93855766727415
  },
  {
    "id": 145,
    "name": "npc_dota_hero_kez",
    "localized_name": "Kez",
    "primary_attr": "agi",
    "attack_type": "Melee",
    "roles": [
      "Carry",
      "Escape",
      "Disabler"
    ],
    "winRate": 45.46648395569259
  },
  {
    "id": 155,
    "name": "npc_dota_hero_largo",
    "localized_name": "Largo",
    "primary_attr": "str",
    "attack_type": "Melee",
    "roles": [
      "Durable",
      "Disabler",
      "Support"
    ],
    "winRate": 49.393188046457006
  }
];
