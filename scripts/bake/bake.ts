// `npm run bake`: the offline bake (build order step 5). Deterministic; its outputs are committed
// and CI only reads them. `npm run bake -- --check` re-bakes in memory and fails on any byte that
// differs from what is on disk.
//   public/bake/slope-512.f16, slope-256.f16, traces-512.u8   the field for webgl (contract seam 1)
//   public/bake/*.avif                                          the stills
//   public/bake/manifest.sha256                                 one line per output
//   src/bake/bake.json                                          BakeMeta (src/bake/meta.ts)
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import G from '../../src/content/glyphs.json' with { type: 'json' }
import * as fp from '../../src/svg/floorplan.ts'
import { BAND_OF_DIE_MEAN, LUM, TEXELS_PER_TRACK, makeTarget, tracesMask } from '../../src/bake/target.ts'
import type { BakeMeta, Box } from '../../src/bake/meta.ts'
import { DEPTH, ETA, FIELD_SCHEDULE, downsample2, downsampleField, packRG16F, solveField, toF32, unpackRG16F } from './field.ts'
import { contrast, precision, seam, tileIntensity } from './metrics.ts'
import { FOCUSED, HOLD, shade, swell, toBytes, type MetalBlock } from './shade.ts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..')
const PUB = join(ROOT, 'public/bake')
const META = join(ROOT, 'src/bake/bake.json')
const N = 512
const RT_EXT = 1.25
const log = (s: string) => process.stderr.write(s + '\n')

// Encoder settings are part of the output: pinned sharp (0.35.4), one thread, fixed effort.
sharp.concurrency(1)
const AVIF = { effort: 6, chromaSubsampling: '4:2:0' } as const
const QUALITIES = [70, 64, 58, 52, 46, 40, 34, 28, 22]

async function avif(rgb: Uint8Array, W: number, H: number, budget: number, resizeTo?: number) {
  for (const quality of QUALITIES) {
    let img = sharp(rgb, { raw: { width: W, height: H, channels: 3 } })
    if (resizeTo && resizeTo !== W) img = img.resize({ width: resizeTo, kernel: 'lanczos3' })
    const buf = await img.avif({ ...AVIF, quality }).toBuffer()
    if (buf.length <= budget) return { buf, quality }
  }
  throw new Error(`no AVIF quality fits ${budget} bytes (${W}×${H} → ${resizeTo ?? W})`)
}

export async function bake(): Promise<Map<string, Uint8Array>> {
  const out = new Map<string, Uint8Array>()
  const t = makeTarget(G, fp, N)
  log(`target: die mean ${t.dieMean.toFixed(4)}, band ${BAND_OF_DIE_MEAN} × die mean`)
  // One solve, at 1024² (13 texels per track, R-P2-15). The runtime fields are it averaged down:
  // a native 512² solve leaves ghost fold lines around the strokes; this one does not.
  const t2 = makeTarget(G, fp, 2 * N)
  const f2 = solveField(t2, (d, n, e) => process.stderr.write(`\rsolve 1024² ${d}/${n} err ${e}   `))
  log(`\nsolve: ${f2.ms} ms, err ${f2.errs[0]} → ${f2.errs[f2.errs.length - 1]}`)
  const field = downsampleField(f2)

  // --- the field -------------------------------------------------------------------------
  const slope1024 = packRG16F(f2.gx, f2.gy, 2 * N)
  const slope512 = packRG16F(field.gx, field.gy, N)
  const slope256 = packRG16F(downsample2(field.gx, N), downsample2(field.gy, N), N / 2)
  const wide = tracesMask(t)
  const traces = new Uint8Array(N * N)
  for (let j = 0; j < N; j++) for (let x = 0; x < N; x++) traces[j * N + x] = Math.round(255 * wide[(N - 1 - j) * N + x])
  out.set('public/bake/slope-1024.f16', slope1024)
  out.set('public/bake/slope-512.f16', slope512)
  out.set('public/bake/slope-256.f16', slope256)
  out.set('public/bake/traces-512.u8', traces)

  // --- acceptance, measured on what ships -------------------------------------------------
  const shipped = { N, ...unpackRG16F(slope512, N) }
  const I16 = tileIntensity(shipped)
  const I32 = tileIntensity({ N, gx: toF32(field.gx), gy: toF32(field.gy) })
  const con = contrast(t, I16)
  const pre = precision(I32, I16, N)
  // The seam is about truncation, so it compares exact against exact (f16 is measured above).
  const sm = seam({ N, gx: field.gx, gy: field.gy }, field.full)
  log(`contrast LF ${con.LF.toFixed(2)} LC ${con.LC.toFixed(1)} · f16 ${(pre.rms * 100).toFixed(1)}% rms, ${(pre.pxOff10 * 100).toFixed(2)}% px off >10%`)
  log(`seam: band I ${sm.bandI.toFixed(3)} (±${sm.bandMaxDev.toFixed(3)}), last 3 texels ${sm.last3TexelsMaxDev.toFixed(3)}, outside ${sm.outsideMaxDev.toFixed(3)}, crop vs full ${(sm.cropRms * 100).toFixed(2)}% · edge normal ${field.edgeNormalTexels.toFixed(3)} / tangential ${field.edgeTangentialTexels.toFixed(1)} texels`)

  // --- the high tier's own field, and the stills' ---------------------------------------
  // The stills render from slope-1024.f16 itself, the file the high tier ships, so the footer's
  // "a surface solved the same way" is literal on every tier (R-P2-08).
  const stillSlope = { N: 2 * N, ...unpackRG16F(slope1024, 2 * N) }
  const c2 = contrast(t2, tileIntensity(stillSlope))
  log(`slope-1024 (f16): LF ${c2.LF.toFixed(2)} LC ${c2.LC.toFixed(1)}`)

  // --- geometry in world p-space -----------------------------------------------------------
  const s = (t.die.s * 2) / N
  const o = -1 + (t.die.d0 * 2) / N
  const du = (u0: number, v0: number, u1: number, v1: number): Box => ({ x0: o + u0 * s, x1: o + u1 * s, y0: -(o + v1 * s), y1: -(o + v0 * s) })
  const r4 = (b: Box): Box => ({ x0: +b.x0.toFixed(6), y0: +b.y0.toFixed(6), x1: +b.x1.toFixed(6), y1: +b.y1.toFixed(6) })
  const tex = (X: number) => -1 + (X * 2) / N
  const blocks = fp.blocks.map((b) => ({ section: b.section, label: b.label, layer: b.layer, box: r4(du(b.x, b.y, b.x + b.w, b.y + b.h)) }))
  const metalBlocks: MetalBlock[] = blocks.map((b) => ({ layer: b.layer, ...b.box }))

  // --- stills --------------------------------------------------------------------------------
  const view = (b: Box, W: number) => ({ ...b, W, H: Math.round((W * (b.y1 - b.y0)) / (b.x1 - b.x0)) })
  // Stills: the 1024² field through the live floor, its die RT at ~the output's density (2048²).
  const still = (b: Box, W: number, look = FOCUSED, fade?: (x: number, y: number) => number) => {
    const v = view(b, W)
    const rgb = shade({ view: v, slope: stillSlope, look, blocks: metalBlocks, meshHalf: RT_EXT, meshStep: 2 / stillSlope.N, rt: { res: 2048, half: RT_EXT }, fade, traces: { N, wide } })
    return { v, rgb: toBytes(rgb) }
  }
  const sizes: Record<string, number> = {}
  const put = (name: string, buf: Uint8Array) => {
    out.set(`public/bake/${name}`, buf)
    sizes[name] = buf.length
  }

  // S1: the hold (P 0.45–0.55): focused, camera flat over the die, the name alone in light, no
  // metal yet. Plan view, the die plus 4 die units (the page masks that margin into the ground).
  const s1 = still(du(-4, -4, 104, 104), 1600, HOLD)
  const s1Budget = 60_000
  const s1Set: [number, string][] = []
  for (const w of [640, 1024, 1600]) {
    const { buf, quality } = await avif(s1.rgb, s1.v.W, s1.v.H, s1Budget, w)
    put(`s1-${w}.avif`, buf)
    s1Set.push([w, `bake/s1-${w}.avif`])
    log(`s1-${w}: ${buf.length} B (q${quality})`)
  }
  const s1Contrast = displayContrast(s1.rgb, s1.v, t)

  // Poster: P = 0, the live opening frame (webgl_agent's camera at 1440×900: fov 35°, tilt 28°,
  // fitted view offset), the swell at t = 0, the die RT plus the folded sea RT, the lens falloff.
  // One file, cover-cropped at every viewport; the perspective breaks up the tile repeat.
  const pv = { x0: 0, x1: 1, y0: 0, y1: 1, W: 1600, H: 1000 }
  const posterRgb = toBytes(
    shade({
      view: pv,
      slope: null,
      look: { f: 0, amb: 0.35, exp: 1.6, bloom: 0, rise: 0, swell: swell(0) },
      blocks: [],
      meshHalf: RT_EXT,
      pixelToWorld: openingCamera(pv.W, pv.H),
      vignette: true,
    }),
  )
  const poster = await avif(posterRgb, pv.W, pv.H, 60_000)
  put('poster.avif', poster.buf)
  log(`poster: ${poster.buf.length} B (q${poster.quality})`)

  // Block plan stills: each block ± 2 die units at the frozen exposure (flat-DOM backdrops).
  const keys = { 'link-layer': 'radio', 'risc-v': 'cpu', wisard: 'memory' } as const
  const blockPaths = {} as Record<'radio' | 'cpu' | 'memory', string>
  for (const b of fp.blocks) {
    const k = keys[b.section as keyof typeof keys]
    const st = still(du(b.x - 2, b.y - 2, b.x + b.w + 2, b.y + b.h + 2), 1200)
    const { buf, quality } = await avif(st.rgb, st.v.W, st.v.H, 40_000)
    put(`block-${k}.avif`, buf)
    blockPaths[k] = `bake/block-${k}.avif`
    log(`block-${k}: ${buf.length} B (q${quality})`)
  }

  // S6 (R-P2-11): the SE reef crop around the UART pad, where CyBot's UART line leaves the die.
  // It sits at the S6 stage's left edge, so it fades into --floor-deep to the right, top and
  // bottom with no hard edge; ~70% of the frame stays unlit.
  const uart = fp.uartPad
  const s6Box = du(78, uart.y - 30, 108, uart.y + 30)
  const fade = (x: number, y: number) => {
    const fx = (x - s6Box.x0) / (s6Box.x1 - s6Box.x0)
    const fy = (y - s6Box.y0) / (s6Box.y1 - s6Box.y0)
    const right = smoothstep(0.62, 1, fx)
    const edge = Math.max(smoothstep(0.7, 1, fy), smoothstep(0.3, 0, fy))
    return Math.min(1, right + edge - right * edge)
  }
  const s6 = still(s6Box, 480, FOCUSED, fade)
  const s6Set: [number, string][] = []
  for (const w of [240, 480]) {
    const { buf, quality } = await avif(s6.rgb, s6.v.W, s6.v.H, 25_000, w)
    put(`s6-${w}.avif`, buf)
    s6Set.push([w, `bake/s6-${w}.avif`])
    log(`s6-${w}: ${buf.length} B (q${quality})`)
  }

  // --- meta ------------------------------------------------------------------------------------
  const sha = (b: Uint8Array) => createHash('sha256').update(b).digest('hex')
  const meta: BakeMeta = {
    version: 1,
    sha256: { slope1024: sha(slope1024), slope512: sha(slope512), slope256: sha(slope256), traces: sha(traces) },
    fields: { 1024: 'bake/slope-1024.f16', 512: 'bake/slope-512.f16', 256: 'bake/slope-256.f16' },
    optics: { depth: DEPTH, eta: ETA },
    tile: { N, world: [-1, 1], texel: 2 / N, rtExt: RT_EXT },
    lagoon: { slopeZeroOutside: 1, seamAt: 3 },
    die: { toWorld: { s: +s.toFixed(9), o: +o.toFixed(9) }, box: r4(du(0, 0, 100, 100)) },
    seal: {
      outer: r4(du(fp.seal.outer, fp.seal.outer, 100 - fp.seal.outer, 100 - fp.seal.outer)),
      inner: r4(du(fp.seal.inner, fp.seal.inner, 100 - fp.seal.inner, 100 - fp.seal.inner)),
    },
    core: r4(du(fp.core.x, fp.core.y, fp.core.x + fp.core.w, fp.core.y + fp.core.h)),
    letters: { box: r4({ x0: tex(t.bbox.x0), x1: tex(t.bbox.x1), y0: -tex(t.bbox.y1), y1: -tex(t.bbox.y0) }), texelsPerTrack: TEXELS_PER_TRACK },
    blocks,
    pads: fp.pads.map((p) => ({ side: p.side, i: p.i, x: +(o + p.x * s).toFixed(6), y: +-(o + p.y * s).toFixed(6), size: +(fp.PAD_SIZE * s).toFixed(6), contact: p.contact, uart: p.uart })),
    lum: { ...LUM },
    acceptance: {
      LF: +con.LF.toFixed(2),
      LC: +con.LC.toFixed(1),
      f16rms: +pre.rms.toFixed(4),
      f16PxOff10: +pre.pxOff10.toFixed(4),
      cropRms: +sm.cropRms.toFixed(4),
      edgeDispTexels: +field.edgeNormalTexels.toFixed(3),
      edgeTangentialTexels: +field.edgeTangentialTexels.toFixed(1),
      bandI: +sm.bandI.toFixed(4),
      bandMaxDev: +sm.bandMaxDev.toFixed(4),
      last3TexelsMaxDev: +sm.last3TexelsMaxDev.toFixed(4),
      outsideMaxDev: +sm.outsideMaxDev.toFixed(4),
      s1Display: s1Contrast,
      stillsFrom: sha(slope1024),
      field1024: { LF: +c2.LF.toFixed(2), LC: +c2.LC.toFixed(1) },
      solve: {
        method: 'neumann-mirror-2048, shipped 512²/256² = 2×2/4×4 box of the 1024² solve',
        bandOfDieMean: BAND_OF_DIE_MEAN,
        schedule: FIELD_SCHEDULE.map((r) => [...r]),
        errFirst: field.errs[0],
        errLast: field.errs[field.errs.length - 1],
      },
    },
    stills: {
      s1: { src: 'bake/s1-1024.avif', srcset: s1Set, w: s1.v.W, h: s1.v.H },
      poster: 'bake/poster.avif',
      blocks: blockPaths,
      s6: 'bake/s6-480.avif',
      s6Srcset: s6Set,
      s6Size: { w: s6.v.W, h: s6.v.H },
      s6Pad: { x: +((o + uart.x * s - s6Box.x0) / (s6Box.x1 - s6Box.x0)).toFixed(5), y: +((s6Box.y1 + (o + uart.y * s)) / (s6Box.y1 - s6Box.y0)).toFixed(5) },
      bytes: sizes,
    },
  }
  out.set('src/bake/bake.json', new TextEncoder().encode(JSON.stringify(meta, null, 2) + '\n'))
  // The DOM's slice (S1, S6), so the entry bundle doesn't carry the whole meta (pads, blocks…).
  const { s1: s1m, s6: s6m, s6Srcset, s6Size, s6Pad } = meta.stills
  const dom = { s1: s1m, s6: { src: s6m, srcset: s6Srcset, ...s6Size, pad: s6Pad } }
  out.set('src/bake/stills.json', new TextEncoder().encode(JSON.stringify(dom, null, 2) + '\n'))
  const manifest = [...out].filter(([k]) => k.startsWith('public/')).map(([k, v]) => `${sha(v)}  ${k.slice('public/bake/'.length)}`)
  out.set('public/bake/manifest.sha256', new TextEncoder().encode(manifest.join('\n') + '\n'))
  return out
}

/** webgl's P = 0 camera at the 1440×900 reference (three.js conventions: up (0,0,−1), camera
 *  south of the die looking north, setViewOffset(1440, 900, −306.27, −28, 1440, 900)). Maps an
 *  output pixel to the floor point it sees, p = (x, −z); null above the horizon. */
function openingCamera(W: number, H: number) {
  const fullW = 1440
  const fullH = 900
  const offX = -306.27
  const offY = -28
  const pos = [0, 2.6245, 1.3955]
  const tanH = Math.tan(((35 / 2) * Math.PI) / 180)
  const aspect = fullW / fullH
  const norm = (v: number[]) => {
    const l = Math.hypot(v[0], v[1], v[2])
    return v.map((c) => c / l)
  }
  const cross = (a: number[], b: number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
  const z = norm(pos)
  const x = norm(cross([0, 0, -1], z))
  const y = cross(z, x)
  return (u: number, v: number): [number, number] | null => {
    const nx = (((u * fullW) / W + offX) / fullW) * 2 - 1
    const ny = 1 - (((v * fullH) / H + offY) / fullH) * 2
    const dx = nx * tanH * aspect
    const dy = ny * tanH
    const d = [0, 1, 2].map((i) => x[i] * dx + y[i] * dy - z[i])
    if (d[1] >= 0) return null
    const k = -pos[1] / d[1]
    return [pos[0] + d[0] * k, -(pos[2] + d[2] * k)]
  }
}

function smoothstep(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** Contrast on the shaded still itself: mean relative luminance of letters / fill / core pixels. */
function displayContrast(rgb: Uint8Array, v: { x0: number; x1: number; y0: number; y1: number; W: number; H: number }, t: ReturnType<typeof makeTarget>) {
  const lum = (i: number) => {
    const c = (b: number) => {
      const x = b / 255
      return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
    }
    return 0.2126 * c(rgb[i * 3]) + 0.7152 * c(rgb[i * 3 + 1]) + 0.0722 * c(rgb[i * 3 + 2])
  }
  const acc = { letters: [0, 0], fill: [0, 0], core: [0, 0] }
  for (let y = 0; y < v.H; y++)
    for (let x = 0; x < v.W; x++) {
      const px = v.x0 + ((x + 0.5) * (v.x1 - v.x0)) / v.W
      const py = v.y1 - ((y + 0.5) * (v.y1 - v.y0)) / v.H
      const X = Math.floor(((px + 1) / 2) * t.N)
      const Y = Math.floor(((1 - py) / 2) * t.N)
      if (X < 0 || Y < 0 || X >= t.N || Y >= t.N) continue
      const j = Y * t.N + X
      const key = t.letters[j] ? 'letters' : t.fill[j] ? 'fill' : t.core[j] ? 'core' : null
      if (!key) continue
      acc[key][0] += lum(y * v.W + x)
      acc[key][1]++
    }
  const m = (k: keyof typeof acc) => acc[k][0] / acc[k][1]
  return { LF: +(m('letters') / m('fill')).toFixed(2), LC: +(m('letters') / m('core')).toFixed(1) }
}

async function main() {
  const check = process.argv.includes('--check')
  const files = await bake()
  if (check) {
    let bad = 0
    for (const [rel, buf] of files) {
      let disk: Uint8Array | null = null
      try {
        disk = readFileSync(join(ROOT, rel))
      } catch {
        disk = null
      }
      const same = disk !== null && disk.length === buf.length && Buffer.compare(Buffer.from(disk), Buffer.from(buf)) === 0
      if (!same) bad++
      log(`${same ? 'same' : 'DIFF'}  ${rel}`)
    }
    if (bad) {
      log(`--check: ${bad} file(s) differ`)
      process.exit(1)
    }
    log('--check: byte-identical')
    return
  }
  mkdirSync(PUB, { recursive: true })
  for (const [rel, buf] of files) writeFileSync(join(ROOT, rel), buf)
  log(`wrote ${files.size} files (${META.slice(ROOT.length + 1)} + public/bake/)`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main()
