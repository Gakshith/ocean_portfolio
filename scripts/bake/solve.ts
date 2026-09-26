// Engineered-caustic solver, ported line for line from the proof's Worker
// (docs/design/proofs/motion-S1-hero.html, <script id="solver">). After Yue et al. 2014 and
// Ferraro's "Magic Windows".
//
// Forward model: vertical sunlight refracts through surface h by exact Snell and lands on the
// sand at y(x); the caustic I is the splatted density of landing points. Update:
// lap(dh)(x) = step · [log I(y(x)) − log T(y(x))], solved by periodic FFT, coarse to fine over a
// blurred target (sigma 8 → 1.5 texels). a = τ²/(D(1 − 1/η)) makes small-angle displacement in
// texels equal grad h. Float64 throughout, no randomness: the same input gives the same bits.

export interface SolveInput {
  N: number
  target: Float64Array
  D: number
  eta: number
  tau: number
  /** Defaults to the proof's SCHEDULE. */
  schedule?: readonly (readonly [number, number, number])[]
  onProgress?: (done: number, total: number, err: number) => void
}
export interface SolveResult {
  h: Float64Array
  a: number
  errs: number[]
}

/** The proof's schedule: [blur sigma (texels), iterations, step]. */
export const SCHEDULE: readonly (readonly [number, number, number])[] = [
  [8, 3, 0.6],
  [4, 3, 0.6],
  [2, 5, 0.6],
  [1.5, 8, 0.5],
]

function fft1(re: Float64Array, im: Float64Array, off: number, stride: number, n: number, inv: boolean) {
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      const a = off + i * stride
      const b = off + j * stride
      let t = re[a]
      re[a] = re[b]
      re[b] = t
      t = im[a]
      im[a] = im[b]
      im[b] = t
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = ((inv ? 2 : -2) * Math.PI) / len
    const wr = Math.cos(ang)
    const wi = Math.sin(ang)
    for (let i = 0; i < n; i += len) {
      let cr = 1
      let ci = 0
      for (let k = 0; k < len / 2; k++) {
        const a = off + (i + k) * stride
        const b = off + (i + k + len / 2) * stride
        const xr = re[b] * cr - im[b] * ci
        const xi = re[b] * ci + im[b] * cr
        re[b] = re[a] - xr
        im[b] = im[a] - xi
        re[a] += xr
        im[a] += xi
        const t = cr * wr - ci * wi
        ci = cr * wi + ci * wr
        cr = t
      }
    }
  }
}

export function solve({ N, target, D, eta, tau, schedule = SCHEDULE, onProgress }: SolveInput): SolveResult {
  const NN = N * N
  const fft2 = (re: Float64Array, im: Float64Array, inv: boolean) => {
    for (let y = 0; y < N; y++) fft1(re, im, y * N, 1, N, inv)
    for (let x = 0; x < N; x++) fft1(re, im, x, N, N, inv)
  }
  const blur3 = (a: Float64Array) => {
    const t = new Float64Array(NN)
    const o = new Float64Array(NN)
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const r = y * N
        t[r + x] = (a[r + ((x + N - 1) % N)] + 2 * a[r + x] + a[r + ((x + 1) % N)]) / 4
      }
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) o[y * N + x] = (t[((y + N - 1) % N) * N + x] + 2 * t[y * N + x] + t[((y + 1) % N) * N + x]) / 4
    return o
  }
  const gblur = (src: Float64Array, s: number) => {
    if (s <= 0) return Float64Array.from(src)
    const re = Float64Array.from(src)
    const im = new Float64Array(NN)
    fft2(re, im, false)
    for (let ky = 0; ky < N; ky++)
      for (let kx = 0; kx < N; kx++) {
        const fx = (kx <= N / 2 ? kx : kx - N) / N
        const fy = (ky <= N / 2 ? ky : ky - N) / N
        const g = Math.exp(-2 * Math.PI * Math.PI * s * s * (fx * fx + fy * fy))
        re[ky * N + kx] *= g
        im[ky * N + kx] *= g
      }
    fft2(re, im, true)
    for (let i = 0; i < NN; i++) re[i] /= NN
    return re
  }
  const bil = (A: Float64Array, px: number, py: number) => {
    const x0 = Math.floor(px)
    const y0 = Math.floor(py)
    const fx = px - x0
    const fy = py - y0
    const X0 = ((x0 % N) + N) % N
    const Y0 = ((y0 % N) + N) % N
    const X1 = (X0 + 1) % N
    const Y1 = (Y0 + 1) % N
    return A[Y0 * N + X0] * (1 - fx) * (1 - fy) + A[Y0 * N + X1] * fx * (1 - fy) + A[Y1 * N + X0] * (1 - fx) * fy + A[Y1 * N + X1] * fx * fy
  }

  let m = 0
  for (let i = 0; i < NN; i++) m += target[i]
  m /= NN
  const Tn = new Float64Array(NN)
  for (let i = 0; i < NN; i++) Tn[i] = target[i] / m
  const h = new Float64Array(NN)
  const re = new Float64Array(NN)
  const im = new Float64Array(NN)
  const PX = new Float64Array(NN)
  const PY = new Float64Array(NN)
  const cosT = new Float64Array(N)
  for (let k = 0; k < N; k++) cosT[k] = 2 * Math.cos((2 * Math.PI * k) / N)
  const a = (tau * tau) / (D * (1 - 1 / eta))
  const r = 1 / eta
  const errs: number[] = []
  let I = new Float64Array(NN)

  const forward = () => {
    I = new Float64Array(NN)
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const i = y * N + x
        const gx = (h[y * N + ((x + 1) % N)] - h[y * N + ((x + N - 1) % N)]) * 0.5
        const gy = (h[((y + 1) % N) * N + x] - h[((y + N - 1) % N) * N + x]) * 0.5
        const sx = (a * gx) / tau
        const sy = (a * gy) / tau
        const nl = Math.hypot(sx, sy, 1)
        const nx = -sx / nl
        const ny = -sy / nl
        const nz = 1 / nl
        const k = 1 - r * r * (1 - nz * nz)
        const ct = Math.sqrt(Math.max(k, 0))
        const f = r * nz - ct
        const tx = f * nx
        const ty = f * ny
        const tz = -r + f * nz
        const px = x + (tx * (D / -tz)) / tau
        const py = y + (ty * (D / -tz)) / tau
        PX[i] = px
        PY[i] = py
        const x0 = Math.floor(px)
        const y0 = Math.floor(py)
        const fx = px - x0
        const fy = py - y0
        const X0 = ((x0 % N) + N) % N
        const Y0 = ((y0 % N) + N) % N
        const X1 = (X0 + 1) % N
        const Y1 = (Y0 + 1) % N
        I[Y0 * N + X0] += (1 - fx) * (1 - fy)
        I[Y0 * N + X1] += fx * (1 - fy)
        I[Y1 * N + X0] += (1 - fx) * fy
        I[Y1 * N + X1] += fx * fy
      }
    I = blur3(I)
  }
  const err = () => {
    let e = 0
    for (let i = 0; i < NN; i++) e += Math.abs(Tn[i] - I[i])
    return +(e / NN).toFixed(3)
  }

  const total = schedule.reduce((s, v) => s + v[1], 0)
  let done = 0
  for (const [sig, its, step] of schedule) {
    const T = blur3(gblur(Tn, sig))
    for (let it = 0; it < its; it++) {
      forward()
      errs.push(err())
      for (let i = 0; i < NN; i++) {
        const res = Math.log(bil(I, PX[i], PY[i]) + 0.1) - Math.log(bil(T, PX[i], PY[i]) + 0.1)
        re[i] = Math.max(-2, Math.min(2, res)) * step
        im[i] = 0
      }
      fft2(re, im, false)
      for (let ky = 0; ky < N; ky++)
        for (let kx = 0; kx < N; kx++) {
          const i = ky * N + kx
          const l = cosT[kx] + cosT[ky] - 4
          if (l === 0) re[i] = im[i] = 0
          else {
            re[i] /= l
            im[i] /= l
          }
        }
      fft2(re, im, true)
      for (let i = 0; i < NN; i++) h[i] += re[i] / NN
      done++
      onProgress?.(done, total, errs[errs.length - 1])
    }
  }
  forward()
  errs.push(err())
  return { h, a, errs }
}
