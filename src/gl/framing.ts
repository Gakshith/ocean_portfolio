// The camera is one function: fit a world box into a screen rect (C-02). The distance is found
// by binary search so the projected box plus a margin sits inside the rect at every listed tilt,
// and a lens shift (setViewOffset) puts the look target at the rect's centre, so a rise between
// two distances is a pure vertical move. Every camera stop (S1 letters, S1 die, S2 die, S7 south
// half, and the step-9 blocks) is "this world box in that DOM rect".
import { PerspectiveCamera, Vector3 } from 'three/webgpu'

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

export const FOV = 35

export function makeCamera() {
  const cam = new PerspectiveCamera(FOV, 1, 0.05, 80)
  cam.up.set(0, 0, -1)
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

/** Smallest distance at which `box` (+margin) fits `g` for every tilt, looking at the box centre. */
export function fitDist(cam: PerspectiveCamera, box: WBox, g: Rect, margin: number, tilts: number[], vw: number, vh: number) {
  const c = center(box)
  const cx = (g.x0 + g.x1) / 2
  const cy = (g.y0 + g.y1) / 2
  let lo = 0.2
  let hi = 80
  for (let it = 0; it < 40; it++) {
    const mid = (lo + hi) / 2
    let ok = true
    for (const tilt of tilts) {
      applyPose(cam, { tx: c.x, ty: c.y, dist: mid, tilt, cx, cy }, vw, vh)
      if (!fits(project(cam, box, vw, vh), g, margin)) {
        ok = false
        break
      }
    }
    if (ok) hi = mid
    else lo = mid
  }
  return hi
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

/** The S1 composition: the letters (+6%) fit at tilts 0° and 14° for the near pose, and the die
 *  (+4%) fits for the far pose. The region that gives the largest die wins. */
export function fitS1(
  cam: PerspectiveCamera,
  letters: WBox,
  die: WBox,
  regions: (Rect & { name: string })[],
  tilt: number,
  vw: number,
  vh: number,
): S1Framing | null {
  let best: S1Framing | null = null
  const t = center(letters)
  for (const g of regions) {
    // The lens shift centres on the letters; the die is looked at from the same target, so
    // the rise stays vertical. Fit the die around that same target.
    const near = fitDist(cam, letters, g, 0.06, [0, tilt * 0.5], vw, vh)
    const dieAround: WBox = {
      x0: Math.min(die.x0, 2 * t.x - die.x1),
      x1: Math.max(die.x1, 2 * t.x - die.x0),
      y0: Math.min(die.y0, 2 * t.y - die.y1),
      y1: Math.max(die.y1, 2 * t.y - die.y0),
    }
    const far = Math.max(near, fitDist(cam, dieAround, g, 0.04, [0], vw, vh))
    if (!best || far < best.far) best = { region: g, cx: (g.x0 + g.x1) / 2, cy: (g.y0 + g.y1) / 2, near, far, target: t }
  }
  return best
}
