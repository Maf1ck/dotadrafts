// ─── Hero ────────────────────────────────────────────────────────────────────

export interface Hero {
  id: number
  name: string
  localizedName: string
  imageUrl: string
  roles: HeroRole[]
  primaryAttr: 'str' | 'agi' | 'int' | 'all'
  // Base stats from /heroStats
  baseStr: number
  baseAgi: number
  baseInt: number
  strGain: number
  agiGain: number
  intGain: number
  baseArmor: number
  baseAttackMin: number
  baseAttackMax: number
  attackRange: number
  moveSpeed: number
  attackRate: number
  attackType: 'Melee' | 'Ranged'
}

export interface HeroList {
  id: number
  name: string
  localized_name: string
  primary_attr: 'str' | 'agi' | 'int' | 'all'
  attack_type: string
  roles: string[]
  // stat fields from /heroStats
  base_str?: number
  base_agi?: number
  base_int?: number
  str_gain?: number
  agi_gain?: number
  int_gain?: number
  base_armor?: number
  base_attack_min?: number
  base_attack_max?: number
  attack_range?: number
  move_speed?: number
  attack_rate?: number
}

export type HeroRole =
  | 'Carry'
  | 'Support'
  | 'Nuker'
  | 'Disabler'
  | 'Jungler'
  | 'Durable'
  | 'Escape'
  | 'Pusher'
  | 'Initiator'

// ─── Draft Slot ──────────────────────────────────────────────────────────────

export type TeamSide = 'radiant' | 'dire'
export type SlotPosition = 1 | 2 | 3 | 4 | 5

export interface HeroSlot {
  position: SlotPosition
  label: string
  hero: Hero | null
}

export interface TeamDraft {
  side: TeamSide
  bans: (Hero | null)[]
  slots: HeroSlot[]
}

// ─── Win Prediction ──────────────────────────────────────────────────────────

export interface WinPrediction {
  radiantWinRate: number // 0–100
  direWinRate: number // 0–100
  delta: number // positive = Radiant advantage
  deltaHero: string // name of hero that caused last delta
  deltaTeam: TeamSide
}

export interface MetaStatRow {
  label: string
  radiantValue: string
  direValue: string
  /** 'radiant' | 'dire' | 'neutral' */
  advantage: TeamSide | 'neutral'
}

// ─── Recommendation ──────────────────────────────────────────────────────────

export interface RecommendedHero {
  hero: Hero
  score: number // 0–10
  synergyWith: string[]
  counters: string[]
  role: string
  reason?: string
  tags?: { label: string; type: 'synergy' | 'counter' | 'meta' | 'role' }[]
  suggestedPosition?: number
}

export interface CompositionAnalysis {
  radiantTags: string[]
  direTags: string[]
}

// ─── Matchups & Synergy (Detail Section tabs) ────────────────────────────────

export interface SynergyEntry {
  heroA: Hero
  heroB: Hero
  synergyScore: number // 0–10
  description: string
}

export interface CounterEntry {
  counter: Hero
  victim: Hero
  severity: 'low' | 'medium' | 'high'
  description: string
}

export type DetailTab = 'overview' | 'matchups' | 'synergy' | 'composition'

// ─── Filter chips ────────────────────────────────────────────────────────────

export interface PatchInfo {
  version: string
  label: string
}

export interface RankFilter {
  value: string
  label: string
}

// ─── Sandbox ─────────────────────────────────────────────────────────────────

export interface SandboxFeature {
  icon: string
  label: string
  locked: boolean
}
