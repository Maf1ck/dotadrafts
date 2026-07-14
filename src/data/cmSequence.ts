import type { TeamSide } from '../types/draft'

export type CmActionType = 'ban' | 'pick'

export interface CmStep {
  type: CmActionType
  /** Which pick-order seat acts: first_pick team or second_pick team */
  seat: 'first' | 'second'
}

/**
 * Captains Mode draft order (patch 7.40+).
 * "first" = team with first pick, "second" = team with second pick.
 */
export const CM_SEQUENCE: CmStep[] = [
  // Ban phase 1
  { type: 'ban', seat: 'first' },
  { type: 'ban', seat: 'first' },
  { type: 'ban', seat: 'second' },
  { type: 'ban', seat: 'second' },
  { type: 'ban', seat: 'first' },
  { type: 'ban', seat: 'second' },
  { type: 'ban', seat: 'second' },
  // Pick phase 1
  { type: 'pick', seat: 'first' },
  { type: 'pick', seat: 'second' },
  { type: 'pick', seat: 'second' },
  { type: 'pick', seat: 'first' },
  // Ban phase 2
  { type: 'ban', seat: 'first' },
  { type: 'ban', seat: 'first' },
  { type: 'ban', seat: 'second' },
  { type: 'ban', seat: 'second' },
  { type: 'ban', seat: 'first' },
  { type: 'ban', seat: 'second' },
  // Pick phase 2
  { type: 'pick', seat: 'second' },
  { type: 'pick', seat: 'first' },
  { type: 'pick', seat: 'first' },
  { type: 'pick', seat: 'second' },
  { type: 'pick', seat: 'second' },
  { type: 'pick', seat: 'first' },
  // Ban phase 3
  { type: 'ban', seat: 'first' },
  { type: 'ban', seat: 'second' },
  { type: 'ban', seat: 'first' },
  { type: 'ban', seat: 'second' },
  // Pick phase 3
  { type: 'pick', seat: 'second' },
  { type: 'pick', seat: 'first' },
]

export function sideForSeat(
  seat: 'first' | 'second',
  firstPickSide: TeamSide,
): TeamSide {
  if (seat === 'first') return firstPickSide
  return firstPickSide === 'radiant' ? 'dire' : 'radiant'
}

export function banSlotsNeeded(firstPickSide: TeamSide): { radiant: number; dire: number } {
  let radiant = 0
  let dire = 0
  for (const step of CM_SEQUENCE) {
    if (step.type !== 'ban') continue
    const side = sideForSeat(step.seat, firstPickSide)
    if (side === 'radiant') radiant++
    else dire++
  }
  return { radiant, dire }
}
