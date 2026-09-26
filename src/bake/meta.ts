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
  /** Measured by the bake on its CPU twin of the caustic pass (R-P2-05 amended). */
  acceptance: {
    LF: number
    LC: number
    /** RG16F vs f32, display scale: rms (the proof's GPU run reads 11.8%) and the proof's own
     *  bar, the share of display pixels off by > 10% (C-09's "0.9%"). */
    f16rms: number
    f16PxOff10: number
    /** Crop (slope 0 outside) vs the mirror-continued solution, over the tile. */
    cropRms: number
    /** Normal displacement on the tile edge, texels (Neumann: ~0). */
    edgeDispTexels: number
    /** Tangential displacement along the edge: a shear, harmless, stated so nobody is surprised. */
    edgeTangentialTexels: number
    /** Row-mean I from 3 to 20 texels inside the edge (sea = 1), its max deviation, the last 3
     *  texels' max deviation, and the first 20 texels outside. */
    bandI: number
    bandMaxDev: number
    last3TexelsMaxDev: number
    outsideMaxDev: number
    /** Letter / fill / core contrast measured on the shaded s1 still's pixels. */
    s1Display: { LF: number; LC: number }
    solve: { method: string; bandOfDieMean: number; schedule: number[][]; errFirst: number; errLast: number }
  }
  stills: {
    s1: { src: string; srcset: [number, string][]; w: number; h: number }
    /** P = 0 shimmer; fetched only by the 3D loader, never by the Still path. */
    poster: string
    blocks: Record<'radio' | 'cpu' | 'memory', string>
    /** The SE-reef crop around the UART pad (R-P2-11): the S6 stage's left-edge backdrop. */
    s6: string
    s6Srcset: [number, string][]
    s6Size: { w: number; h: number }
    /** The UART pad centre as a fraction of the s6 image (x from left, y from top). */
    s6Pad: { x: number; y: number }
    /** Encoded sizes, bytes, by file name. */
    bytes: Record<string, number>
  }
}
