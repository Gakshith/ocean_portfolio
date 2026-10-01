// The caustic target: AKASH / GOJURU as top-metal lettering on the die, with the seal ring,
// the 60-pad reef, straps and density fill, at the plan's target luminances (C-03, C-04).
// Pure TS with no Node or DOM APIs and no randomness. The bake CLI (scripts/bake) and
// webgl's test-only contrast check build the same masks from it.
//
// Canvas order: row 0 = north, y down, one N×N tile = world p ∈ [-1, 1]². The die sits 5% in
// from the tile edge (the proof's layout); die units (floorplan.ts, 0–100) map linearly onto it.
// Every texel constant below is the proof's value at N = 512, scaled by N / 512.

export interface GlyphSet {
  grid: number[]
  via: number
  letterGap: number
  lineGap: number
  lines: string[]
  glyphs: Record<string, { r: number[][]; v: number[][] }>
}

export interface FloorplanInput {
  seal: { outer: number; inner: number }
  pads: readonly { side: 'n' | 'e' | 's' | 'w'; i: number; x: number; y: number }[]
  PAD_SIZE: number
}

/** Target luminance (C-03). */
export const LUM = { trace: 1.0, pad: 0.35, seal: 0.3, strap: 0.2, fill: 0.2, core: 0.02 } as const
/** Proof-measured sharpness: texels per glyph track at N = 512 (R-09). */
export const TEXELS_PER_TRACK = 6.5
/** The band between the die edge and the tile edge, as a fraction of the die's mean. The die
 *  can't fully darken its core and exports the excess into the band; 0.81 is calibrated so the
 *  solved band lands at I = 1.00, the open sea's level, for the 1024² Neumann solve
 *  (scripts/bake/field.ts; 0.80 → 0.992, 0.82 → 1.012). The proof's torus solve used 0.85. */
export const BAND_OF_DIE_MEAN = 0.81

export interface Target {
  N: number
  /** Target luminance, N², canvas order. */
  T: Float64Array
  letters: Uint8Array
  straps: Uint8Array
  fill: Uint8Array
  pads: Uint8Array
  seal: Uint8Array
  /** Inner core at least 4 texels (×N/512) clear of every feature: the contrast test's "core". */
  core: Uint8Array
  /** Letter bbox, texels (canvas order). */
  bbox: { x0: number; y0: number; x1: number; y1: number }
  /** Die edges in texels: die unit u sits at d0 + u·s. */
  die: { d0: number; d1: number; s: number }
  /** Mean of T over the die and over the whole tile. */
  dieMean: number
  tileMean: number
}

/** Die geometry in texels for an N² tile. */
export function dieTexels(N: number) {
  const d0 = Math.round(N * 0.05)
  const d1 = N - d0
  return { d0, d1, s: (d1 - d0) / 100 }
}

export function makeTarget(G: GlyphSet, fp: FloorplanInput, N = 512): Target {
  const k = N / 512
  const NN = N * N
  const { d0, d1, s } = dieTexels(N)
  const letters = new Uint8Array(NN)
  const straps = new Uint8Array(NN)
  const fill = new Uint8Array(NN)
  const pads = new Uint8Array(NN)
  const seal = new Uint8Array(NN)

  const rect = (arr: Uint8Array, x0: number, y0: number, x1: number, y1: number) => {
    const X0 = Math.max(0, Math.round(x0))
    const Y0 = Math.max(0, Math.round(y0))
    const X1 = Math.min(N, Math.round(x1))
    const Y1 = Math.min(N, Math.round(y1))
    for (let y = Y0; y < Y1; y++) for (let x = X0; x < X1; x++) arr[y * N + x] = 1
  }
  const du = (u: number) => d0 + u * s

  // Letters: the canonical glyphs at 6.5 texels per track, both lines centred on the tile.
  const tk = TEXELS_PER_TRACK * k
  const [GW, GH] = G.grid
  const lw = (w: string) => (w.length * GW + (w.length - 1) * G.letterGap) * tk
  const blockH = (G.lines.length * GH + (G.lines.length - 1) * G.lineGap) * tk
  const ly0 = (N - blockH) / 2
  const bbox = { x0: Infinity, y0: ly0, x1: -Infinity, y1: ly0 + blockH }
  G.lines.forEach((w, li) => {
    const x0 = (N - lw(w)) / 2
    const yy = ly0 + li * (GH + G.lineGap) * tk
    ;[...w].forEach((ch, i) => {
      const gx = x0 + i * (GW + G.letterGap) * tk
      const g = G.glyphs[ch]
      for (const [x, y, ww, hh] of g.r) rect(letters, gx + x * tk, yy + y * tk, gx + (x + ww) * tk, yy + (y + hh) * tk)
      // Vias: via×via squares centred on the listed points, clamped inside the glyph box.
      const hv = G.via / 2
      for (const [cx, cy] of g.v) {
        const vx = Math.min(Math.max(cx, hv), GW - hv)
        const vy = Math.min(Math.max(cy, hv), GH - hv)
        rect(letters, gx + (vx - hv) * tk, yy + (vy - hv) * tk, gx + (vx + hv) * tk, yy + (vy + hv) * tk)
      }
    })
    bbox.x0 = Math.min(bbox.x0, x0)
    bbox.x1 = Math.max(bbox.x1, x0 + lw(w))
  })

  // Seal ring: the floorplan's two rings (centrelines in die units), 3 and 2 texels wide.
  const ring = (c: number, wTex: number) => {
    const a = du(c) - wTex / 2
    const b = du(100 - c) + wTex / 2
    const w = wTex
    rect(seal, a, a, b, a + w)
    rect(seal, a, b - w, b, b)
    rect(seal, a, a, a + w, b)
    rect(seal, b - w, a, b, b)
  }
  ring(fp.seal.outer, 3 * k)
  ring(fp.seal.inner, 2 * k)

  // The reef: all 60 floorplan pads.
  const ps = (fp.PAD_SIZE * s) / 2
  for (const p of fp.pads) rect(pads, du(p.x) - ps, du(p.y) - ps, du(p.x) + ps, du(p.y) + ps)

  // Straps: Manhattan top-metal routes, one track wide, from the lettering out to five reef pads
  // (the proof's N2, N12, S7, E10, W4), ending on each pad's inner edge.
  const padIn = (side: 'n' | 'e' | 's' | 'w', i: number): [number, number] => {
    const p = fp.pads.find((q) => q.side === side && q.i === i)!
    const x = du(p.x)
    const y = du(p.y)
    return side === 'n' ? [x, y + ps] : side === 's' ? [x, y - ps] : side === 'w' ? [x + ps, y] : [x - ps, y]
  }
  const sw = tk
  const strap = (pts: [number, number][]) => {
    for (let j = 1; j < pts.length; j++) {
      const [ax, ay] = pts[j - 1]
      const [bx, by] = pts[j]
      rect(straps, Math.min(ax, bx) - sw / 2, Math.min(ay, by) - sw / 2, Math.max(ax, bx) + sw / 2, Math.max(ay, by) + sw / 2)
    }
  }
  const n2 = padIn('n', 2)
  const n12 = padIn('n', 12)
  const s7 = padIn('s', 7)
  const e10 = padIn('e', 10)
  const w4 = padIn('w', 4)
  const mx = (bbox.x0 + bbox.x1) / 2 + 3 * tk
  strap([[bbox.x0, bbox.y0 + 6 * tk], [n2[0], bbox.y0 + 6 * tk], n2])
  strap([[bbox.x1, bbox.y0 + 5.5 * tk], [n12[0], bbox.y0 + 5.5 * tk], n12])
  strap([[mx, bbox.y1], [mx, s7[1] - sw], [s7[0], s7[1] - sw], s7])
  strap([[bbox.x1, bbox.y1 - 5.5 * tk], [e10[0], bbox.y1 - 5.5 * tk], e10])
  strap([[bbox.x0, bbox.y1 - 6 * tk], [w4[0], bbox.y1 - 6 * tk], w4])

  // Dummy fill: 7-texel squares on a 24-texel pitch, 20 texels of keep-out from letters and
  // straps ("fill is where the light goes").
  const near = dilate(or(letters, straps), N, Math.round(20 * k))
  const pitch = 24 * k
  const cell = 7 * k
  for (let y = d0 + 36 * k; y < d1 - 40 * k; y += pitch)
    for (let x = d0 + 36 * k; x < d1 - 40 * k; x += pitch) {
      const cx = Math.round(x + cell / 2)
      const cy = Math.round(y + cell / 2)
      if (!near[cy * N + cx]) rect(fill, x, y, x + cell, y + cell)
    }

  // Compose. The die interior is core plus features; the band outside the die is a calibrated
  // fraction of the die's own mean, so it lands at I = 1 and meets the open sea without a step.
  const T = new Float64Array(NN)
  let sum = 0
  let n = 0
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const i = y * N + x
      if (x < d0 || x >= d1 || y < d0 || y >= d1) {
        T[i] = -1
        continue
      }
      let v: number = LUM.core
      if (fill[i]) v = LUM.fill
      if (straps[i]) v = Math.max(v, LUM.strap)
      if (seal[i]) v = Math.max(v, LUM.seal)
      if (pads[i]) v = Math.max(v, LUM.pad)
      if (letters[i]) v = LUM.trace
      T[i] = v
      sum += v
      n++
    }
  const dieMean = sum / n
  let tileSum = 0
  for (let i = 0; i < NN; i++) {
    if (T[i] < 0) T[i] = dieMean * BAND_OF_DIE_MEAN
    tileSum += T[i]
  }

  // Core mask for the acceptance test: the inner core, clear of every feature.
  const feat = dilate(or(or(or(letters, straps), or(fill, pads)), seal), N, Math.round(4 * k))
  const core = new Uint8Array(NN)
  for (let y = d0 + 40 * k; y < d1 - 40 * k; y++)
    for (let x = d0 + 40 * k; x < d1 - 40 * k; x++) if (!feat[y * N + x]) core[y * N + x] = 1

  return { N, T, letters, straps, fill, pads, seal, core, bbox, die: { d0, d1, s }, dieMean, tileMean: tileSum / NN }
}

function or(a: Uint8Array, b: Uint8Array) {
  const o = new Uint8Array(a.length)
  for (let i = 0; i < a.length; i++) o[i] = a[i] | b[i]
  return o
}

/** Square (Chebyshev) dilation by r texels, separable. */
function dilate(m: Uint8Array, N: number, r: number) {
  const t = new Uint8Array(m.length)
  const o = new Uint8Array(m.length)
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      let v = 0
      for (let d = Math.max(0, x - r); d <= Math.min(N - 1, x + r) && !v; d++) v = m[y * N + d]
      t[y * N + x] = v
    }
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      let v = 0
      for (let d = Math.max(0, y - r); d <= Math.min(N - 1, y + r) && !v; d++) v = t[d * N + x]
      o[y * N + x] = v
    }
  return o
}

/** The residual-calm mask: a (2r+1)² box blur of letters ∪ straps, edges clamped (proof, r = 7). */
export function tracesMask(t: Target, r = 7): Float64Array {
  const { N } = t
  const src = new Float64Array(N * N)
  for (let i = 0; i < N * N; i++) src[i] = t.letters[i] || t.straps[i] ? 1 : 0
  const tmp = new Float64Array(N * N)
  const out = new Float64Array(N * N)
  const cl = (v: number) => Math.min(N - 1, Math.max(0, v))
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      let a = 0
      for (let d = -r; d <= r; d++) a += src[y * N + cl(x + d)]
      tmp[y * N + x] = a / (2 * r + 1)
    }
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      let a = 0
      for (let d = -r; d <= r; d++) a += tmp[cl(y + d) * N + x]
      out[y * N + x] = a / (2 * r + 1)
    }
  return out
}
