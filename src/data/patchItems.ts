/**
 * Patch 7.41d item catalog filters.
 * OpenDota still ships retired / cycled-out entries — we gate by allow/deny lists.
 */

/** Shop items removed or unavailable in current patch dumps */
export const REMOVED_SHOP_SHORTNAMES = new Set([
  'cornucopia',
  'eternal_shroud',
  'falcon_blade',
  'orb_of_destruction',
  'bloodstone',
  'necronomicon',
  'necronomicon_2',
  'necronomicon_3',
  'diffusal_blade_2',
  'river_painter',
  'mutated_milk',
  'pocket_roshan',
  'pocket_tower',
  'flying_courier',
  'courier',
])

/** Roshan / objective drops — never in shop or build catalog */
export const ROSHAN_DROP_SHORTNAMES = new Set([
  'aegis',
  'cheese',
  'refresher_shard',
  'aghanims_blessing',
  'aghanims_blessing_roshan',
  'ultimate_scepter_2',
  'ultimate_scepter_roshan',
  'roshan_banner',
  'black_grimoire',
  'block_of_cheese',
])

/**
 * Alternate → Steam/CDN shortName (OpenDota / Stratz naming drift).
 */
export const NEUTRAL_SHORTNAME_ALIASES: Record<string, string> = {
  pollywog_charm: 'polliwog_charm',
  tumblers_toy: 'pogo_stick',
  gunpowder_gauntlet: 'gunpowder_gauntlets',
  giants_maul: 'giant_maul',
  witchbane: 'heavy_blade',
}

/**
 * Active neutral ARTIFACTS (patch 7.41d).
 * Keys are Steam shortNames used by CDN / OpenDota / Stratz.
 */
export const CURRENT_NEUTRAL_ARTIFACTS: Record<string, number> = {
  // Tier 1
  ash_legion_shield: 1,
  chipped_vest: 1,
  dagger_of_ristul: 1,
  dormant_curio: 1,
  duelist_gloves: 1,
  foragers_kit: 1,
  kobold_cup: 1,
  occult_bracelet: 1,
  polliwog_charm: 1,
  possessed_mask: 1,
  stonefeather_satchel: 1,
  weighted_dice: 1,
  // Tier 2
  crippling_crossbow: 2,
  defiant_shell: 2,
  essence_ring: 2,
  mana_draught: 2,
  poor_mans_shield: 2,
  searing_signet: 2,
  seeds_of_serenity: 2,
  pogo_stick: 2, // Tumbler's Toy
  // Tier 3
  gunpowder_gauntlets: 3,
  jidi_pollen_bag: 3,
  partisans_brand: 3,
  psychic_headband: 3,
  serrated_shiv: 3,
  spellslinger: 3,
  stormcrafter: 3,
  unrelenting_eye: 3,
  // Tier 4
  conjurers_catalyst: 4,
  enchanters_bauble: 4,
  flayers_bota: 4,
  giant_maul: 4,
  idol_of_screeauk: 4,
  metamorphic_mandible: 4,
  prophets_pendulum: 4,
  rattlecage: 4,
  // Tier 5
  book_of_the_dead: 5,
  dezun_bloodrite: 5,
  divine_regalia: 5,
  fallen_sky: 5,
  harmonizer: 5,
  minotaur_horn: 5,
  riftshadow_prism: 5,
  spider_legs: 5,
  desolator_2: 5, // Stygian Desolator
  heavy_blade: 5, // Witchbane
}

/** Active enchantments — also occupy neutral slot / craft UI */
export const CURRENT_NEUTRAL_ENCHANTMENTS = new Set([
  'enhancement_vital',
  'enhancement_alert',
  'enhancement_brawny',
  'enhancement_mystical',
  'enhancement_quickened',
  'enhancement_tough',
  'enhancement_greedy',
  'enhancement_crude',
  'enhancement_keen_eyed',
  'enhancement_nimble',
  'enhancement_titanic',
  'enhancement_timeless',
  'enhancement_audacious',
  'enhancement_evolved',
  'enhancement_feverish',
  'enhancement_fleetfooted',
  'enhancement_hulking',
  'enhancement_manic',
  'enhancement_vampiric',
  // common OpenDota / Stratz shortName variants
  'vital_enchantment',
  'alert_enchantment',
  'brawny_enchantment',
  'mystical_enchantment',
  'quickened_enchantment',
  'tough_enchantment',
  'greedy_enchantment',
  'crude_enchantment',
  'keen_eyed_enchantment',
  'nimble_enchantment',
  'titanic_enchantment',
  'timeless_enchantment',
  'audacious_enchantment',
  'evolved_enchantment',
  'feverish_enchantment',
  'fleetfooted_enchantment',
  'hulking_enchantment',
  'manic_enchantment',
  'vampiric_enchantment',
])

/** Cycled-out / retired neutrals — never show in shop or neutrals tab */
export const CYCLED_NEUTRAL_SHORTNAMES = new Set([
  'arcane_ring',
  'broom_handle',
  'elixir',
  'faded_broach',
  'fairys_trinket',
  'ironwood_tree',
  'keen_optic',
  'lance_of_pursuit',
  'mango_tree',
  'ocean_heart',
  'orb_of_destruction',
  'pig_pole',
  'ripper_lash',
  'rippers_lash',
  'royal_jelly',
  'safety_bubble',
  'spark_of_courage',
  'trusty_shovel',
  'tier1_token',
  'brigands_blade',
  'bullwhip',
  'clumsy_net',
  'dragon_scale',
  'eye_of_the_vizier',
  'fae_grenade',
  'gossamer_cape',
  'grove_bow',
  'imp_claw',
  'iron_talon',
  'light_collector',
  'nether_shawl',
  'philosophers_stone',
  'pupils_gift',
  'quicksilver_amulet',
  'ring_of_aquila',
  'sisters_shroud',
  'tier2_token',
  'tome_of_aghanim',
  'vambrace',
  'vampire_fangs',
  'blast_rig',
  'craggy_coat',
  'doubloon',
  'elven_tunic',
  'enchanted_quiver',
  'gale_guard',
  'greater_faerie_fire',
  'nemesis_curse',
  'ninja_gear',
  'paladin_sword',
  'quickening_charm',
  'repair_kit',
  'third_eye',
  'tier3_token',
  'titan_sliver',
  'vindicators_axe',
  'whisper_of_the_dread',
  'ancient_guardian',
  'ascetic_cap',
  'avianas_feather',
  'ceremonial_robe',
  'flicker',
  'havoc_hammer',
  'illusionists_cape',
  'magnifying_monocle',
  'martyrs_plate',
  'mind_breaker',
  'ogre_seal_totem',
  'outworld_staff',
  'penta_edged_sword',
  'princes_knife',
  'pyrrhic_cloak',
  'spell_prism',
  'telescope',
  'the_leveller',
  'tier4_token',
  'timeless_relic',
  'trickster_cloak',
  'witless_shako',
  'apex',
  'arcanists_armor',
  'ballista',
  'book_of_shadows',
  'ex_machina',
  'force_boots',
  'fusion_rune',
  'giants_ring',
  'helm_of_the_undying',
  'magic_lamp',
  'mirror_shield',
  'phoenix_ash',
  'pirate_hat',
  'seer_stone',
  'tier5_token',
  'trident',
  'unwavering_condition',
  'woodland_striders',
  'dandelion_amulet',
  'cloak_of_flames',
  'specialists_array',
  'medallion_of_courage',
  'chasm_stone',
  'crellas_crozier',
  'essence_distiller',
  'splintmail',
  'demonicon',
  'hydras_breath',
  'hydra_breath',
])

export function normalizeShortName(shortName: string): string {
  const raw = shortName.toLowerCase().replace(/^item_/, '')
  return NEUTRAL_SHORTNAME_ALIASES[raw] ?? raw
}

export function isCurrentNeutralArtifact(shortName: string): boolean {
  return normalizeShortName(shortName) in CURRENT_NEUTRAL_ARTIFACTS
}

export function isCurrentNeutralEnchantment(shortName: string): boolean {
  const s = normalizeShortName(shortName)
  return (
    CURRENT_NEUTRAL_ENCHANTMENTS.has(s) ||
    s.includes('enchantment') ||
    s.startsWith('enhancement_')
  )
}

export function isCurrentNeutral(shortName: string): boolean {
  return isCurrentNeutralArtifact(shortName) || isCurrentNeutralEnchantment(shortName)
}

export function neutralTierFor(shortName: string): number | null {
  const s = normalizeShortName(shortName)
  return CURRENT_NEUTRAL_ARTIFACTS[s] ?? null
}

export function isHiddenCatalogItem(shortName: string, displayName?: string): boolean {
  const s = normalizeShortName(shortName)
  const name = (displayName ?? '').toLowerCase()
  if (s.startsWith('recipe_') || s.includes('_recipe') || s.endsWith('_recipe')) return true
  if (name.includes('recipe')) return true
  if (REMOVED_SHOP_SHORTNAMES.has(s)) return true
  if (ROSHAN_DROP_SHORTNAMES.has(s)) return true
  if (s.includes('aegis') || s.includes('roshan') || name.includes('aegis')) return true
  if (name.includes('refresher shard') || name.includes("aghanim's blessing")) return true
  if (CYCLED_NEUTRAL_SHORTNAMES.has(s)) return true
  if (!displayName || !displayName.trim()) return true
  if (s.includes('river_painter') || s.includes('winter_2022') || s.includes('fall_2021')) return true
  if (s.startsWith('seasonal_') || s.startsWith('muffin')) return true
  return false
}

/** Anything that must never appear in the shop tab */
export function isShopExcluded(shortName: string, isNeutralFlag: boolean): boolean {
  const s = normalizeShortName(shortName)
  if (isNeutralFlag) return true
  if (isCurrentNeutral(s)) return true
  if (CYCLED_NEUTRAL_SHORTNAMES.has(s)) return true
  if (REMOVED_SHOP_SHORTNAMES.has(s)) return true
  if (ROSHAN_DROP_SHORTNAMES.has(s)) return true
  if (s.includes('aegis') || s.includes('roshan')) return true
  if (s.startsWith('recipe_') || s.includes('_recipe') || s.endsWith('_recipe')) return true
  return false
}
