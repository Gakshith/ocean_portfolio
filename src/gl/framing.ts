// The camera is one function: fit a world box into a screen rect (C-02). The distance is found
// by binary search so the projected box plus a margin sits inside the rect at every listed tilt,
// and a lens shift (setViewOffset) puts the look target at the rect's centre, so a rise between
// two distances is a pure vertical move. Every camera stop (S1 letters, S1 die, S2 die, S7 south
// half, and the step-9 blocks) is "this world box in that DOM rect".
import { PerspectiveCamera, Vector3 } from 'three/webgpu'
import { FAR, FOV_DEG, NEAR, UP } from './pose'

/** Screen px, y down. */
export interface Rect {
  x0: number
  y0: number
  x1: number
  y1: number
}
/** World p-space, y north-up (three z = -y). */
export interface WBox {
  x0: number
  y0: number
  x1: number
  y1: number
}
export interface Pose {
  /** Look target, world p-space. */
  tx: number
  ty: number
  /** Distance from the target along the view axis. */
  dist: number
  /** Pitch away from straight down, radians (the camera sits south of the target). */
  tilt: number
  /** Screen px where the target lands (lens shift). */
  cx: number
  cy: number
}

export function makeCamera() {
  const cam = new PerspectiveCamera(FOV_DEG, 1, NEAR, FAR)
  cam.up.set(UP[0], UP[1], UP[2])
  return cam
}

export function applyPose(cam: PerspectiveCamera, p: Pose, vw: number, vh: number) {
  cam.aspect = vw / vh
  cam.position.set(p.tx, p.dist * Math.cos(p.tilt), -p.ty + p.dist * Math.sin(p.tilt))
  cam.lookAt(p.tx, 0, -p.ty)
  cam.setViewOffset(vw, vh, -(p.cx - vw / 2), -(p.cy - vh / 2), vw, vh)
  cam.updateMatrixWorld()
  cam.updateProjectionMatrix()
}

const v3 = new Vector3()
export function project(cam: PerspectiveCamera, b: WBox, vw: number, vh: number): Rect {
  const r = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity }
  for (const [x, y] of [
    [b.x0, b.y0],
    [b.x1, b.y0],
    [b.x0, b.y1],
    [b.x1, b.y1],
  ]) {
    v3.set(x, 0, -y).project(cam)
    const X = ((v3.x + 1) / 2) * vw
    const Y = ((1 - v3.y) / 2) * vh
    r.x0 = Math.min(r.x0, X)
    r.x1 = Math.max(r.x1, X)
    r.y0 = Math.min(r.y0, Y)
    r.y1 = Math.max(r.y1, Y)
  }
  return r
}

export function fits(r: Rect, g: Rect, margin: number) {
  const mx = (g.x1 - g.x0) * margin
  const my = (g.y1 - g.y0) * margin
  return r.x0 >= g.x0 + mx && r.x1 <= g.x1 - mx && r.y0 >= g.y0 + my && r.y1 <= g.y1 - my
}

export const center = (b: WBox) => ({ x: (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2 })

/** Smallest distance at which `ok(dist)` holds (it must stay true further out). */
function searchDist(ok: (dist: number) => boolean) {
  let lo = 0.2
  let hi = 80
  for (let it = 0; it < 40; it++) {
    const mid = (lo + hi) / 2
    if (ok(mid)) hi = mid
    else lo = mid
  }
  return hi
}

/** Smallest distance at which `box` (+margin) fits `g` for every tilt, looking at the box centre,
 *  with the target landing at (cx, cy) (default: the centre of `g`). */
export function fitDist(
  cam: PerspectiveCamera,
  box: WBox,
  g: Rect,
  margin: number,
  tilts: number[],
  vw: number,
  vh: number,
  cx = (g.x0 + g.x1) / 2,
  cy = (g.y0 + g.y1) / 2,
) {
  const c = center(box)
  return searchDist((dist) =>
    tilts.every((tilt) => {
      applyPose(cam, { tx: c.x, ty: c.y, dist, tilt, cx, cy }, vw, vh)
      return fits(project(cam, box, vw, vh), g, margin)
    }),
  )
}

/** Candidate free regions for the S1 framing: the viewport between the bars, minus the plate,
 *  as either the band above the plate or the band right of it (the proof's two candidates).
 *  Regions under 140px on a side are dropped. */
export function freeRegions(vw: number, _vh: number, top: number, bottom: number, plate: Rect | null, pad = 16) {
  const out: (Rect & { name: string })[] = []
  if (!plate) out.push({ name: 'viewport', x0: 0, y0: top, x1: vw, y1: bottom })
  else {
    out.push({ name: 'above plate', x0: 0, y0: top, x1: vw, y1: plate.y0 - pad })
    out.push({ name: 'right of plate', x0: plate.x1 + pad, y0: top, x1: vw, y1: bottom })
  }
  return out.filter((g) => g.x1 - g.x0 > 140 && g.y1 - g.y0 > 140)
}

export interface S1Framing {
  region: Rect & { name: string }
  cx: number
  cy: number
  near: number
  far: number
  target: { x: number; y: number }
}

/** The seal ring must never read as cropped by the plate: at rest it clears the plate edge by
 *  SEAL_CLEAR px, or tucks SEAL_UNDER px under it. */
export const SEAL_CLEAR = 32
export const SEAL_UNDER = 48

/** Signed px from the plate edge to the seal's facing edge: > 0 clear of the plate, < 0 under it. */
export function sealGap(cam: PerspectiveCamera, seal: WBox, region: { name: string }, plate: Rect | null, vw: number, vh: number) {
  if (!plate) return Infinity
  const r = project(cam, seal, vw, vh)
  if (region.name === 'right of plate') return r.x0 - plate.x1
  if (region.name === 'above plate') return plate.y0 - r.y1
  return Infinity
}
export const sealOk = (gap: number) => gap >= SEAL_CLEAR - 0.5 || gap <= -SEAL_UNDER + 0.5

/** The S1 composition: the letters (+6%) fit at tilts 0° and 14° for the near pose; if the seal
 *  ring would sit tangent to the plate, the lens shift tucks it under (or failing that clears it),
 *  re-fitting the letters at the new centre when needed, never giving up their 6%; the die (+4%)
 *  fits for the far pose with the seal clear of the plate. The region that gives the largest die
 *  wins. */
export function fitS1(
  cam: PerspectiveCamera,
  letters: WBox,
  die: WBox,
  regions: (Rect & { name: string })[],
  tilt: number,
  vw: number,
  vh: number,
  seal: WBox | null = null,
  plate: Rect | null = null,
): S1Framing | null {
  let best: S1Framing | null = null
  const t = center(letters)
  const pose = (dist: number, tl: number, cx: number, cy: number) => applyPose(cam, { tx: t.x, ty: t.y, dist, tilt: tl, cx, cy }, vw, vh)
  // every tilt the focus passes through while the letters are framed (P .3–.55 reaches 0–14°)
  const tilts = [0, 0.1, 0.2, 0.3, 0.4, 0.5].map((k) => tilt * k)
  const lettersIn = (g: Rect, dist: number, cx: number, cy: number) =>
    tilts.every((tl) => {
      pose(dist, tl, cx, cy)
      return fits(project(cam, letters, vw, vh), g, LETTERS_MARGIN)
    })
  for (const g of regions) {
    // The lens shift centres on the letters; the die is looked at from the same target, so
    // the rise stays vertical. Fit the die around that same target.
    let cx = (g.x0 + g.x1) / 2
    let cy = (g.y0 + g.y1) / 2
    let near = fitDist(cam, letters, g, LETTERS_MARGIN, tilts, vw, vh)
    const sealOn = !!(seal && plate)
    const horiz = g.name === 'right of plate'
    // right of plate: +m moves the seal away (right); above plate: −m moves it away (up)
    const shift = (m: number) => (horiz ? [cx + m, cy] : [cx, cy - m])
    if (sealOn) {
      // Seal tangency at the hold. Tuck it under first, else clear it, at the same letter size.
      pose(near, 0, cx, cy)
      const gap = sealGap(cam, seal!, g, plate, vw, vh)
      if (!sealOk(gap)) {
        const free = [-(SEAL_UNDER + gap), SEAL_CLEAR - gap].find((m) => {
          const [ncx, ncy] = shift(m)
          return lettersIn(g, near, ncx, ncy)
        })
        if (free !== undefined) [cx, cy] = shift(free)
        else {
          // Neither keeps the letters' 6% at this size: settle each direction by re-fitting the
          // letters at the new centre until the seal rule holds, and keep the bigger name.
          const settle = (dir: 'under' | 'clear') => {
            let [scx, scy] = [cx, cy]
            let d = near
            for (let it = 0; it < 12; it++) {
              pose(d, 0, scx, scy)
              const g2 = sealGap(cam, seal!, g, plate, vw, vh)
              if (sealOk(g2)) return { cx: scx, cy: scy, near: d }
              const m = dir === 'under' ? -(SEAL_UNDER + g2) : SEAL_CLEAR - g2
              ;[scx, scy] = horiz ? [scx + m, scy] : [scx, scy - m]
              d = fitDist(cam, letters, g, LETTERS_MARGIN, tilts, vw, vh, scx, scy)
            }
            return null
          }
          const opts = [settle('under'), settle('clear')].filter((o) => o !== null)
          const pick = opts.sort((a, b) => a.near - b.near)[0]
          if (pick) ({ cx, cy, near } = pick)
        }
      }
    }
    const dieAround: WBox = {
      x0: Math.min(die.x0, 2 * t.x - die.x1),
      x1: Math.max(die.x1, 2 * t.x - die.x0),
      y0: Math.min(die.y0, 2 * t.y - die.y1),
      y1: Math.max(die.y1, 2 * t.y - die.y0),
    }
    // Far pose: the die (+4%) in the region with the seal ≥ 32 px clear of the plate. (It can't
    // tuck under on phones: the lens centre is shared with the hold so the rise stays vertical.)
    let far = searchDist((dist) => {
      pose(dist, 0, cx, cy)
      if (!fits(project(cam, dieAround, vw, vh), g, DIE_MARGIN)) return false
      return !sealOn || sealGap(cam, seal!, g, plate, vw, vh) >= SEAL_CLEAR - 0.5
    })
    far = Math.max(near, far)
    if (!best || far < best.far) best = { region: g, cx, cy, near, far, target: t }
  }
  return best
}

/** Fit margins: the letters at the hold, the die at the rise end (C-02). */
export const LETTERS_MARGIN = 0.06
export const DIE_MARGIN = 0.04
