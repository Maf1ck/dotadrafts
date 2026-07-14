/** Curated counter pairs: counter beats victim */
export const HERO_COUNTERS: [string, string, 'low' | 'medium' | 'high', string][] = [
  ['antimage', 'storm_spirit', 'high', 'Mana Break and spell shield shut down Storm burst'],
  ['antimage', 'zuus', 'high', 'Spell Shield blocks global nukes; Blink closes gap'],
  ['puck', 'juggernaut', 'medium', 'Phase Shift dodges Omnislash swings'],
  ['axe', 'antimage', 'medium', 'Call forces AM to fight without Blink timing'],
  ['slardar', 'antimage', 'high', 'Bash and armor reduction punish low-armor carry'],
  ['rubick', 'storm_spirit', 'high', 'Spell Steal turns Storm kit against team'],
  ['life_stealer', 'antimage', 'medium', 'Rage blocks mana burn; Infest saves from burst'],
  ['disruptor', 'puck', 'medium', 'Glimpse catches Phase Shift reposition'],
  ['doom_bringer', 'storm_spirit', 'high', 'Doom disables Storm completely in fights'],
  ['legion_commander', 'axe', 'medium', 'Duel isolates Axe before teamfight'],
  ['phantom_assassin', 'juggernaut', 'medium', 'Blur and burst trade favor PA with BKB timing'],
  ['shadow_shaman', 'rubick', 'medium', 'Hex and shackles lock Rubick before steal'],
  ['templar_assassin', 'storm_spirit', 'medium', 'Refraction blocks magic burst'],
  ['bane', 'storm_spirit', 'high', 'Nightmare and Fiends Grip stop mobile cores'],
  ['winter_wyvern', 'axe', 'high', 'Cold Embrace saves allies from Culling Blade'],
  ['oracle', 'axe', 'medium', 'False Promise counters Culling Blade execute'],
  ['invoker', 'juggernaut', 'medium', 'Cold Snap and combos interrupt healing'],
  ['tinker', 'antimage', 'high', 'AM hunts Tinker across map with Blink'],
  ['broodmother', 'axe', 'medium', 'Spiders overwhelm Axe in lane'],
  ['huskar', 'storm_spirit', 'medium', 'Magic resistance shrinks Storm damage'],
]

/** Synergy pairs: heroes work well together */
export const HERO_SYNERGIES: [string, string, number, string][] = [
  ['juggernaut', 'axe', 8.4, 'Axe Call groups enemies for Omnislash'],
  ['storm_spirit', 'axe', 7.1, 'Storm zip enables Call follow-up'],
  ['crystal_maiden', 'juggernaut', 7.8, 'Aura and slow enable Jugg laning'],
  ['slardar', 'storm_spirit', 8.2, 'Amp damage amplifies Storm burst'],
  ['slardar', 'axe', 7.5, 'Crush setup into Call and Blade Mail'],
  ['disruptor', 'storm_spirit', 7.3, 'Static Storm traps after Ball Lightning'],
  ['rubick', 'puck', 6.8, 'Double shift-blink playmaking'],
  ['enigma', 'wisp', 8.9, 'Relocate + Black Hole wombo combo'],
  ['doom_bringer', 'wisp', 7.6, 'Relocate Doom onto key target'],
  ['morphling', 'winter_wyvern', 7.2, 'Cold Embrace saves low-HP Morph'],
  ['phantom_assassin', 'ogre_magi', 8.0, 'Bloodlust and Fireblast enable PA burst'],
  ['faceless_void', 'invoker', 8.5, 'Chrono + Sun Strike / Meteor'],
  ['tidehunter', 'enigma', 8.1, 'Ravage groups for Black Hole'],
  ['shadow_demon', 'puck', 7.4, 'Disruption sets up Dream Coil'],
  ['grimstroke', 'storm_spirit', 6.9, 'Soulbind doubles Storm damage'],
  ['life_stealer', 'storm_spirit', 6.5, 'Infest bomb after Storm initiation'],
]

export const COMPOSITION_TAGS: Record<string, string[]> = {
  teamfight: ['Initiator', 'Disabler', 'Nuker'],
  push: ['Pusher'],
  catch: ['Disabler', 'Initiator'],
  scaling: ['Carry'],
  burst: ['Nuker'],
  sustain: ['Durable', 'Support'],
}
