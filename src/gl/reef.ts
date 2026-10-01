// SM-2 data: the reef (the die's 60-pad ring) as S7 draws it, from bake.json. Pure: no three.js,
// no DOM. World p-space, y north-up.
//
// Ring order is clockwise on screen (north up) starting at the SE corner, where the UART pad
// tethers CyBot (03-motion SM-2): the south edge east → west, the west edge south → north, the
// north edge west → east, the east edge north → south.
import type { BakeMeta } from '../bake/meta'
import { LEAD_Y, leadX } from '../svg/geometry'

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
  /** The lead chip's centre below the die (the DOM chip sits here), world p. */
  lead: { x: number; y: number }
  /** The bond wire as the Still atoll draws it: down to the die edge, across to the lead, down
   *  to the chip's top. World p, pad → lead, with its length. */
  wire: { pts: { x: number; y: number }[]; len: number }
}

/** Die units (the SVG's 0..100, y down) → world p (y up), over bake's die box. One geometry
 *  (R-P2-14): the Still atoll's pads match bake's to 5e-5. */
export const dieToWorld = (die: BakeMeta['die']['box']) => {
  const k = (die.x1 - die.x0) / 100
  return (u: number, v: number) => ({ x: die.x0 + u * k, y: die.y1 - v * k })
}

const order: Record<ReefPad['side'], { base: number; dir: 1 | -1 }> = {
  s: { base: 0, dir: -1 },
  w: { base: 15, dir: -1 },
  n: { base: 30, dir: 1 },
  e: { base: 45, dir: 1 },
}

export function reefFromMeta(meta: Pick<BakeMeta, 'pads' | 'die'>) {
  const perSide = meta.pads.filter((p) => p.side === 's').length
  const pads: ReefPad[] = meta.pads
    .map((p) => {
      const o = order[p.side]
      const ring = o.base + (o.dir === 1 ? p.i : perSide - 1 - p.i)
      return { x: p.x, y: p.y, size: p.size, side: p.side, ring, contact: p.contact, uart: p.uart }
    })
    .sort((a, b) => a.ring - b.ring)
  const w = dieToWorld(meta.die.box)
  const contacts: Contact[] = pads
    .filter((p) => p.contact !== null)
    .sort((a, b) => a.contact! - b.contact!)
    .map((pad) => {
      const k = pad.contact!
      const lx = leadX(k)
      // src/svg/Atoll.tsx: M x,y+1.5 V100 L lx,LEAD_Y−6 V LEAD_Y−1.5 (die units, from the pad centre)
      const u = ((pad.x - meta.die.box.x0) / (meta.die.box.x1 - meta.die.box.x0)) * 100
      const v = ((meta.die.box.y1 - pad.y) / (meta.die.box.y1 - meta.die.box.y0)) * 100
      const pts = [w(u, v + 1.5), w(u, 100), w(lx, LEAD_Y - 6), w(lx, LEAD_Y - 1.5)]
      let len = 0
      for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
      return { k, pad, lead: w(lx, LEAD_Y), wire: { pts, len } }
    })
  return { pads, contacts }
}

export type Reef = ReturnType<typeof reefFromMeta>
