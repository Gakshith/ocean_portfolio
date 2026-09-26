// Acceptance measurements on the CPU twin of the caustic pass (evidence, not the verdict: the
// reviewer's live-render screenshots are the final gate on the seam).
//   contrast  : C-03, mean I on letters vs fill vs core (bar: ≥ 3× and ≥ 8×)
//   precision : C-09, the proof's precisionTest (RG16F vs f32, rms at display scale, bar ≤ 1%)
//   seam      : R-P2-05 amended, the tile edge against the open sea with slope 0 outside
import { renderCaustic, type Slope, type SlopeFn } from './render.ts'
import type { Target } from '../../src/bake/target.ts'

const MESH = (N: number) => ({ meshHalf: 1.25, meshStep: 2 / N })

/** The focused caustic sampled on the tile's own N² texels (a 2×2 supersample per texel). */
export function tileIntensity(slope: Slope): Float64Array {
  const N = slope.N
  const R = 2 * N
  const I = renderCaustic({ x0: -1, x1: 1, y0: -1, y1: 1, W: R, H: R }, { slope, ...MESH(N) })
  const o = new Float64Array(N * N)
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++)
      o[y * N + x] = (I[2 * y * R + 2 * x] + I[2 * y * R + 2 * x + 1] + I[(2 * y + 1) * R + 2 * x] + I[(2 * y + 1) * R + 2 * x + 1]) / 4
  return o
}

export function contrast(t: Target, I: Float64Array) {
  const mean = (m: Uint8Array) => {
    let s = 0
    let n = 0
    for (let i = 0; i < m.length; i++)
      if (m[i]) {
        s += I[i]
        n++
      }
    return s / n
  }
  const L = mean(t.letters)
  const F = mean(t.fill)
  const C = mean(t.core)
  return { I_letters: L, I_fill: F, I_core: C, LF: L / F, LC: L / C, pass: L / F >= 3 && L / C >= 8 }
}

/** Proof: compare at display scale (4×4 box, a screen pixel covers ~4 solve texels at the hold). */
export function precision(ref: Float64Array, test: Float64Array, N: number) {
  const down = (A: Float64Array) => {
    const M = N / 4
    const o = new Float64Array(M * M)
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) o[(y >> 2) * M + (x >> 2)] += A[y * N + x] / 16
    return o
  }
  let m = 0
  for (const v of ref) m += v
  m /= ref.length
  const rd = down(ref)
  const td = down(test)
  let s = 0
  let bad = 0
  for (let i = 0; i < rd.length; i++) {
    const d = td[i] - rd[i]
    s += d * d
    if (Math.abs(d) > 0.1 * Math.max(rd[i], m * 0.25)) bad++
  }
  return { rms: Math.sqrt(s / rd.length) / m, pxOff10: bad / rd.length }
}

/** The edge of the tile against the open sea (I = 1), rendered over [-1.25, 1.25] at 1280². */
export function seam(slope: Slope, full: SlopeFn) {
  const W = 1280
  const view = { x0: -1.25, x1: 1.25, y0: -1.25, y1: 1.25, W, H: W }
  const crop = renderCaustic(view, { slope, ...MESH(slope.N) })
  const ref = renderCaustic(view, { slope: null, extra: full, ...MESH(slope.N) })
  const px = W / 2.5 / (slope.N / 2) // RT pixels per tile texel (2)
  const e0 = Math.round(0.25 * (W / 2.5)) // pixel column of p = -1
  const e1 = W - e0
  // Row-mean I across each edge, over the middle 60% of that edge (clear of the corners).
  const profile = (k: number) => {
    let s = 0
    let n = 0
    const a = Math.round(W * 0.3)
    const b = Math.round(W * 0.7)
    for (let q = a; q < b; q++)
      for (const [x, y] of [
        [e1 - 1 - k, q],
        [e0 + k, q],
        [q, e0 + k],
        [q, e1 - 1 - k],
      ]) {
        s += crop[y * W + x]
        n++
      }
    return s / n
  }
  let band = 0
  let bandN = 0
  let bandDev = 0
  for (let k = 3 * px; k < 20 * px; k++) {
    const v = profile(k)
    band += v
    bandN++
    bandDev = Math.max(bandDev, Math.abs(v - 1))
  }
  let lastDev = 0
  for (let k = 0; k < 3 * px; k++) lastDev = Math.max(lastDev, Math.abs(profile(k) - 1))
  let outDev = 0
  for (let k = 1; k <= 20 * px; k++) {
    let s = 0
    let n = 0
    for (let q = Math.round(W * 0.3); q < Math.round(W * 0.7); q++) {
      s += crop[q * W + e1 + k - 1] + crop[q * W + e0 - k]
      n += 2
    }
    outDev = Math.max(outDev, Math.abs(s / n - 1))
  }
  // Crop vs the mirror-continued full render over the tile [-1, 1] (outside it the full render
  // shows the mirrored die, so there the bar is I = 1 instead: outsideMaxDev), at display scale
  // (4×4), relative to the mean.
  const M = W / 4
  const down = (A: Float64Array) => {
    const o = new Float64Array(M * M)
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) o[(y >> 2) * M + (x >> 2)] += A[y * W + x] / 16
    return o
  }
  const cd = down(crop)
  const rd = down(ref)
  let m = 0
  let s2 = 0
  let n = 0
  for (let y = e0 / 4; y < e1 / 4; y++)
    for (let x = e0 / 4; x < e1 / 4; x++) {
      const i = y * M + x
      m += rd[i]
      s2 += (cd[i] - rd[i]) ** 2
      n++
    }
  m /= n
  return {
    bandI: band / bandN,
    bandMaxDev: bandDev,
    last3TexelsMaxDev: lastDev,
    outsideMaxDev: outDev,
    cropRms: Math.sqrt(s2 / n) / m,
  }
}
