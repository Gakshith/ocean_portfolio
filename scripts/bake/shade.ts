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
/** P 0.45–0.55, the hold: focused and stopped down, the camera flat over the die, no metal yet.
 *  The S1 still uses this frame: the name alone, printed in light. */
export const HOLD: Look = { ...FOCUSED, rise: 0 }

export interface MetalBlock {
  layer: 'm1-copper' | 'm2-violet' | 'm3-oxide'
  /** world p-space box */
  x0: number
  y0: number
  x1: number
  y1: number
}

const fract = (x: number) => x - Math.floor(x)
const mod = (x: number, m: number) => x - m * Math.floor(x / m)
const hash = (x: number, y: number) => fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453)
/** Value noise whose lattice wraps every `period` cells (webgl's noiseP), so the tile repeats. */
function noiseP(x: number, y: number, period: number) {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  let fx = x - ix
  let fy = y - iy
  fx = fx * fx * (3 - 2 * fx)
  fy = fy * fy * (3 - 2 * fy)
  const h = (i: number, j: number) => hash(mod(ix + i, period), mod(iy + j, period))
  return (h(0, 0) + (h(1, 0) - h(0, 0)) * fx) * (1 - fy) + (h(0, 1) + (h(1, 1) - h(0, 1)) * fx) * fy
}
/** The sand's albedo factor, periodic over the 2×2 tile (webgl's sandMaterial, un-quantised). */
export function sandT(px: number, py: number): number {
  const x = mod(px, 2)
  const y = mod(py, 2)
  const rip = Math.sin(x * 12 * Math.PI + y * 3 * Math.PI + noiseP(x * 6, y * 6, 12) * 5) * 0.5 + 0.5
  const grain = hash(mod(Math.floor(x * 700), 1400), mod(Math.floor(y * 700), 1400))
  return rip * noiseP(x * 3 + 2, y * 3 + 2, 6) * 0.22 + 0.5 + grain * 0.14
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

/** Separable Gaussian blur (σ in pixels, ±3σ taps, edges clamped). */
function gauss(src: Float64Array, W: number, H: number, sigma: number): Float64Array {
  const R = Math.max(1, Math.ceil(sigma * 3))
  const k: number[] = []
  let sum = 0
  for (let d = -R; d <= R; d++) {
    const w = Math.exp(-(d * d) / (2 * sigma * sigma))
    k.push(w)
    sum += w
  }
  for (let i = 0; i < k.length; i++) k[i] /= sum
  const t = new Float64Array(W * H)
  const o = new Float64Array(W * H)
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let a = 0
      for (let d = -R; d <= R; d++) a += src[y * W + Math.min(W - 1, Math.max(0, x + d))] * k[d + R]
      t[y * W + x] = a
    }
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      let a = 0
      for (let d = -R; d <= R; d++) a += t[Math.min(H - 1, Math.max(0, y + d)) * W + x] * k[d + R]
      o[y * W + x] = a
    }
  return o
}

/** Bilinear read of a tile mask (canvas order) at world p, clamped to the tile. */
function sampleMask(m: { N: number; wide: Float64Array }, px: number, py: number): number {
  return bil(m.wide, m.N, m.N, ((px + 1) / 2) * m.N - 0.5, ((1 - py) / 2) * m.N - 0.5)
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
  /** Vertex spacing (world). The die's is the slope texel (2/512); the sea mesh runs coarser. */
  meshStep?: number
  /** The die's caustic render target, as the GPU pass has it: res² over [-half, half]. */
  rt?: { res: number; half: number }
  /** Output pixel centre (x, y in view pixels) → world p-space; default is the plan view. */
  pixelToWorld?: (x: number, y: number) => [number, number] | null
  /** Optional fade to --floor-deep: returns 0..1 (1 = fully deep) per world point. */
  fade?: (x: number, y: number) => number
  /** The camera's 8% lens falloff (full-frame renders only, e.g. the poster). */
  vignette?: boolean
  /** traces-512 as floats 0..1 (canvas order): the metal keep-out, as webgl ramps it. */
  traces?: { N: number; wide: Float64Array }
}

/** The die RT of the high tier (1280² over ±1.25, 512 RT px per world unit). */
export const DIE_RT = { res: 1280, half: 1.25 }

export interface CausticRT {
  res: number
  half: number
  /** Sun-disc blurred intensity, and the bloom glow (mip 3 · 0.10 + mip 5 · 0.07). */
  I: Float64Array
  glow: Float64Array
}

/** The caustic pass into its RT, then the sun disc (7 taps) and the bloom mips, in RT space. */
export function causticRT(inp: Pick<ShadeInput, 'slope' | 'look' | 'meshHalf' | 'meshStep'>, rt: { res: number; half: number } = DIE_RT): CausticRT {
  const { res, half } = rt
  const raw = renderCaustic({ x0: -half, x1: half, y0: -half, y1: half, W: res, H: res }, {
    slope: inp.slope,
    f: inp.look.f,
    meshHalf: inp.meshHalf,
    meshStep: inp.meshStep ?? 2 / 512,
    extra: inp.look.swell,
  })
  // The sun is a 0.53° disc, not a point: its image blurs the caustic. The live pass uses a
  // separable Gaussian of σ = D·0.0093·0.5·0.6 world units on every RT; so does this.
  const sigma = 2.0 * 0.0093 * 0.5 * 0.6 * (res / (2 * half))
  const I = gauss(raw, res, res, sigma)
  // mip 3 and mip 5 of the RT: 8 and 32 RT texels wide.
  const g3 = box(raw, res, res, 4)
  const g5 = box(raw, res, res, 16)
  const glow = new Float64Array(res * res)
  for (let i = 0; i < glow.length; i++) glow[i] = g3[i] * 0.1 + g5[i] * 0.07
  return { res, half, I, glow }
}

/** Bilinear read of an RT at world p (the floor shader's texture2D). Outside: the flat sea, I = 1. */
function readRT(rt: CausticRT, A: Float64Array, px: number, py: number, outside: number): number {
  const s = rt.res / (2 * rt.half)
  const fx = (px + rt.half) * s - 0.5
  const fy = (rt.half - py) * s - 0.5
  if (fx < -0.5 || fy < -0.5 || fx > rt.res - 0.5 || fy > rt.res - 0.5) return outside
  return bil(A, rt.res, rt.res, fx, fy)
}

/** The proof's foldI: sum the light every neighbouring 2-unit tile throws at p. */
function fold(rt: CausticRT, A: Float64Array, px: number, py: number): number {
  const tx = Math.floor((px + 1) / 2)
  const ty = Math.floor((py + 1) / 2)
  const ux = px - 2 * tx
  const uy = py - 2 * ty
  let acc = 0
  for (let i = -1; i <= 1; i++)
    for (let j = -1; j <= 1; j++) {
      const qx = ux - 2 * i
      const qy = uy - 2 * j
      if (Math.abs(qx) <= rt.half && Math.abs(qy) <= rt.half) acc += readRT(rt, A, qx, qy, 0)
    }
  return acc
}

/** The sea RT of the high tier (640² over ±1.25, a 256² mesh over one periodic tile). */
export const SEA_RT = { res: 640, half: 1.25, meshStep: 2 / 256 }

/** Linear RGB, W×H, canvas order. The composition is webgl's floorMaterial, term for term. */
export function shade(inp: ShadeInput): Float64Array {
  const { view, look } = inp
  const die = causticRT(inp, inp.rt ?? DIE_RT)
  // While the sea moves (the swell), the floor outside the die RT is the folded periodic sea RT;
  // once it has stopped (every focused still), it is flat sand at I = 1.
  const sea = look.swell
    ? causticRT({ slope: null, look, meshHalf: 1, meshStep: SEA_RT.meshStep }, SEA_RT)
    : null
  const SS = 2
  const W = view.W * SS
  const H = view.H * SS
  const toWorld =
    inp.pixelToWorld ??
    ((x: number, y: number): [number, number] => [
      view.x0 + (x / view.W) * (view.x1 - view.x0),
      view.y1 - (y / view.H) * (view.y1 - view.y0),
    ])
  const out = new Float64Array(view.W * view.H * 3)
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const o = ((y >> 1) * view.W + (x >> 1)) * 3
      const u = (x + 0.5) / SS
      const v = (y + 0.5) / SS
      const pw = toWorld(u, v)
      if (!pw) {
        for (let ch = 0; ch < 3; ch++) out[o + ch] += C.floor[ch] / (SS * SS)
        continue
      }
      const [px, py] = pw
      const r = Math.max(Math.abs(px), Math.abs(py))
      const wDie = 1 - smooth(1.15, 1.25, r)
      const Idie = readRT(die, die.I, px, py, 0)
      const outer = sea ? fold(sea, sea.I, px, py) : 1
      const c = outer + (Idie - outer) * wDie
      const glow = readRT(die, die.glow, px, py, 0) * wDie * look.bloom
      const m = sandT(px, py)
      const lay = r < 1 && look.rise > 0 ? metal(inp.blocks, px, py) : null
      // The lit name masks the lower layers: webgl's keep-out ramp over the wide traces mask.
      const keep = lay && inp.traces ? 1 - smooth(0.02, 0.22, sampleMask(inp.traces, px, py)) : 1
      const la = lay ? lay[1] * keep * 0.35 * look.rise : 0
      const fd = inp.fade ? inp.fade(px, py) : 0
      const far = smooth(5, 9, Math.hypot(px, py)) // the far field fades to the unlit floor
      const lens = inp.vignette ? 1 - smooth(0.35, 1, Math.hypot(u / view.W - 0.5, v / view.H - 0.5) * 1.4) * 0.08 : 1
      for (let ch = 0; ch < 3; ch++) {
        const alb = C.shade[ch] + (C.sun[ch] - C.shade[ch]) * m
        let val = alb * (look.amb * C.cool[ch] + c * C.light[ch]) + glow * C.light[ch]
        val = Math.pow(1 - Math.exp(-val * look.exp), 1.3)
        if (lay) val = val + (lay[0][ch] - val) * la
        val = val + (C.floor[ch] - val) * far
        val = Math.min(1, val * lens)
        val = val + (C.deep[ch] - val) * fd
        out[o + ch] += val / (SS * SS)
      }
    }
  return out
}

/** Linear → sRGB 8-bit (the exact curve the renderer's output encoding applies). */
export function toBytes(lin: Float64Array): Uint8Array {
  const b = new Uint8Array(lin.length)
  for (let i = 0; i < lin.length; i++) {
    const v = Math.min(1, Math.max(0, lin[i]))
    const e = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055
    b[i] = Math.round(255 * e)
  }
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
