// STUB (lead, phase 2 freeze): bake_agent owns src/bake/**. The BakeMeta shape is the contract;
// bake.json (written by `npm run bake`) must satisfy it.
import type { SectionId } from '../state/sections'

/** World p-space, y north-up (three z = -y). */
export type Box = { x0: number; y0: number; x1: number; y1: number }

export interface BakeMeta {
  version: 1
  sha256: { slope512: string; slope256: string; traces: string }
  optics: { depth: number; eta: number }
  tile: { N: 512; world: [number, number]; texel: number; rtExt: number }
  lagoon: { slopeZeroOutside: number; seamAt: number }
  /** p.x = o + u·s, p.y = -(o + v·s); u, v in floorplan die units. */
  die: { toWorld: { s: number; o: number }; box: Box }
  seal: { outer: Box; inner: Box }
  core: Box
  letters: { box: Box; texelsPerTrack: number }
  blocks: { section: SectionId; label: string; layer: 'm1-copper' | 'm2-violet' | 'm3-oxide'; box: Box }[]
  pads: {
    side: 'n' | 'e' | 's' | 'w'
    i: number
    x: number
    y: number
    size: number
    contact: number | null
    uart: boolean
  }[]
  lum: { trace: number; pad: number; seal: number; strap: number; fill: number; core: number }
  acceptance: { LF: number; LC: number; f16rms: number; cropRms: number; edgeDispTexels: number }
  stills: {
    s1: { src: string; srcset: [number, string][] }
    poster: string
    blocks: Record<'radio' | 'cpu' | 'memory', string>
    s6: string
  }
}
