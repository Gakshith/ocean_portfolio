// TSL node graphs for the hero. One graph compiles to WGSL (WebGPU) and GLSL ES 3 (WebGL2).
//
// Caustics (after Evan Wallace's WebGL Water): a grid mesh over the water refracts a zenith sun
// ray at every vertex by exact Snell's law and lands it on the sand. Additive blending of
// I = (source area / landed area) builds the caustic in a render target.
//
// Surfaces (world p, y north-up):
//   lagoon  the die tile [-1,1]²: engineered slope · f + lagoon swell (+ residual off the traces)
//   ramp    ring 1 around it, out to |p|∞ = 3: swell whose amplitude ramps lagoon → open sea over
//           |p|∞ 1.5 → 3, so the water is one continuous surface with no seam (R-P2-05)
//   sea     one periodic open-sea tile, reused for every tile further out
// Render targets, each COMPLETE for its own region (every source whose light can land there is
// drawn into it, rims included), because summing partial light from RTs of different density
// leaves a visible line where they meet:
//   die RT    |p|∞ ≤ 1.25   lagoon + the ring-1 rim
//   skirt RT  |p|∞ ≤ 3.25   ring 1 + the lagoon rim + the ring-2 rim (only while lagoon ≠ sea)
//   sea RT    one tile ± 0.25, folded periodically everywhere else
// The floor crossfades die → skirt over |p|∞ 1.15 → 1.25 and skirt → sea over 3.15 → 3.25.
import { MeshBasicNodeMaterial, type Texture, type Color, type Vector4 } from 'three/webgpu'
import {
  Fn,
  abs,
  attribute,
  clamp,
  cos,
  dFdx,
  dFdy,
  dot,
  exp,
  float,
  floor,
  fract,
  fwidth,
  If,
  mod,
  ivec2,
  length,
  max,
  min,
  mix,
  normalize,
  positionWorld,
  pow,
  refract,
  screenUV,
  select,
  sin,
  smoothstep,
  texture,
  textureLoad,
  uniform,
  uv,
  varyingProperty,
  vec2,
  vec3,
  vec4,
} from 'three/tsl'

// TSL graphs here are assembled in JS loops (unrolled waves, the fold, the metal layout); the
// generic node types in @types/three can't follow swizzles through that, so nodes are untyped.
// oxlint-disable-next-line typescript/no-explicit-any
type N = any

/** Half-width of every caustic RT around its tile: the tile plus the light it can throw out. */
export const EXT = 1.25
/** The skirt RT covers the 3×3 block of tiles plus the margin. */
export const SKIRT_EXT = 3.25

export function makeUniforms() {
  return {
    time: uniform(0),
    eng: uniform(0),
    lagoon: uniform(1),
    sea: uniform(1),
    resid: uniform(0),
    eta: uniform(1.333),
    depth: uniform(2),
    /** 1, or 1/8 when half-float RTs are missing and the RTs fall back to RGBA8. */
    iScale: uniform(1),
    // floor
    ambient: uniform(0.35),
    exposure: uniform(1.6),
    bloom: uniform(0),
    f: uniform(0),
    metal: uniform(0),
    dispersion: uniform(1),
    bloomLv: uniform(2),
    skirtOn: uniform(0),
  }
}
export type Uniforms = ReturnType<typeof makeUniforms>

// Seven swell components, periodic over the tile (period 2): k = π·(m, n), so tiles repeat with no
// seam. Amplitudes are slope units (the proof's, tuned for 2 units of water).
const WAVES: [number, number, number][] = [
  [3, 1, 0.012],
  [-1, 5, 0.0068],
  [-5, -3, 0.0052],
  [7, 2, 0.004],
  [3, 9, 0.0031],
  [-11, 4, 0.0024],
  [2, -15, 0.0017],
]
function waveGrad(p: N, t: N): N {
  let g: N = vec2(0, 0)
  WAVES.forEach(([m, n, a], i) => {
    const kx = Math.PI * m
    const ky = Math.PI * n
    const om = Math.sqrt(9.8 * Math.hypot(kx, ky)) * 0.16
    const ph = p.x.mul(kx).add(p.y.mul(ky)).sub(t.mul(om)).add(i * 1.7)
    g = g.add(vec2(kx, ky).mul(cos(ph).mul(a)))
  })
  return g
}

export type Surface = 'lagoon' | 'ramp' | 'sea'

interface CausticOpts {
  surface: Surface
  /** Half-width of the target RT around the origin (world). */
  ext: number
  /** Lagoon only: the RG16F slope field, its side, and the 512² R8 residual-calm mask. */
  slope?: Texture
  slopeN?: number
  traces?: Texture
}

/** Meshes carry their world position in `aP` (vec2); `position` is unused. */
export function causticMaterial(U: Uniforms, o: CausticOpts) {
  const m = new MeshBasicNodeMaterial()
  const vOld = varyingProperty('vec2', 'vOld')
  const vNew = varyingProperty('vec2', 'vNew')

  m.vertexNode = Fn(() => {
    const pw = attribute('aP', 'vec2')
    let g: N
    if (o.surface === 'lagoon') {
      const n = o.slopeN!
      const u = pw.add(1).mul(0.5)
      const e = textureLoad(o.slope!, ivec2(clamp(floor(u.mul(n)), 0, n - 1))).rg
      const wide = textureLoad(o.traces!, ivec2(clamp(floor(u.mul(512)), 0, 511))).r
      const calm = float(1).sub(smoothstep(0.02, 0.22, wide))
      // Hard crop (R-P2-05): the lagoon mesh covers exactly [-1,1]², so the engineered slope is 0
      // outside it. No taper: on the Neumann bake a taper itself prints a ~4.5% dark ring.
      g = e.mul(U.eng).add(waveGrad(pw, U.time).mul(U.lagoon.add(U.resid.mul(calm))))
    } else if (o.surface === 'ramp') {
      const amp = mix(U.lagoon, U.sea, smoothstep(1.5, 3, max(abs(pw.x), abs(pw.y))))
      g = waveGrad(pw, U.time).mul(amp.add(U.resid))
    } else {
      g = waveGrad(pw, U.time).mul(U.sea.add(U.resid))
    }
    const nrm = normalize(vec3(g.x.negate(), g.y.negate(), 1))
    const r = refract(vec3(0, 0, -1), nrm, float(1).div(U.eta))
    const hit = pw.add(r.xy.mul(U.depth.div(r.z.negate())))
    vOld.assign(pw)
    vNew.assign(hit)
    return vec4(hit.div(o.ext), 0, 1)
  })()

  m.colorNode = Fn(() => {
    const ox = dFdx(vOld)
    const oy = dFdy(vOld)
    const nx = dFdx(vNew)
    const ny = dFdy(vNew)
    const a0 = abs(ox.x.mul(oy.y).sub(ox.y.mul(oy.x)))
    const a1 = abs(nx.x.mul(ny.y).sub(nx.y.mul(ny.x)))
    // Capped at ~66×; +1e-8 so a half-precision driver can't produce NaN (C-08).
    const I = a0.div(max(a1, a0.mul(0.015)).add(1e-8)).mul(U.iScale)
    return vec4(I, I, I, 1)
  })()
  return m
}

/** One direction of the separable finite-sun blur. The sun is a 0.53° disc, so its image blurs
 *  the caustic by a disc of radius depth·tan(0.265°) ≈ D·0.0093/2 (σ ≈ r/2 per axis). */
export function blurMaterial(src: Texture, dir: N) {
  const m = new MeshBasicNodeMaterial()
  const W = [0.0162, 0.0540, 0.1216, 0.1945, 0.2274]
  m.colorNode = Fn(() => {
    // screenUV addresses the target the same way the source is addressed, so a pass never flips.
    const t = src
    let s: N = texture(t, screenUV).r.mul(W[4])
    for (let k = 1; k <= 4; k++) {
      const off = dir.mul(k)
      s = s.add(texture(t, screenUV.add(off)).r.mul(W[4 - k]))
      s = s.add(texture(t, screenUV.sub(off)).r.mul(W[4 - k]))
    }
    return vec4(s, s, s, 1)
  })()
  m.depthTest = false
  m.depthWrite = false
  return m
}

const hash = (p: N) => fract(sin(dot(p, vec2(127.1, 311.7))).mul(43758.5453))
/** Value noise whose lattice wraps every `period` cells, so the tile repeats seamlessly. */
function noiseP(p: N, period: number) {
  const i = floor(p)
  const f0 = fract(p)
  const f: N = f0.mul(f0).mul(float(3).sub(f0.mul(2)))
  const h = (o: [number, number]) => hash(mod(i.add(vec2(o[0], o[1])), period))
  return mix(mix(h([0, 0]), h([1, 0]), f.x), mix(h([0, 1]), h([1, 1]), f.x), f.y)
}

/** The sand's albedo factor over one 2×2 tile, rendered once into a mipmapped R8 texture that
 *  the floor samples with repeat wrapping: ripples + grain, periodic (k = π·m) so tiles repeat. */
export function sandMaterial() {
  const m = new MeshBasicNodeMaterial()
  m.colorNode = Fn(() => {
    const p = uv().mul(2)
    const rip = sin(p.x.mul(12 * Math.PI).add(p.y.mul(3 * Math.PI)).add(noiseP(p.mul(6), 12).mul(5))).mul(0.5).add(0.5)
    const grain = hash(mod(floor(p.mul(700)), 1400))
    const t = rip.mul(noiseP(p.mul(3).add(2), 6)).mul(0.22).add(0.5).add(grain.mul(0.14)).sub(0.36).div(0.72)
    return vec4(t, t, t, 1)
  })()
  m.depthTest = false
  m.depthWrite = false
  return m
}

export interface FloorOpts {
  sand: Texture
  die: Texture
  sea: Texture
  skirt: Texture
  colors: {
    sun: Color
    shade: Color
    light: Color
    floor: Color
    cool: Color
    m1: Color
    m2: Color
    m3: Color
    al: Color
  }
  /** The die box and the three blocks in die-canvas coords c ∈ [0,1]² over the tile (y down),
   *  as (x0, y0, x1, y1). */
  dieC: Vector4
  blocksC: [Vector4, Vector4, Vector4]
  blockLayers: [Color, Color, Color]
}

export function floorMaterial(U: Uniforms, o: FloorOpts) {
  const m = new MeshBasicNodeMaterial()
  const dieTex = texture(o.die)
  const sandTex = texture(o.sand)
  const seaTex = texture(o.sea)
  const skirtTex = texture(o.skirt)
  const C = {
    sun: uniform(o.colors.sun),
    shade: uniform(o.colors.shade),
    light: uniform(o.colors.light),
    floor: uniform(o.colors.floor),
    cool: uniform(o.colors.cool),
    al: uniform(o.colors.al),
    m3: uniform(o.colors.m3),
  }
  const dieC = uniform(o.dieC)
  const blocks = o.blocksC.map((b) => uniform(b))
  const layers = o.blockLayers.map((c) => uniform(c))

  const inBox = (p: N, ext: number) => max(abs(p.x), abs(p.y)).lessThanEqual(ext)
  // three's render-target convention (both backends): v = 0 is the top of clip space (north).
  const rtUV = (p: N, ext: number) => vec2(p.x.div(2 * ext).add(0.5), float(0.5).sub(p.y.div(2 * ext)))

  // Procedural metal (C-07): vector-sharp at any zoom, averaged to coverage when sub-pixel. One
  // fwidth(c) per pixel (taken in uniform control flow) serves every edge below, so the layout
  // itself can sit in a per-pixel branch that skips everything outside the die.
  const aa = (d: N, hw: number | N, fw: N) => float(1).sub(smoothstep(fw.negate().add(hw), fw.add(hw), d))
  const band = (x: N, c: N, hw: number, fw: N) => aa(abs(x.sub(c)), hw, fw)
  const stripes = (x: N, pitch: number, hw: number, fw: N) => {
    const d = abs(fract(x.div(pitch).add(0.5)).sub(0.5)).mul(pitch)
    return mix(aa(d, hw, fw), (2 * hw) / pitch, smoothstep(0.25 * pitch, 0.5 * pitch, fw))
  }
  const inRect = (c: N, r: N, fw: N) => {
    const a: N = smoothstep(r.xy.sub(fw), r.xy.add(fw), c).mul(float(1).sub(smoothstep(r.zw.sub(fw), r.zw.add(fw), c)))
    return a.x.mul(a.y)
  }
  const PX = 1 / 1024
  const metalLayout = (c: N, fw: N) => {
    const rgb = vec3(0, 0, 0).toVar()
    const a = float(0).toVar()
    blocks.forEach((r, i) => {
      // Only pixels inside the block (plus an AA pixel) pay for its stripes.
      const near = c.x.greaterThan(r.x.sub(fw.x)).and(c.x.lessThan(r.z.add(fw.x))).and(c.y.greaterThan(r.y.sub(fw.y))).and(c.y.lessThan(r.w.add(fw.y)))
      If(near, () => {
        const inside = inRect(c, r, fw)
        const m1 = stripes(c.y.sub(r.y), 10 * PX, PX, fw.y).mul(inside)
        const m2 = stripes(c.x.sub(r.x).sub(4 * PX), 18 * PX, PX, fw.x).mul(inside)
        const ol = inside.mul(float(1).sub(inRect(c, r.add(vec4(2 * PX, 2 * PX, -2 * PX, -2 * PX)), fw)))
        rgb.assign(mix(mix(mix(rgb, layers[i], m1.mul(0.9)), C.al, m2.mul(0.5)), C.al, ol))
        a.assign(max(max(max(a, m1.mul(0.9)), m2.mul(0.5)), ol))
      })
    })
    const W = dieC.z.sub(dieC.x)
    const lo = dieC.x.add(W.mul(0.08))
    const hi = dieC.x.add(W.mul(0.92))
    const inX = select(c.x.greaterThanEqual(lo).and(c.x.lessThanEqual(hi)), float(1), float(0))
    const inY = select(c.y.greaterThanEqual(lo).and(c.y.lessThanEqual(hi)), float(1), float(0))
    const gy = max(max(band(c.y, dieC.x.add(W.mul(0.36)), 1.5 * PX, fw.y), band(c.y, dieC.x.add(W.mul(0.7)), 1.5 * PX, fw.y)), band(c.y, dieC.x.add(W.mul(0.82)), 1.5 * PX, fw.y))
    const gx = max(band(c.x, dieC.x.add(W.mul(0.3)), 1.5 * PX, fw.x), band(c.x, dieC.x.add(W.mul(0.62)), 1.5 * PX, fw.x))
    const g3 = max(gy.mul(inX), gx.mul(inY))
    rgb.assign(mix(rgb, C.m3, g3.mul(0.9)))
    a.assign(max(a, g3.mul(0.9)))
    return vec4(rgb, a)
  }

  m.colorNode = Fn(() => {
    const p = vec2(positionWorld.x, positionWorld.z.negate())

    // --- light: one complete RT per region, crossfaded at the handoffs ---
    const r = max(abs(p.x), abs(p.y))
    const dUV = rtUV(p, EXT)
    const inDie = r.lessThanEqual(EXT)
    const Idie = select(inDie, dieTex.sample(dUV).r, float(0))
    const tl = floor(p.add(1).mul(0.5))
    const lu = p.sub(tl.mul(2))
    const sx = select(lu.x.greaterThanEqual(0), float(1), float(-1))
    const sy = select(lu.y.greaterThanEqual(0), float(1), float(-1))
    let Isea: N = float(0)
    for (const [ax, ay] of [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ]) {
      const q = lu.sub(vec2(sx.mul(ax), sy.mul(ay)).mul(2))
      Isea = Isea.add(select(inBox(q, EXT), seaTex.sample(rtUV(q, EXT)).r, float(0)))
    }
    const Iskirt = select(r.lessThanEqual(SKIRT_EXT), skirtTex.sample(rtUV(p, SKIRT_EXT)).r, float(0))
    const outer = select(U.skirtOn.greaterThan(0.5), mix(Iskirt, Isea, smoothstep(3.15, 3.25, r)), Isea)
    const wDie = float(1).sub(smoothstep(1.15, 1.25, r))
    const I = mix(outer, Idie, wDie)

    // --- bloom: mip glow of the die RT ---
    const g3 = dieTex.sample(dUV).level(float(3)).r.mul(0.1)
    const g5 = dieTex.sample(dUV).level(float(5)).r.mul(0.07).mul(select(U.bloomLv.greaterThan(1.5), float(1), float(0)))
    const glow = g3.add(g5).mul(wDie)

    // --- sand: the baked periodic albedo factor (mipmaps take care of the grain far away) ---
    const alb = mix(C.shade, C.sun, sandTex.sample(p.mul(0.5)).r.mul(0.72).add(0.36))

    const c = vec3(I, I, I).toVar()
    // --- dispersion (high tier, while focused): 3 samples of the one RT along the light
    // gradient, taken from screen derivatives and pulled back to world space (C-08) ---
    If(U.dispersion.mul(U.f).greaterThan(0.001), () => {
      const gx = dFdx(Idie)
      const gy = dFdy(Idie)
      const gw = dFdx(p).mul(gx).add(dFdy(p).mul(gy))
      const dir = normalize(gw.add(1e-7)).mul(0.0035).mul(U.f)
      const Ir = I.add(wDie.mul(dieTex.sample(rtUV(p.add(dir), EXT)).r.sub(Idie)))
      const Ib = I.add(wDie.mul(dieTex.sample(rtUV(p.sub(dir), EXT)).r.sub(Idie)))
      c.assign(vec3(Ir, I, Ib))
    })

    const col = alb.mul(C.cool.mul(U.ambient).add(c.mul(C.light))).add(C.light.mul(glow).mul(U.bloom)).toVar()
    // exposure (auto: stops down as the light focuses) + toe
    col.assign(pow(float(1).sub(exp(col.mul(U.exposure).negate())), vec3(1.3, 1.3, 1.3)))

    // top metal (from P 0.72): the lit name masks the lower layers
    const cc = vec2(p.x.add(1).mul(0.5), float(1).sub(p.y).mul(0.5))
    const fwc = fwidth(cc)
    If(U.metal.greaterThan(0.001).and(r.lessThan(1)), () => {
      const lay = metalLayout(cc, fwc)
      const la = lay.w.mul(float(1).sub(smoothstep(1.2, 2.5, I))).mul(0.35).mul(U.metal)
      col.assign(mix(col, lay.xyz, la))
    })

    // far field fades to the unlit floor; 8% physical lens falloff
    col.assign(mix(col, C.floor, smoothstep(5, 9, length(p))))
    const v = length(screenUV.sub(0.5)).mul(1.4)
    col.assign(col.mul(float(1).sub(smoothstep(0.35, 1, v).mul(0.08))))
    return vec4(min(col, vec3(1, 1, 1)), 1)
  })()
  return m
}

/** Test-only: the raw die RT over the tile [-1,1]² into a float target, for contrastTest. */
export function readbackMaterial(src: Texture) {
  const m = new MeshBasicNodeMaterial()
  const t = texture(src)
  m.colorNode = Fn(() => {
    const p = uv().mul(2).sub(1)
    return vec4(t.sample(rtUV2(p)).level(float(0)).r, 0, 0, 1)
  })()
  return m
}
const rtUV2 = (p: N) => vec2(p.x.div(2 * EXT).add(0.5), float(0.5).sub(p.y.div(2 * EXT)))
