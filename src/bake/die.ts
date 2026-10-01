// Die geometry on the bake's tile, split from target.ts so the Still-path SVGs can read the
// name's width without pulling the target builder (3D-only) into the entry chunk.

/** Proof-measured sharpness: texels per glyph track at N = 512 (R-09). */
export const TEXELS_PER_TRACK = 6.5

/** Die geometry in texels for an N² tile. */
export function dieTexels(N: number) {
  const d0 = Math.round(N * 0.05)
  const d1 = N - d0
  return { d0, d1, s: (d1 - d0) / 100 }
}

/** The name's width in die units, as the bake lays it (R-P2-14): `tracks` glyph tracks at 6.5
 *  texels each, on the 512² base tile. The Still-path SVGs draw the name at this width too. */
export function nameWidthDieUnits(tracks: number): number {
  return (tracks * TEXELS_PER_TRACK) / dieTexels(512).s
}
