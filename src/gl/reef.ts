// SM-2 data: the reef (the die's 60-pad ring) as S7 draws it, from bake.json. Pure: no three.js,
// no DOM. World p-space, y north-up.
//
// Ring order is clockwise on screen (north up) starting at the SE corner, where the UART pad
// tethers CyBot (03-motion SM-2): the south edge east → west, the west edge south → north, the
// north edge west → east, the east edge north → south.
import type { BakeMeta } from '../bake/meta'

export interface ReefPad {
  x: number
  y: number
  size: number
  side: 'n' | 'e' | 's' | 'w'
  /** Position in the clockwise power-up order, 0..59. */
  ring: number
  /** 1..5 for the contact pads (S7 rows 01–05), else null. */
  contact: number | null
  uart: boolean
}

export interface Contact {
  /** 1..5, west → east, the DOM rows' data-pad. */
  k: number
  pad: ReefPad
  /** The package lead the bond wire runs to, below the die's south edge. */
  lead: { x: number; y: number; w: number; h: number }
  /** Pad's south edge → lead top. */
  wire: { x0: number; y0: number; x1: number; y1: number; len: number }
}

/** Leads sit on one line below the die, fanned wider than the pads (the proof's geometry,
 *  070 + k·93 px of a 512 px tile at y 524, as world units). */
export const LEADS = { x0: -0.7266, pitch: 0.3633, y: -1.0469, w: 0.039, h: 0.0547 } as const

const order: Record<ReefPad['side'], { base: number; dir: 1 | -1 }> = {
  s: { base: 0, dir: -1 },
  w: { base: 15, dir: -1 },
  n: { base: 30, dir: 1 },
  e: { base: 45, dir: 1 },
}

export function reefFromMeta(meta: Pick<BakeMeta, 'pads'>) {
  const perSide = meta.pads.filter((p) => p.side === 's').length
  const pads: ReefPad[] = meta.pads
    .map((p) => {
      const o = order[p.side]
      const ring = o.base + (o.dir === 1 ? p.i : perSide - 1 - p.i)
      return { x: p.x, y: p.y, size: p.size, side: p.side, ring, contact: p.contact, uart: p.uart }
    })
    .sort((a, b) => a.ring - b.ring)
  const contacts: Contact[] = pads
    .filter((p) => p.contact !== null)
    .sort((a, b) => a.contact! - b.contact!)
    .map((pad) => {
      const k = pad.contact!
      const lx = LEADS.x0 + (k - 1) * LEADS.pitch
      const x0 = pad.x
      const y0 = pad.y - pad.size / 2
      const y1 = LEADS.y
      return {
        k,
        pad,
        lead: { x: lx, y: LEADS.y, w: LEADS.w, h: LEADS.h },
        wire: { x0, y0, x1: lx, y1, len: Math.hypot(lx - x0, y1 - y0) },
      }
    })
  return { pads, contacts }
}

export type Reef = ReturnType<typeof reefFromMeta>
