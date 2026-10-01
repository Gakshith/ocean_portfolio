// From target to shipped slope field (lead Q1, amended R-P2-05). The 512² die tile [-1, 1] is
// solved under Neumann boundaries: the target is mirrored into a periodic 1024² domain, so the
// solution is even about the tile edges, no light crosses them and the normal displacement there
// is ~0. The tile is cropped out and shipped; bake.json declares slope = 0 outside it, and the
// lagoon carries swell only out to |p| = 3. (A plain uniform-margin embedding does not decay:
// ~28 texels of displacement at the edge, measured.)
import { solve } from './solve.ts'
import type { Target } from '../../src/bake/target.ts'

export const DEPTH = 2.0
export const ETA = 1.333
/** The one solve's schedule (R-P2-15), on a 1024² tile at 13 texels per track: the proof's stages
 *  with blur scales doubled, a gentler stage 3 and a final σ = 2 stage. It resolves single-edged
 *  letters; a 512² solve leaves ghost fold lines around the strokes. */
export const FIELD_SCHEDULE = [
  [16, 3, 0.6],
  [8, 3, 0.5],
  [4, 6, 0.35],
  [3, 10, 0.25],
  [2, 8, 0.2],
] as const

export interface Field {
  N: number
  /** World slope, canvas order (row 0 = north): gx = ∂h/∂x, gy = ∂h/∂y north-up. Exact. */
  gx: Float64Array
  gy: Float64Array
  /** The same slope continued past the tile edge by the mirror symmetry (reference only). */
  full: (px: number, py: number) => [number, number]
  errs: number[]
  /** Max small-angle displacement (texels) on the tile's outer ring: normal and tangential. */
  edgeNormalTexels: number
  edgeTangentialTexels: number
  ms: number
}

export function solveField(
  t: Target,
  onProgress?: (done: number, total: number, err: number) => void,
  schedule: readonly (readonly [number, number, number])[] = FIELD_SCHEDULE,
): Field {
  const N = t.N
  const M = 2 * N
  const mir = (v: number) => (v < N ? v : 2 * N - 1 - v)
  const T = new Float64Array(M * M)
  for (let y = 0; y < M; y++) for (let x = 0; x < M; x++) T[y * M + x] = t.T[mir(y) * N + mir(x)]
  const tau = 2 / N // world size of one tile texel
  const t0 = performance.now()
  const { h, a, errs } = solve({ N: M, target: T, D: DEPTH, eta: ETA, tau, schedule, onProgress })
  const ms = Math.round(performance.now() - t0)
  const H = (x: number, y: number) => h[(((y % M) + M) % M) * M + (((x % M) + M) % M)]
  // Texel differences (= small-angle displacement in texels) and the world slope they imply.
  const dx = (x: number, y: number) => (H(x + 1, y) - H(x - 1, y)) * 0.5
  const dy = (x: number, y: number) => (H(x, y - 1) - H(x, y + 1)) * 0.5 // north-up
  const k = a / tau

  const gx = new Float64Array(N * N)
  const gy = new Float64Array(N * N)
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      gx[y * N + x] = k * dx(x, y)
      gy[y * N + x] = k * dy(x, y)
    }

  let nrm = 0
  let tan = 0
  for (let i = 0; i < N; i++)
    for (const [x, y, vertical] of [
      [0, i, true],
      [N - 1, i, true],
      [i, 0, false],
      [i, N - 1, false],
    ] as const) {
      const ax = Math.abs(dx(x, y))
      const ay = Math.abs(dy(x, y))
      nrm = Math.max(nrm, vertical ? ax : ay)
      tan = Math.max(tan, vertical ? ay : ax)
    }

  // The slope continued past the tile by the mirror symmetry, sampled bilinearly between texel
  // centres exactly as the shipped tile is (reference renders only).
  const full = (px: number, py: number): [number, number] => bilerp(px, py, N, (X, Y) => [k * dx(X, Y), k * dy(X, Y)])
  return { N, gx, gy, full, errs, edgeNormalTexels: nrm, edgeTangentialTexels: tan, ms }
}

/** Bilinear between texel centres of an N² tile (canvas rows, north down) at world p. */
function bilerp(px: number, py: number, N: number, at: (X: number, Y: number) => [number, number]): [number, number] {
  const u = ((px + 1) / 2) * N - 0.5
  const v = ((1 - py) / 2) * N - 0.5
  const x0 = Math.floor(u)
  const y0 = Math.floor(v)
  const fx = u - x0
  const fy = v - y0
  const a = at(x0, y0)
  const b = at(x0 + 1, y0)
  const cc = at(x0, y0 + 1)
  const d = at(x0 + 1, y0 + 1)
  const mix = (i: 0 | 1) => (a[i] * (1 - fx) + b[i] * fx) * (1 - fy) + (cc[i] * (1 - fx) + d[i] * fx) * fy
  return [mix(0), mix(1)]
}

/** A field at half the resolution: 2×2 box-averaged slopes (R-P2-15: the shipped 512² field is
 *  the 1024² solve averaged down, which renders single-edged letters where a native 512² solve
 *  ghosts). Displacements are restated in the coarse field's texels. */
export function downsampleField(f: Field): Field {
  const N = f.N / 2
  const c = 2 / f.N // one fine texel, world
  // Coarse texel (X, Y canvas) = the mean of its four fine children, then bilinear like the tile.
  const coarse = (X: number, Y: number): [number, number] => {
    let gx = 0
    let gy = 0
    for (const i of [0, 1])
      for (const j of [0, 1]) {
        const [a, b] = f.full(-1 + (2 * X + i + 0.5) * c, 1 - (2 * Y + j + 0.5) * c)
        gx += a / 4
        gy += b / 4
      }
    return [gx, gy]
  }
  const full = (px: number, py: number): [number, number] => bilerp(px, py, N, coarse)
  return {
    N,
    gx: downsample2(f.gx, f.N),
    gy: downsample2(f.gy, f.N),
    full,
    errs: f.errs,
    edgeNormalTexels: f.edgeNormalTexels / 2,
    edgeTangentialTexels: f.edgeTangentialTexels / 2,
    ms: f.ms,
  }
}

/** IEEE 754 binary16, round to nearest even (what an RG16F upload stores). */
export function toHalf(v: number): number {
  const f = new Float32Array(1)
  const u = new Uint32Array(f.buffer)
  f[0] = v
  const x = u[0]
  const sign = (x >>> 16) & 0x8000
  const exp = (x >>> 23) & 0xff
  let mant = x & 0x7fffff
  if (exp === 0xff) return sign | 0x7c00 | (mant ? 0x200 : 0)
  let e = exp - 127 + 15
  if (e >= 0x1f) return sign | 0x7c00
  if (e <= 0) {
    if (e < -10) return sign
    mant |= 0x800000
    const shift = 14 - e
    let hm = mant >>> shift
    const rem = mant & ((1 << shift) - 1)
    const half = 1 << (shift - 1)
    if (rem > half || (rem === half && hm & 1)) hm++
    return sign | hm
  }
  let hm = mant >>> 13
  const rem = mant & 0x1fff
  if (rem > 0x1000 || (rem === 0x1000 && hm & 1)) {
    hm++
    if (hm === 0x400) {
      hm = 0
      e++
      if (e >= 0x1f) return sign | 0x7c00
    }
  }
  return sign | (e << 10) | hm
}

export function fromHalf(h: number): number {
  const s = h & 0x8000 ? -1 : 1
  const e = (h >>> 10) & 0x1f
  const m = h & 0x3ff
  if (e === 0) return s * m * 2 ** -24
  if (e === 0x1f) return m ? NaN : s * Infinity
  return s * (1 + m / 1024) * 2 ** (e - 15)
}

/** RG16F little-endian bytes, GL order (row 0 = south, col 0 = west). */
export function packRG16F(gx: Float64Array, gy: Float64Array, N: number): Uint8Array {
  const out = new Uint8Array(N * N * 4)
  const dv = new DataView(out.buffer)
  for (let j = 0; j < N; j++)
    for (let x = 0; x < N; x++) {
      const src = (N - 1 - j) * N + x
      const o = (j * N + x) * 4
      dv.setUint16(o, toHalf(gx[src]), true)
      dv.setUint16(o + 2, toHalf(gy[src]), true)
    }
  return out
}

/** Read an RG16F file back into canvas-order slopes (what the GPU samples). */
export function unpackRG16F(bytes: Uint8Array, N: number) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const gx = new Float64Array(N * N)
  const gy = new Float64Array(N * N)
  for (let j = 0; j < N; j++)
    for (let x = 0; x < N; x++) {
      const dst = (N - 1 - j) * N + x
      const o = (j * N + x) * 4
      gx[dst] = fromHalf(dv.getUint16(o, true))
      gy[dst] = fromHalf(dv.getUint16(o + 2, true))
    }
  return { gx, gy }
}

/** Round every value through float32 (the proof's "f32" reference). */
export const toF32 = (a: Float64Array) => Float64Array.from(Float32Array.from(a))

/** 2×2 box average, canvas order (the low tier's field). */
export function downsample2(a: Float64Array, N: number): Float64Array {
  const M = N / 2
  const o = new Float64Array(M * M)
  for (let y = 0; y < M; y++)
    for (let x = 0; x < M; x++)
      o[y * M + x] = (a[2 * y * N + 2 * x] + a[2 * y * N + 2 * x + 1] + a[(2 * y + 1) * N + 2 * x] + a[(2 * y + 1) * N + 2 * x + 1]) / 4
  return o
}
