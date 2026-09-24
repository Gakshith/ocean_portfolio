// Plain geometry helpers shared by the SVG components and the DOM overlays (die units).
import { PAD_SIZE } from './floorplan'
import type { Pad } from './floorplan'

export const round = (n: number) => +n.toFixed(2)

export function padRect(p: Pad) {
  return { x: round(p.x - PAD_SIZE / 2), y: round(p.y - PAD_SIZE / 2), width: PAD_SIZE, height: PAD_SIZE }
}

// S7 atoll framing (C-10): the south half of the die plus the bond-out leads.
export const ATOLL_VIEW = { x: -3, y: 44, w: 106, h: 72 } as const
export const LEAD_Y = 110
export const leadX = (n: number) => 8 + (n - 1) * 21

/** Lead chip position as a percentage of the atoll box (for the DOM lead chips). */
export function leadPosition(n: number) {
  const v = ATOLL_VIEW
  return { left: `${((leadX(n) - v.x) / v.w) * 100}%`, top: `${((LEAD_Y - v.y) / v.h) * 100}%` }
}
