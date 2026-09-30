// The hero renderer (SM-1). Imperative three/webgpu + TSL, driven by the one scroll clock.
// It draws only when something changed (0 idle frames), freezes the caustic passes once the
// water is still (P ≥ 0.9), and every value on screen is a function of the S1 pin progress.
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  HalfFloatType,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  NoColorSpace,
  OrthographicCamera,
  PlaneGeometry,
  RGBAFormat,
  RedFormat,
  RenderTarget,
  Scene,
  UnsignedByteType,
  Vector2,
  Vector4,
  WebGPURenderer,
  FloatType,
  RepeatWrapping,
  DoubleSide,
  CustomBlending,
  OneFactor,
  AddEquation,
  type DataTexture,
  type Material,
} from 'three/webgpu'
import { uniform } from 'three/tsl'
import type { Box } from '../../bake/meta'
import { FpsCut, easeFocus, focusTarget, lerp, s1Camera, s1Light } from '../choreo'
import { applyPose, fitS1, freeRegions, makeCamera, project, fits, sealGap, sealOk, type Rect, type S1Framing, type WBox } from '../framing'
import { loadMasks, loadSlope, loadTraces, meta } from './data'
import { EXT, SKIRT_EXT, blurMaterial, causticMaterial, floorMaterial, makeUniforms, readbackMaterial, sandMaterial } from './shaders'

export type TierName = 'high' | 'low'
export const TIERS = {
  high: { lagoon: 512, sea: 256, skirt: 192, dieRT: 1280, seaRT: 640, skirtRT: 832, disp: 1, bloom: 2, dpr: 2, slope: 512 as const },
  low: { lagoon: 256, sea: 128, skirt: 128, dieRT: 640, seaRT: 320, skirtRT: 416, disp: 0, bloom: 1, dpr: 1.5, slope: 256 as const },
}

/** The clock seam, narrowed to what the engine needs (src/scroll in production, a rAF shim in dev). */
export interface Driver {
  add(fn: (timeMs: number, dtMs: number) => boolean | void): () => void
  invalidate(): void
  heroP(): number
}

export interface Hooks {
  /** ADV_IND milestones: 1 chunk parsed · 2 GPU context · 3 slope field loaded · 4 caustic
   *  shaders compiled · 5 floor compiled + tier chosen. */
  milestone(k: number): void
  firstFrame(ms: number): void
  /** Phone cut (R-P2-10): caustic passes stopped; show the focused still in the stage. */
  freeze(): void
  /** GPU device or context lost. The caller disposes and may try to re-create. */
  lost(): void
}

export interface EngineOptions {
  canvas: HTMLCanvasElement
  driver: Driver
  hooks: Hooks
  /** 'auto' runs the warm-up on fine pointers and picks low on coarse ones. */
  tier?: TierName | 'auto'
  forceWebGL?: boolean
  coarse: boolean
  t0: number
}

const COLORS = {
  sun: new Color('#BAC4C2'),
  shade: new Color('#6E7E80'),
  light: new Color('#E6F4FF'),
  floor: new Color('#0E1312'),
  cool: new Color(0.74, 0.93, 0.88),
  m1: new Color('#D08A62'),
  m2: new Color('#A597DD'),
  m3: new Color('#86C4A8'),
  al: new Color('#C3C9CC'),
}
const LAYER: Record<string, Color> = { 'm1-copper': COLORS.m1, 'm2-violet': COLORS.m2, 'm3-oxide': COLORS.m3 }
/** World box → die-canvas coords over the tile (x0, y0, x1, y1), y down. */
/** How far refracted light can land from its source (world): D·(1−1/η)·max swell slope, rounded up. */
const REACH = 0.3
/** The sun disc's blur σ in world units (radius D·0.0093/2, σ ≈ 0.6 r); D = 2. */
const SUN_SIGMA = 2 * 0.0093 * 0.5 * 0.6

/** Grid geometry over [x0,x1]×[y0,y1] in world p with spacing h, vertices on the global lattice
 *  (multiples of h), so meshes that share an edge share its vertices exactly. World p is `aP`. */
function lattice(x0: number, y0: number, x1: number, y1: number, h: number) {
  const i0 = Math.round(x0 / h)
  const i1 = Math.round(x1 / h)
  const j0 = Math.round(y0 / h)
  const j1 = Math.round(y1 / h)
  const nx = i1 - i0
  const ny = j1 - j0
  const M = nx + 1
  const aP = new Float32Array((nx + 1) * (ny + 1) * 2)
  for (let j = 0; j <= ny; j++)
    for (let i = 0; i <= nx; i++) {
      aP[(j * M + i) * 2] = (i0 + i) * h
      aP[(j * M + i) * 2 + 1] = (j0 + j) * h
    }
  const idx = new Uint32Array(nx * ny * 6)
  let q = 0
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const a = j * M + i
      idx[q++] = a
      idx[q++] = a + 1
      idx[q++] = a + M
      idx[q++] = a + 1
      idx[q++] = a + M + 1
      idx[q++] = a + M
    }
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(new Float32Array((nx + 1) * (ny + 1) * 3), 3))
  g.setAttribute('aP', new BufferAttribute(aP, 2))
  g.setIndex(new BufferAttribute(idx, 1))
  g.userData.rect = { x0: i0 * h, y0: j0 * h, x1: i1 * h, y1: j1 * h }
  return g
}
/** The square frame inner ≤ |p|∞ ≤ outer as four lattice strips. */
const ring = (inner: number, outer: number, h: number) => [
  lattice(-outer, inner, outer, outer, h),
  lattice(-outer, -outer, outer, -inner, h),
  lattice(inner, -inner, outer, inner, h),
  lattice(-outer, -inner, -inner, inner, h),
]

const toC = (b: Box) => new Vector4((b.x0 + 1) / 2, (1 - b.y1) / 2, (b.x1 + 1) / 2, (1 - b.y0) / 2)

const additive = (m: Material) => {
  m.blending = CustomBlending
  m.blendSrc = OneFactor
  m.blendDst = OneFactor
  m.blendEquation = AddEquation
  m.blendSrcAlpha = OneFactor
  m.blendDstAlpha = OneFactor
  m.depthTest = false
  m.depthWrite = false
  m.side = DoubleSide
  return m
}

const yieldTask = () => new Promise<void>((r) => setTimeout(r, 0))
const quantile = (a: number[], q: number) => {
  const s = [...a].sort((x, y) => x - y)
  return s[Math.min(s.length - 1, Math.floor(q * s.length))]
}
const median = (a: number[]) => quantile(a, 0.5)

export async function createEngine(o: EngineOptions) {
  const { canvas, driver, hooks } = o
  o.hooks.milestone(1)

  // ---------- renderer: WebGPU, else the WebGL2 backend of the same renderer ----------
  const wantWebGL = o.forceWebGL || !('gpu' in navigator)
  let renderer = new WebGPURenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance', forceWebGL: wantWebGL, trackTimestamp: true })
  try {
    await renderer.init()
  } catch (e) {
    if (wantWebGL) throw e
    renderer.dispose()
    renderer = new WebGPURenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance', forceWebGL: true, trackTimestamp: true })
    await renderer.init()
  }
  // WebGPURenderer runs its own requestAnimationFrame loop forever (it resets info and advances
  // the node frame). The one clock drives us instead, so stop it and do those two steps only on
  // frames that draw: 0 rAF callbacks while idle.
  const anim = (renderer as unknown as { _animation: { stop(): void; nodes: { nodeFrame: { update(): void } } } })._animation
  anim.stop()
  const beginFrame = () => {
    anim.nodes.nodeFrame.update()
    renderer.info.reset()
  }
  const backendName: 'WebGPU' | 'WebGL2' = (renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend ? 'WebGPU' : 'WebGL2'
  let lost = false
  renderer.onDeviceLost = () => {
    lost = true
    hooks.lost()
  }
  renderer.setClearColor(COLORS.floor, 1)
  hooks.milestone(2)

  // Half-float RTs: always on WebGPU; on WebGL2 they need EXT_color_buffer_(half_)float. Without
  // them the RTs are RGBA8 and intensity is pre-scaled by 1/8.
  let halfOK = true
  if (backendName === 'WebGL2') {
    const ext = (renderer.backend as unknown as { extensions: { has(n: string): boolean } }).extensions
    halfOK = ext.has('EXT_color_buffer_float') || ext.has('EXT_color_buffer_half_float')
  }

  // ---------- data ----------
  // R-P2-16: WebGL2 without KHR_parallel_shader_compile links synchronously; start it low.
  const serialCompile =
    backendName === 'WebGL2' && !(renderer.backend as unknown as { extensions: { has(n: string): boolean } }).extensions.has('KHR_parallel_shader_compile')
  let tierName: TierName = o.tier && o.tier !== 'auto' ? o.tier : o.coarse || serialCompile ? 'low' : 'high'
  const [slopeHi, traces] = await Promise.all([loadSlope(TIERS[tierName].slope), loadTraces()])
  let slopes: Partial<Record<512 | 256, DataTexture>> = { [TIERS[tierName].slope]: slopeHi }
  hooks.milestone(3)

  // ---------- scenes ----------
  const U = makeUniforms()
  U.depth.value = meta.optics.depth
  U.eta.value = meta.optics.eta
  U.iScale.value = halfOK ? 1 : 1 / 8
  const oCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const quad = new PlaneGeometry(2, 2)
  const cam = makeCamera()

  const dieScene = new Scene()
  const seaScene = new Scene()
  const skirtScene = new Scene()
  const blurScene = new Scene()
  const floorScene = new Scene()

  const lagoonMats: Partial<Record<string, Material>> = {}
  const lagoonMat = (n: 512 | 256, ext: number) =>
    (lagoonMats[`${n}:${ext}`] ??= additive(causticMaterial(U, { surface: 'lagoon', ext, slope: slopes[n]!, slopeN: n, traces })))
  const rampDie = additive(causticMaterial(U, { surface: 'ramp', ext: EXT }))
  const rampSkirt = additive(causticMaterial(U, { surface: 'ramp', ext: SKIRT_EXT }))
  const seaMat = additive(causticMaterial(U, { surface: 'sea', ext: EXT }))

  /** The source meshes for the current tier. Each carries the world rect of its sources. */
  const buildMeshes = () => {
    for (const sc of [dieScene, seaScene, skirtScene])
      for (const m of [...sc.children] as Mesh[]) {
        m.geometry.dispose()
        sc.remove(m)
      }
    const T = TIERS[tierName]
    const hL = 2 / T.lagoon
    const hS = 2 / T.sea
    const hK = 2 / T.skirt
    const add = (sc: Scene, geo: BufferGeometry & { userData: { rect?: WBox } }, mat: Material, cull: boolean) => {
      const m = new Mesh(geo, mat)
      m.frustumCulled = false
      m.userData.rect = geo.userData.rect
      m.userData.cull = cull
      sc.add(m)
    }
    // die RT: the lagoon + the ring-1 rim, so it's complete out to |p|∞ = 1.25
    add(dieScene, lattice(-1, -1, 1, 1, hL), lagoonMat(T.slope, EXT), false)
    for (const g of ring(1, EXT + REACH, hK)) add(dieScene, g, rampDie, true)
    // sea RT: one periodic tile
    add(seaScene, lattice(-1, -1, 1, 1, hS), seaMat, false)
    // skirt RT: ring 1, the lagoon's rim and ring 2's rim
    for (let j = -1; j <= 1; j++)
      for (let i = -1; i <= 1; i++) if (i || j) add(skirtScene, lattice(2 * i - 1, 2 * j - 1, 2 * i + 1, 2 * j + 1, hK), rampSkirt, true)
    for (const g of ring(1 - REACH, 1, hL)) add(skirtScene, g, lagoonMat(T.slope, SKIRT_EXT), true)
    for (const g of ring(3, SKIRT_EXT + REACH, hK)) add(skirtScene, g, rampSkirt, true)
  }

  /** Hide source meshes whose light can't reach the screen. */
  const cull = (sc: Scene) => {
    const vw = W.w
    const vh = W.h
    for (const m of sc.children) {
      if (!m.userData.cull) continue
      const b = m.userData.rect as WBox
      const r = project(cam, { x0: b.x0 - REACH, y0: b.y0 - REACH, x1: b.x1 + REACH, y1: b.y1 + REACH }, vw, vh)
      m.visible = r.x1 > 0 && r.x0 < vw && r.y1 > 0 && r.y0 < vh
    }
  }

  // ---------- render targets ----------
  const rt = (size: number, mips: boolean) =>
    new RenderTarget(size, size, {
      type: halfOK ? HalfFloatType : UnsignedByteType,
      format: halfOK ? RedFormat : RGBAFormat,
      depthBuffer: false,
      generateMipmaps: mips,
      minFilter: mips ? LinearMipmapLinearFilter : LinearFilter,
      magFilter: LinearFilter,
      colorSpace: NoColorSpace,
    })
  type Set3 = { raw: RenderTarget; tmp: RenderTarget; out: RenderTarget; h: Material; v: Material; hDir: { value: Vector2 }; vDir: { value: Vector2 }; ext: number }
  const makeSet = (size: number, mips: boolean, ext: number): Set3 => {
    const raw = rt(size, false)
    const tmp = rt(size, false)
    const out = rt(size, mips)
    const hDir = uniform(new Vector2())
    const vDir = uniform(new Vector2())
    // The finite sun blurs every RT by the same world σ, whatever its density.
    const step = ((SUN_SIGMA * (size / (2 * ext))) / 1.75 / size) * sunScale
    hDir.value.set(step, 0)
    vDir.value.set(0, step)
    return { raw, tmp, out, hDir, vDir, h: blurMaterial(raw.texture, hDir), v: blurMaterial(tmp.texture, vDir), ext }
  }
  let sunScale = 1
  let die!: Set3
  let sea!: Set3
  let skirt!: Set3
  const blurQuad = new Mesh(quad)
  blurQuad.frustumCulled = false
  blurScene.add(blurQuad)
  const allocRTs = () => {
    const T = TIERS[tierName]
    die = makeSet(T.dieRT, true, EXT)
    sea = makeSet(T.seaRT, false, EXT)
    skirt = makeSet(T.skirtRT, false, SKIRT_EXT)
  }

  // ---------- sand albedo: one periodic tile, rendered once (not per pixel per frame) ----------
  const sandScene = new Scene()
  const sandQuad = new Mesh(quad, sandMaterial())
  sandQuad.frustumCulled = false
  sandScene.add(sandQuad)
  let sandRT: RenderTarget | null = null
  const bakeSand = async () => {
    const size = tierName === 'high' ? 2048 : 1024
    sandRT?.dispose()
    sandRT = new RenderTarget(size, size, {
      type: UnsignedByteType,
      format: RedFormat,
      depthBuffer: false,
      generateMipmaps: true,
      minFilter: LinearMipmapLinearFilter,
      magFilter: LinearFilter,
      wrapS: RepeatWrapping,
      wrapT: RepeatWrapping,
      colorSpace: NoColorSpace,
    })
    renderer.setRenderTarget(sandRT)
    await renderer.compileAsync(sandScene, oCam)
    await yieldTask()
    renderer.render(sandScene, oCam)
    renderer.setRenderTarget(null)
  }
  await bakeSand()

  // ---------- floor ----------
  const blocks = meta.blocks.slice(0, 3)
  const floorMat = () =>
    floorMaterial(U, {
      sand: sandRT!.texture,
      traces,
      die: die.out.texture,
      sea: sea.out.texture,
      skirt: skirt.out.texture,
      colors: COLORS,
      dieC: toC(meta.die.box),
      blocksC: blocks.map((b) => toC(b.box)) as [Vector4, Vector4, Vector4],
      blockLayers: blocks.map((b) => LAYER[b.layer]) as [Color, Color, Color],
    })
  const floor = new Mesh(new PlaneGeometry(20, 20))
  floor.rotation.x = -Math.PI / 2
  floor.frustumCulled = false
  floorScene.add(floor)

  const build = () => {
    buildMeshes()
    for (const s of [die, sea, skirt]) if (s) for (const r of [s.raw, s.tmp, s.out]) r.dispose()
    allocRTs()
    const old = floor.material as Material
    floor.material = floorMat()
    old.dispose()
  }
  build()

  // ---------- compile, yielding between materials (no long task > 50ms while interactive) ----------
  // Pipelines are keyed by the target's format, so each pass compiles against the RT it really
  // draws into; compiled against the canvas, the first real draw would build them synchronously.
  const compileAll = async () => {
    for (const [i, [sc, set]] of ([[dieScene, die], [seaScene, sea], [skirtScene, skirt]] as const).entries()) {
      performance.mark(`gl:compile:caustic${i}`)
      renderer.setRenderTarget(set.raw)
      await renderer.compileAsync(sc, oCam)
      await yieldTask()
    }
    hooks.milestone(4)
    for (const s2 of [die, sea, skirt])
      for (const [m, target] of [
        [s2.h, s2.tmp],
        [s2.v, s2.out],
      ] as const) {
        blurQuad.material = m
        renderer.setRenderTarget(target)
        await renderer.compileAsync(blurScene, oCam)
        await yieldTask()
      }
    performance.mark('gl:compile:floor')
    renderer.setRenderTarget(null)
    await renderer.compileAsync(floorScene, cam)
    performance.mark('gl:compile:done')
    await yieldTask()
  }
  await compileAll()

  // ---------- passes ----------
  let draws = 0
  let causticUpdates = 0
  const renderSet = (s: Set3, scene: Scene) => {
    renderer.setRenderTarget(s.raw)
    renderer.setClearColor(0x000000, 0)
    renderer.clear()
    renderer.render(scene, oCam)
    blurQuad.material = s.h
    renderer.setRenderTarget(s.tmp)
    renderer.render(blurScene, oCam)
    blurQuad.material = s.v
    renderer.setRenderTarget(s.out)
    renderer.render(blurScene, oCam)
  }
  const renderCaustics = (withSkirt: boolean) => {
    cull(dieScene)
    renderSet(die, dieScene)
    renderSet(sea, seaScene)
    if (withSkirt) {
      cull(skirtScene)
      renderSet(skirt, skirtScene)
    }
    renderer.setRenderTarget(null)
    renderer.setClearColor(COLORS.floor, 1)
    causticUpdates++
  }

  /** First draw of every pass, one task each: any lazy GPU work (RT storage, mip pipelines, a
   *  link the driver deferred) lands in its own short task, never in one long first frame. */
  const prime = async () => {
    for (const [s2, sc] of [
      [die, dieScene],
      [sea, seaScene],
      [skirt, skirtScene],
    ] as const) {
      renderer.setRenderTarget(s2.raw)
      renderer.clear()
      renderer.render(sc, oCam)
      await yieldTask()
      blurQuad.material = s2.h
      renderer.setRenderTarget(s2.tmp)
      renderer.render(blurScene, oCam)
      await yieldTask()
      blurQuad.material = s2.v
      renderer.setRenderTarget(s2.out)
      renderer.render(blurScene, oCam)
      await yieldTask()
    }
    renderer.setRenderTarget(null)
    renderer.setClearColor(COLORS.floor, 1)
    renderer.render(floorScene, cam)
    await yieldTask()
  }
  await prime()

  const W = { w: innerWidth, h: innerHeight }
  let started = false
  let dirty = true
  let causticsStale = true

  // ---------- composition (C-02): measured from the real DOM, fitted, eased ----------
  let plateEl: HTMLElement | null = null
  let plateRect: Rect | null = null
  let comp: S1Framing | null = null
  let compT: S1Framing | null = null
  const letters: WBox = meta.letters.box
  const dieBox: WBox = meta.die.box
  const dieBoxM: WBox = { x0: dieBox.x0 - 0.016, y0: dieBox.y0 - 0.016, x1: dieBox.x1 + 0.016, y1: dieBox.y1 + 0.016 }
  const measure = () => {
    const vw = innerWidth
    const vh = innerHeight
    let top = 0
    let bottom = vh
    let plate: Rect | null = null
    for (const el of document.querySelectorAll<HTMLElement>('[data-gl-avoid]')) {
      const r = el.getBoundingClientRect()
      if (r.width < 1 || r.height < 1) continue
      const full = r.width >= vw * 0.9
      if (full && r.top <= 1) top = Math.max(top, r.bottom)
      else if (full && r.bottom >= vh - 1) bottom = Math.min(bottom, r.top)
      else {
        plateEl = el
        plate = { x0: r.left, y0: r.top, x1: r.right, y1: r.bottom }
      }
    }
    // The plate's pinned rect is only meaningful inside the pin; elsewhere keep the last one.
    if (plate && driver.heroP() < 1) plateRect = plate
    else if (plate && !plateRect) plateRect = { ...plate, y0: plate.y0 + scrollY, y1: plate.y1 + scrollY }
    const regions = freeRegions(vw, vh, top, bottom, plateRect)
    compT = fitS1(cam, letters, dieBoxM, regions, s1Camera(0).tilt, vw, vh, meta.seal.outer, plateRect) ?? compT
    if (!comp && compT) comp = { ...compT }
  }
  measure()

  // ---------- tier warm-up (C-08): throughput of a mid-focus caustic update ----------
  // 12 rounds (2 discarded) of 3 updates + one 1px readback, minus a bare readback, per update;
  // the lower quartile. Summed GPU timestamp queries were tried first and read 2–3× high on
  // Apple's tile-based GPUs (overlapping passes), so the warm-up measures serialized wall time.
  const hasTS = backendName === 'WebGPU' && renderer.hasFeature('timestamp-query')
  let warm: { ms: number; method: string; samples?: number[] } | null = null
  const warmUp = async () => {
    const px = new RenderTarget(1, 1, { type: UnsignedByteType, depthBuffer: false })
    // WebGL2's async readback resolves on frame granularity, so there a synchronous 1px
    // readPixels (which waits for the GPU) is the fence. Each round blocks for ~ms, never 50.
    const gl = backendName === 'WebGL2' ? (renderer.backend as unknown as { gl: WebGL2RenderingContext }).gl : null
    const one = new Uint8Array(4)
    const sync = async () => {
      renderer.setRenderTarget(px)
      renderer.clear()
      if (gl) gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, one)
      else await renderer.readRenderTargetPixelsAsync(px, 0, 0, 1, 1)
    }
    if (compT) applyPose(cam, poseAt(0.25, compT), W.w, W.h)
    applyLight(0.4, 0.25)
    const base: number[] = []
    for (let i = 0; i < 4; i++) {
      const t = performance.now()
      await sync()
      base.push(performance.now() - t)
    }
    const b0 = median(base)
    const samples: number[] = []
    for (let i = 0; i < 12; i++) {
      const t = performance.now()
      for (let k = 0; k < 3; k++) {
        U.time.value = i * 0.05 + k * 0.016
        renderCaustics(true)
      }
      await sync()
      samples.push(Math.max(0, performance.now() - t - b0) / 3)
      await yieldTask()
    }
    px.dispose()
    samples.splice(0, 2)
    return { ms: +quantile(samples, 0.25).toFixed(2), method: gl ? 'readpixels-throughput' : 'readback-throughput', samples: samples.map((v) => +v.toFixed(2)) }
  }
  const setTier = async (name: TierName) => {
    if (name === tierName) return
    tierName = name
    const T = TIERS[name]
    if (!slopes[T.slope]) slopes = { ...slopes, [T.slope]: await loadSlope(T.slope) }
    await bakeSand()
    build()
    await compileAll()
    await prime()
    if (started) resize()
  }
  if (!o.tier || o.tier === 'auto') {
    if (serialCompile) warm = { ms: 0, method: 'no-parallel-compile' }
    else if (!o.coarse) {
      warm = await warmUp()
      if (warm.ms > 6) await setTier('low')
    } else warm = { ms: 0, method: 'coarse-pointer' }
  } else warm = { ms: 0, method: 'forced' }
  U.dispersion.value = TIERS[tierName].disp
  U.bloomLv.value = TIERS[tierName].bloom
  hooks.milestone(5)
  const ro = new ResizeObserver(() => {
    measure()
    driver.invalidate()
  })

  // ---------- camera + light as functions of P ----------
  function poseAt(P: number, c: S1Framing) {
    const { tilt, rise } = s1Camera(P)
    return { tx: c.target.x, ty: c.target.y, dist: lerp(c.near, c.far, rise), tilt, cx: c.cx, cy: c.cy }
  }
  function applyLight(f: number, P: number) {
    const L = s1Light(P, f)
    U.eng.value = L.eng
    U.lagoon.value = L.lagoon
    U.sea.value = L.sea
    U.resid.value = L.resid
    U.ambient.value = L.ambient
    U.exposure.value = L.exposure
    U.bloom.value = L.bloom
    U.f.value = f
    U.metal.value = L.metal
    U.skirtOn.value = Math.abs(L.lagoon - L.sea) > 1e-3 ? 1 : 0
    return L
  }

  // ---------- frame loop (the one clock) ----------
  function resize() {
    const T = TIERS[tierName]
    renderer.setPixelRatio(Math.min(devicePixelRatio, T.dpr))
    renderer.setSize(innerWidth, innerHeight, false)
    W.w = innerWidth
    W.h = innerHeight
    measure()
    if (compT) comp = { ...compT }
    dirty = true
  }
  let t = 0
  let fShown = focusTarget(driver.heroP()) >= 0.999 ? 1 : 0
  let lastP = -1
  let frames = 0
  let first = true
  let frozen = false
  let forcedP: number | null = null
  const fpsCut = new FpsCut()
  // Phone cut 4 watches phones only (coarse pointers).
  const watchFps = o.coarse
  let lastNow = 0

  const onResize = () => {
    resize()
    driver.invalidate()
  }
  addEventListener('resize', onResize)
  document.fonts?.ready.then(() => {
    measure()
    if (compT) comp = { ...compT }
    driver.invalidate()
  })
  started = true
  resize()
  if (plateEl) ro.observe(plateEl)

  const frame = (now: number, dtMs: number) => {
    if (lost || !comp || !compT) return false
    const dt = Math.min(0.05, Math.max(0, dtMs) / 1000)
    const P = forcedP ?? driver.heroP()
    const fT = focusTarget(P)
    fShown = easeFocus(fShown, fT, dt)
    if (Math.abs(fShown - fT) < 1e-4) fShown = fT
    // ease the composition (e.g. ADV_IND collapsing) instead of jumping
    let compMoving = false
    const k = Math.min(1, dt * 6)
    for (const key of ['cx', 'cy', 'near', 'far'] as const) {
      const d = compT[key] - comp[key]
      if (Math.abs(d) > 1e-3) {
        comp[key] += d * k
        compMoving = true
      } else comp[key] = compT[key]
    }
    const L = applyLight(fShown, P)
    const moving = L.moving && !frozen
    if (moving) t += dt * L.speed
    U.time.value = t
    const easing = fShown !== fT
    const changed = dirty || P !== lastP || easing || compMoving || moving || causticsStale
    if (!changed) return false
    beginFrame()
    applyPose(cam, poseAt(P, comp), W.w, W.h)
    // Low tier: caustics at 30 Hz, the floor at 60 (phone cut 2).
    const skipCaustics = tierName === 'low' && moving && !causticsStale && frames % 2 === 1
    if ((moving || causticsStale || easing) && !frozen && !skipCaustics) {
      renderCaustics(U.skirtOn.value > 0.5)
      causticsStale = false
    }
    renderer.render(floorScene, cam)
    draws++
    frames++
    lastP = P
    dirty = false
    if (first) {
      first = false
      hooks.firstFrame(Math.round(performance.now() - o.t0))
    }
    // Phone cut 4: < 45 fps for 2s during the focus → stop the caustic passes (R-P2-10).
    if (watchFps && moving && P < 1 && lastNow) {
      if (fpsCut.push(now - lastNow)) freeze()
    } else if (!moving) fpsCut.reset()
    lastNow = moving ? now : 0
    return moving || easing || compMoving
  }
  const unsub = driver.add(frame)

  function freeze() {
    if (frozen) return
    frozen = true
    renderStatic()
    hooks.freeze()
  }

  /** Deterministic focused RT (t fixed, f = 1, no swell): hash loads, context restore, freeze. */
  function renderStatic() {
    const keep = { e: U.eng.value, l: U.lagoon.value, s: U.sea.value, r: U.resid.value, t: U.time.value }
    U.eng.value = 1
    U.lagoon.value = U.sea.value = U.resid.value = 0
    U.time.value = 0
    renderCaustics(false)
    U.eng.value = keep.e
    U.lagoon.value = keep.l
    U.sea.value = keep.s
    U.resid.value = keep.r
    U.time.value = keep.t
    causticsStale = false
  }
  if (focusTarget(driver.heroP()) >= 0.999 && s1Light(driver.heroP(), 1).moving === false) renderStatic()
  driver.invalidate()

  // ---------- acceptance tests (C-02 framing, C-03 contrast) ----------
  const api = {
    backend: backendName,
    get tier() {
      return tierName
    },
    get warm() {
      return warm
    },
    get draws() {
      return draws
    },
    get causticUpdates() {
      return causticUpdates
    },
    get state() {
      return { P: forcedP ?? driver.heroP(), f: fShown, frozen, comp }
    },
    setP(v: number | null) {
      forcedP = v
      dirty = true
      driver.invalidate()
    },
    setTier: async (n: TierName) => {
      await setTier(n)
      U.dispersion.value = TIERS[n].disp
      U.bloomLv.value = TIERS[n].bloom
      causticsStale = true
      driver.invalidate()
    },
    framingTest() {
      if (!compT) return { error: 'no composition' }
      comp = { ...compT }
      const g = compT.region
      const checks: { P: number; what: string; bbox: number[]; inside: boolean }[] = []
      for (const P of [0.3, 0.45, 0.5, 0.55]) {
        applyPose(cam, poseAt(P, comp), W.w, W.h)
        const r = project(cam, letters, W.w, W.h)
        checks.push({ P, what: 'letters', bbox: [r.x0, r.y0, r.x1, r.y1].map(Math.round), inside: fits(r, g, 0) })
      }
      applyPose(cam, poseAt(1, comp), W.w, W.h)
      const r = project(cam, dieBoxM, W.w, W.h)
      checks.push({ P: 1, what: 'die', bbox: [r.x0, r.y0, r.x1, r.y1].map(Math.round), inside: fits(r, g, 0) })
      // The seal ring never sits tangent to the plate (≥ 32 px clear or ≥ 48 px under), at the
      // hold and at the rise end.
      for (const P of [0.5, 1]) {
        applyPose(cam, poseAt(P, comp), W.w, W.h)
        const gap = sealGap(cam, meta.seal.outer, g, plateRect, W.w, W.h)
        const s = project(cam, meta.seal.outer, W.w, W.h)
        checks.push({ P, what: `seal gap ${Number.isFinite(gap) ? Math.round(gap) : '∞'} px`, bbox: [s.x0, s.y0, s.x1, s.y1].map(Math.round), inside: sealOk(gap) })
      }
      dirty = true
      driver.invalidate()
      return {
        viewport: `${W.w}×${W.h}`,
        region: `${g.name} [${Math.round(g.x0)},${Math.round(g.y0)}]–[${Math.round(g.x1)},${Math.round(g.y1)}]`,
        checks,
        pass: checks.every((c) => c.inside),
      }
    },
    async contrastTest(given?: Uint8Array) {
      // masks: 512², canvas order (row 0 = north); bit 0 letters, bit 1 fill, bit 2 core
      const masks = given ?? (await loadMasks())
      renderStatic()
      const N = 512
      const rb = new RenderTarget(N, N, { type: FloatType, format: RGBAFormat, depthBuffer: false })
      const s = new Scene()
      const qm = new Mesh(quad, readbackMaterial(die.raw.texture))
      qm.frustumCulled = false
      s.add(qm)
      renderer.setRenderTarget(rb)
      renderer.render(s, oCam)
      const buf = (await renderer.readRenderTargetPixelsAsync(rb, 0, 0, N, N)) as Float32Array
      renderer.setRenderTarget(null)
      rb.dispose()
      const read = (flip: boolean) => {
        const I = new Float32Array(N * N)
        for (let r = 0; r < N; r++) for (let x = 0; x < N; x++) I[(flip ? N - 1 - r : r) * N + x] = buf[(r * N + x) * 4] / U.iScale.value
        return I
      }
      const mean = (I: Float32Array, bit: number, fn = (v: number) => v) => {
        let s2 = 0
        let n = 0
        for (let i = 0; i < N * N; i++)
          if (masks[i] & bit) {
            s2 += fn(I[i])
            n++
          }
        return s2 / n
      }
      // Readback row order differs by backend; pick the orientation where the letters light.
      const a = read(true)
      const b = read(false)
      const I = mean(a, 1) >= mean(b, 1) ? a : b
      const L = mean(I, 1)
      const F = mean(I, 2)
      const Cc = mean(I, 4)
      const disp = (x: number) => Math.pow(1 - Math.exp(-(0.52 * (0.02 + x)) * 0.42), 1.3)
      const dL = mean(I, 1, disp)
      const dF = mean(I, 2, disp)
      const dC = mean(I, 4, disp)
      dirty = true
      causticsStale = true
      driver.invalidate()
      return {
        backend: backendName,
        I_letters: +L.toFixed(2),
        I_fill: +F.toFixed(2),
        I_core: +Cc.toFixed(3),
        LF: +(L / F).toFixed(2),
        LC: +(L / Cc).toFixed(1),
        display_LF: +(dL / dF).toFixed(2),
        display_LC: +(dL / dC).toFixed(1),
        pass: L / F >= 3 && L / Cc >= 8,
      }
    },
    renderStatic,
    /** Test hook: isolate the stages that shape letter edges. */
    edgeDebug(o: { dispersion?: 0 | 1; sun?: number; bilinear?: 0 | 1 }) {
      if (o.dispersion !== undefined) U.dispersion.value = o.dispersion
      if (o.bilinear !== undefined) U.slopeBilinear.value = o.bilinear
      if (o.sun !== undefined) {
        sunScale = o.sun
        for (const s2 of [die, sea, skirt]) {
          const size = s2.raw.width
          const step = ((SUN_SIGMA * (size / (2 * s2.ext))) / 1.75 / size) * sunScale
          s2.hDir.value.set(step, 0)
          s2.vDir.value.set(0, step)
        }
      }
      dirty = causticsStale = true
      driver.invalidate()
    },
    /** Test hook: flatten the sand albedo so a screenshot profile measures the light alone. */
    flatSand(on: boolean) {
      U.sandAmt.value = on ? 0 : 1
      dirty = true
      driver.invalidate()
    },
    /** Test hooks: the phone cut and a GPU loss, through the same paths the real events take. */
    freeze,
    loseContext() {
      const be = renderer.backend as unknown as { gl?: WebGL2RenderingContext; device?: GPUDevice }
      if (be.gl) be.gl.getExtension('WEBGL_lose_context')?.loseContext()
      else {
        // three ignores reason 'destroyed' (that's also dispose), so report it as a real loss
        be.device?.destroy()
        renderer.onDeviceLost({ api: 'WebGPU', message: 'test: device destroyed', reason: null, originalEvent: null })
      }
    },
    /** Re-run the tier warm-up now (diagnostics; doesn't change the tier). */
    warmUp: async () => {
      const r = await warmUp()
      dirty = causticsStale = true
      driver.invalidate()
      return r
    },
    /** GPU ms per pass (WebGPU timestamps), median of n. */
    async profile(n = 10) {
      if (!hasTS) return { error: 'no timestamp-query' }
      const out: Record<string, number[]> = { die: [], sea: [], skirt: [], blurDie: [], floor: [] }
      const t = async (k: string, fn: () => void) => {
        await renderer.resolveTimestampsAsync('render')
        fn()
        out[k].push((await renderer.resolveTimestampsAsync('render')) ?? 0)
      }
      cull(dieScene)
      cull(skirtScene)
      for (let i = 0; i < n; i++) {
        U.time.value += 0.03
        await t('die', () => {
          renderer.setRenderTarget(die.raw)
          renderer.clear()
          renderer.render(dieScene, oCam)
        })
        await t('sea', () => {
          renderer.setRenderTarget(sea.raw)
          renderer.clear()
          renderer.render(seaScene, oCam)
        })
        await t('skirt', () => {
          renderer.setRenderTarget(skirt.raw)
          renderer.clear()
          renderer.render(skirtScene, oCam)
        })
        await t('blurDie', () => {
          blurQuad.material = die.h
          renderer.setRenderTarget(die.tmp)
          renderer.render(blurScene, oCam)
          blurQuad.material = die.v
          renderer.setRenderTarget(die.out)
          renderer.render(blurScene, oCam)
        })
        await t('floor', () => {
          renderer.setRenderTarget(null)
          renderer.render(floorScene, cam)
        })
      }
      const vis = (sc: Scene) => sc.children.filter((m) => m.visible).length + '/' + sc.children.length
      return { ...Object.fromEntries(Object.entries(out).map(([k, v]) => [k, +median(v).toFixed(2)])), dieMeshes: vis(dieScene), skirtMeshes: vis(skirtScene), tier: tierName }
    },
  }

  return {
    api,
    backend: backendName,
    dispose() {
      unsub()
      removeEventListener('resize', onResize)
      ro.disconnect()
      renderer.dispose()
    },
  }
}

export type Engine = Awaited<ReturnType<typeof createEngine>>
