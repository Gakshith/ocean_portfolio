// CPU twin of the proof's floor shader, plan view (tilt 0), for the baked stills: albedo
// ripple and grain, sun-disc blur of the caustic, ambient, bloom glow, auto-exposure with its toe,
// and the procedural metal layout tinted in over the rise (C-07). Blocks come from floorplan.ts,
// each in its own layer colour. Everything is supersampled 2× and averaged in linear light.
import { renderCaustic, type Slope, type SlopeFn, type View } from './render.ts'

export type RGB = [number, number, number]
const lin = (hex: string): RGB => {
  const c = (i: number) => {
    const v = parseInt(hex.slice(1 + 2 * i, 3 + 2 * i), 16) / 255
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return [c(0), c(1), c(2)]
}
// Tokens (06-final-plan, Design tokens); the shader takes them as linear colours.
const C = {
  sun: lin('#BAC4C2'),
  shade: lin('#6E7E80'),
  light: lin('#E6F4FF'),
  floor: lin('#0E1312'),
  deep: lin('#0A0E0D'),
  cool: [0.74, 0.93, 0.88] as RGB,
  'm1-copper': lin('#D08A62'),
  'm2-violet': lin('#A597DD'),
  'm3-oxide': lin('#86C4A8'),
  al: lin('#C3C9CC'),
}

export interface Look {
  /** focus f: engineered-slope weight */
  f: number
  amb: number
  exp: number
  bloom: number
  /** metal tint 0..1 (the rise) */
  rise: number
  /** swell slope added at every vertex (P = 0 shimmer) */
  swell?: SlopeFn
}
/** P ≥ 0.9: focused, stopped down, bloom on, metal at 35% (the frozen frame). */
export const FOCUSED: Look = { f: 1, amb: 0.02, exp: 0.42, bloom: 1, rise: 1 }

export interface MetalBlock {
  layer: 'm1-copper' | 'm2-violet' | 'm3-oxide'
  /** world p-space box */
  x0: number
  y0: number
  x1: number
  y1: number
}

const fract = (x: number) => x - Math.floor(x)
const hash = (x: number, y: number) => fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453)
function noise(x: number, y: number) {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  let fx = x - ix
  let fy = y - iy
  fx = fx * fx * (3 - 2 * fx)
  fy = fy * fy * (3 - 2 * fy)
  const a = hash(ix, iy)
  const b = hash(ix + 1, iy)
  const c = hash(ix, iy + 1)
  const d = hash(ix + 1, iy + 1)
  return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy
}
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** Separable box blur of a W×H field with a half-width in pixels (edges clamped). */
function box(src: Float64Array, W: number, H: number, r: number): Float64Array {
  if (r < 0.5) return src
  const R = Math.round(r)
  const t = new Float64Array(W * H)
  const o = new Float64Array(W * H)
  for (let y = 0; y < H; y++) {
    let s = 0
    for (let d = -R; d <= R; d++) s += src[y * W + Math.min(W - 1, Math.max(0, d))]
    for (let x = 0; x < W; x++) {
      t[y * W + x] = s / (2 * R + 1)
      s += src[y * W + Math.min(W - 1, x + R + 1)] - src[y * W + Math.max(0, x - R)]
    }
  }
  for (let x = 0; x < W; x++) {
    let s = 0
    for (let d = -R; d <= R; d++) s += t[Math.min(H - 1, Math.max(0, d)) * W + x]
    for (let y = 0; y < H; y++) {
      o[y * W + x] = s / (2 * R + 1)
      s += t[Math.min(H - 1, y + R + 1) * W + x] - t[Math.max(0, y - R) * W + x]
    }
  }
  return o
}

/** Bilinear sample with clamped edges. */
function bil(A: Float64Array, W: number, H: number, x: number, y: number) {
  x = Math.min(W - 1, Math.max(0, x))
  y = Math.min(H - 1, Math.max(0, y))
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const x1 = Math.min(W - 1, x0 + 1)
  const y1 = Math.min(H - 1, y0 + 1)
  const fx = x - x0
  const fy = y - y0
  return (A[y0 * W + x0] * (1 - fx) + A[y0 * W + x1] * fx) * (1 - fy) + (A[y1 * W + x0] * (1 - fx) + A[y1 * W + x1] * fx) * fy
}

/** Layer colour + alpha at a world point: stripes per layer, an aluminium outline (px = tile/1024). */
function metal(blocks: readonly MetalBlock[], x: number, y: number): [RGB, number] | null {
  const px = 2 / 1024
  for (const b of blocks) {
    if (x < b.x0 || x > b.x1 || y < b.y0 || y > b.y1) continue
    const edge = Math.min(x - b.x0, b.x1 - x, y - b.y0, b.y1 - y)
    if (edge < 2 * px) return [C.al, 1]
    const u = x - b.x0
    const v = b.y1 - y
    const stripe = (d: number, pitch: number) => Math.abs(fract(d / pitch + 0.5) - 0.5) * pitch < px
    // Each metal layer runs its own direction, as on a real die: m1 horizontal, m2 vertical, m3 both.
    const on =
      b.layer === 'm1-copper' ? stripe(v, 10 * px) : b.layer === 'm2-violet' ? stripe(u - 4 * px, 18 * px) : stripe(u, 12 * px) || stripe(v, 12 * px)
    return on ? [C[b.layer], b.layer === 'm1-copper' ? 0.9 : 0.8] : null
  }
  return null
}

export interface ShadeInput {
  view: View
  slope: Slope | null
  look: Look
  blocks: readonly MetalBlock[]
  /** Mesh half extent (world); must cover the view plus the light's reach. */
  meshHalf: number
  /** Vertex spacing (world). The die's is the slope texel (2/512); an analytic swell can go finer. */
  meshStep?: number
  /** Optional fade to --floor-deep: returns 0..1 (1 = fully deep) per world point. */
  fade?: (x: number, y: number) => number
}

/** Linear RGB, W×H, canvas order. */
export function shade(inp: ShadeInput): Float64Array {
  const { view, look } = inp
  const SS = 2
  const W = view.W * SS
  const H = view.H * SS
  const big = { ...view, W, H }
  const I0 = renderCaustic(big, { slope: inp.slope, f: look.f, meshHalf: inp.meshHalf, meshStep: inp.meshStep ?? 2 / 512, extra: look.swell })
  const ppw = W / (view.x1 - view.x0) // pixels per world unit
  // The sun is a 0.53° disc, not a point: its image blurs the caustic by ~D·0.0093 (7 taps).
  const rs = 2.0 * 0.0093 * 0.5 * ppw
  const I = new Float64Array(W * H)
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let s = I0[y * W + x] * 2
      for (let k = 0; k < 6; k++) s += bil(I0, W, H, x + rs * Math.cos(k * 1.0472), y + rs * Math.sin(k * 1.0472))
      I[y * W + x] = s / 8
    }
  // Bloom: the RT's mip 3 and mip 5 (1280² over 2.5 world → 8 and 32 RT texels wide).
  const g3 = box(I0, W, H, ((8 / 512) * ppw) / 2)
  const g5 = box(I0, W, H, ((32 / 512) * ppw) / 2)
  const out = new Float64Array(view.W * view.H * 3)
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * W + x
      const px = view.x0 + (x + 0.5) / ppw
      const py = view.y1 - (y + 0.5) / ppw
      const rip = Math.sin(px * 38 + py * 9 + noise(px * 6, py * 6) * 5) * 0.5 + 0.5
      const grain = hash(Math.floor(px * 700), Math.floor(py * 700))
      const m = 0.5 + 0.22 * rip * noise(px * 3 + 2, py * 3 + 2) + 0.14 * grain
      const c = I[i]
      const glow = (g3[i] * 0.1 + g5[i] * 0.07) * look.bloom
      const inTile = Math.abs(px) < 1 && Math.abs(py) < 1
      const lay = inTile && look.rise > 0 ? metal(inp.blocks, px, py) : null
      const la = lay ? lay[1] * (1 - smooth(1.2, 2.5, c)) * 0.35 * look.rise : 0
      const fd = inp.fade ? inp.fade(px, py) : 0
      const o = ((y >> 1) * view.W + (x >> 1)) * 3
      for (let ch = 0; ch < 3; ch++) {
        const alb = C.shade[ch] + (C.sun[ch] - C.shade[ch]) * m
        let v = alb * (look.amb * C.cool[ch] + c * C.light[ch]) + glow * C.light[ch]
        v = Math.pow(1 - Math.exp(-v * look.exp), 1.3)
        if (lay) v = v + (lay[0][ch] - v) * la
        v = v + (C.deep[ch] - v) * fd
        out[o + ch] += v / (SS * SS)
      }
    }
  return out
}

/** Linear → the proof's output encoding (pow 1/2.2), 8-bit RGB. */
export function toBytes(lin: Float64Array): Uint8Array {
  const b = new Uint8Array(lin.length)
  for (let i = 0; i < lin.length; i++) b[i] = Math.max(0, Math.min(255, Math.round(255 * Math.pow(Math.max(0, lin[i]), 1 / 2.2))))
  return b
}

/** The proof's swell (7 waves, periodic over the 2-unit tile), gradient at time t. */
export function swell(t = 0): SlopeFn {
  const W = [
    [3, 1, 0.012],
    [-1, 5, 0.0068],
    [-5, -3, 0.0052],
    [7, 2, 0.004],
    [3, 9, 0.0031],
    [-11, 4, 0.0024],
    [2, -15, 0.0017],
  ]
  return (x, y) => {
    let gx = 0
    let gy = 0
    W.forEach(([m, n, a], i) => {
      const kx = Math.PI * m
      const ky = Math.PI * n
      const om = Math.sqrt(9.8 * Math.hypot(kx, ky)) * 0.16
      const c = a * Math.cos(kx * x + ky * y - om * t + i * 1.7)
      gx += kx * c
      gy += ky * c
    })
    return [gx, gy]
  }
}
