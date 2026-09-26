// CPU twin of the proof's caustic pass (and so of webgl's): a grid mesh refracts vertical light
// through the surface by exact Snell (GLSL refract), and each triangle's intensity is its area
// ratio I = a0 / (max(a1, a0·0.015) + 1e-8), rasterised additively at pixel centres (no MSAA),
// exactly like the RT pass. Slope is sampled nearest from the tile, and is 0 outside [-1, 1]
// (the contract). Coordinates: world p-space, y north-up; outputs are canvas order (row 0 = north).
import { DEPTH, ETA } from './field.ts'

export interface Slope {
  N: number
  gx: Float64Array
  gy: Float64Array
}
export interface View {
  x0: number
  x1: number
  y0: number
  y1: number
  W: number
  H: number
}

/** Extra slope (e.g. the swell) added at a vertex, world units. */
export type SlopeFn = (x: number, y: number) => [number, number]

export interface CausticOpts {
  slope: Slope | null
  /** Engineered-slope weight (the focus f). */
  f?: number
  /** Mesh half-extent in world units and vertex spacing (world). */
  meshHalf: number
  meshStep: number
  extra?: SlopeFn
}

const r = 1 / ETA

export function renderCaustic(view: View, o: CausticOpts): Float64Array {
  const { W, H, x0, x1, y0, y1 } = view
  const out = new Float64Array(W * H)
  const sx = W / (x1 - x0)
  const sy = H / (y1 - y0)
  const f = o.f ?? 1
  const n = Math.round((2 * o.meshHalf) / o.meshStep)
  const M = n + 1
  const hx = new Float64Array(M * M)
  const hy = new Float64Array(M * M)
  const S = o.slope
  for (let j = 0; j < M; j++)
    for (let i = 0; i < M; i++) {
      const px = -o.meshHalf + i * o.meshStep
      const py = -o.meshHalf + j * o.meshStep
      let gx = 0
      let gy = 0
      if (S && f !== 0) {
        if (Math.abs(px) <= 1 + 1e-9 && Math.abs(py) <= 1 + 1e-9) {
          const col = Math.min(S.N - 1, Math.floor(((px + 1) / 2) * S.N))
          const row = S.N - 1 - Math.min(S.N - 1, Math.floor(((py + 1) / 2) * S.N))
          gx = S.gx[row * S.N + col] * f
          gy = S.gy[row * S.N + col] * f
        }
      }
      if (o.extra) {
        const [ex, ey] = o.extra(px, py)
        gx += ex
        gy += ey
      }
      // n = normalize(-g, 1); t = refract((0,0,-1), n, 1/eta)
      const nl = Math.hypot(gx, gy, 1)
      const nx = -gx / nl
      const ny = -gy / nl
      const nz = 1 / nl
      const d = -nz
      const k = 1 - r * r * (1 - d * d)
      const c = r * d + Math.sqrt(Math.max(k, 0))
      const tx = -c * nx
      const ty = -c * ny
      const tz = -r - c * nz
      hx[j * M + i] = px + tx * (DEPTH / -tz)
      hy[j * M + i] = py + ty * (DEPTH / -tz)
    }
  const a0 = (o.meshStep * o.meshStep) / 2
  const tri = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) => {
    // to pixel space (x right, y down)
    const X0 = (ax - x0) * sx
    const Y0 = (y1 - ay) * sy
    const X1 = (bx - x0) * sx
    const Y1 = (y1 - by) * sy
    const X2 = (cx - x0) * sx
    const Y2 = (y1 - cy) * sy
    const area2 = (X1 - X0) * (Y2 - Y0) - (X2 - X0) * (Y1 - Y0)
    if (area2 === 0) return
    const a1 = Math.abs(area2) / 2 / (sx * sy)
    const I = a0 / (Math.max(a1, a0 * 0.015) + 1e-8)
    const minX = Math.max(0, Math.floor(Math.min(X0, X1, X2)))
    const maxX = Math.min(W - 1, Math.ceil(Math.max(X0, X1, X2)))
    const minY = Math.max(0, Math.floor(Math.min(Y0, Y1, Y2)))
    const maxY = Math.min(H - 1, Math.ceil(Math.max(Y0, Y1, Y2)))
    if (minX > maxX || minY > maxY) return
    const s = area2 > 0 ? 1 : -1
    // Sample points sit a hair off the pixel centre, so a centre never lands exactly on a
    // shared mesh edge (flat regions align the mesh with the pixel grid) and counts twice.
    for (let py = minY; py <= maxY; py++) {
      const cyp = py + 0.5 + 3.1e-7
      for (let px = minX; px <= maxX; px++) {
        const cxp = px + 0.5 + 1.7e-7
        const w0 = ((X1 - cxp) * (Y2 - cyp) - (X2 - cxp) * (Y1 - cyp)) * s
        const w1 = ((X2 - cxp) * (Y0 - cyp) - (X0 - cxp) * (Y2 - cyp)) * s
        const w2 = ((X0 - cxp) * (Y1 - cyp) - (X1 - cxp) * (Y0 - cyp)) * s
        if (w0 >= 0 && w1 >= 0 && w2 >= 0) out[py * W + px] += I
      }
    }
  }
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const a = j * M + i
      const b = a + 1
      const c = a + M
      const d = c + 1
      tri(hx[a], hy[a], hx[b], hy[b], hx[c], hy[c])
      tri(hx[b], hy[b], hx[d], hy[d], hx[c], hy[c])
    }
  return out
}
