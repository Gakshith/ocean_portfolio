// Camera stops C0–C5 (03-motion "Camera stops"), each one "fit this world box into that rect".
// The rect comes from the page (a data-gl-stage element, measured on the main thread into the
// frame input), so a stop is wherever its section draws, and a dwell pans 1:1 with the page for
// free (step 9). Pure: three.js math only, no DOM, so it runs in a worker as well.
import type { BakeMeta } from '../bake/meta'
import type { SectionId } from '../state/sections'
import { ease2, ease3, lerp } from './choreo'
import { applyPose, center, fitDist, type Pose, type Rect, type WBox } from './framing'
import { LEADS, type Reef } from './reef'
import type { PerspectiveCamera } from 'three/webgpu'

export type StopId = 'C0' | 'C1' | 'C2' | 'C3' | 'C4' | 'C5'

/** Dwell stop of each section after the hero (S1 keeps its own scroll-driven pose). */
export const STOP_OF: Record<Exclude<SectionId, 'top'>, StopId> = {
  about: 'C0',
  'link-layer': 'C1',
  'risc-v': 'C2',
  wisard: 'C3',
  cybot: 'C4',
  contact: 'C5',
}

/** Margin of the box inside its stage rect. */
export const STOP_MARGIN = 0.04

export function stopBoxes(meta: Pick<BakeMeta, 'die' | 'blocks' | 'letters'>, reef: Reef): Record<StopId, WBox> {
  const block = (section: SectionId) => meta.blocks.find((b) => b.section === section)!.box
  const uart = reef.pads.find((p) => p.uart)!
  const die = meta.die.box
  return {
    // C0: the whole die, plan view
    C0: die,
    // C1–C3: the radio, CPU and memory blocks
    C1: block('link-layer'),
    C2: block('risc-v'),
    C3: block('wisard'),
    // C4: the open sea past the SE reef, with the UART pad at the frame's west edge
    C4: { x0: uart.x - 0.08, x1: uart.x + 0.92, y0: uart.y - 0.5, y1: uart.y + 0.5 },
    // C5: the south half: reef, contact pads, bond wires, leads and the chip band below them;
    // the name's lower line shows only as a cropped glow at the top (C-10)
    C5: { x0: die.x0, x1: die.x1, y0: LEADS.y - LEADS.h - 0.12, y1: meta.letters.box.y0 + 0.13 },
  }
}

/** Plan-view pose that fits `box` (+margin) into `rect`, the target landing at the rect's centre. */
export function stopPose(cam: PerspectiveCamera, box: WBox, rect: Rect, vw: number, vh: number, margin = STOP_MARGIN): Pose {
  const cx = (rect.x0 + rect.x1) / 2
  const cy = (rect.y0 + rect.y1) / 2
  const c = center(box)
  const dist = fitDist(cam, box, rect, margin, [0], vw, vh, cx, cy)
  return { tx: c.x, ty: c.y, dist, tilt: 0, cx, cy }
}

const blend = (a: Pose, b: Pose, e: number): Pose => ({
  tx: lerp(a.tx, b.tx, e),
  ty: lerp(a.ty, b.ty, e),
  cx: lerp(a.cx, b.cx, e),
  cy: lerp(a.cy, b.cy, e),
  // geometric, so the zoom reads at an even rate
  dist: a.dist * Math.pow(b.dist / a.dist, e),
  tilt: lerp(a.tilt, b.tilt, e),
})

/** Scroll travel between two dwell poses: a straight line in plan, power3.inOut over the
 *  travel window (t is the raw window progress from the scroll store). */
export function travelPose(a: Pose, b: Pose, t: number): Pose {
  return blend(a, b, ease3(Math.min(1, Math.max(0, t))))
}

/** Jumps fly a direct path in ≤ 900 ms, power2.inOut: straight in plan plus a 15% height arc. */
export const JUMP_MS = 900
export function jumpPose(a: Pose, b: Pose, u: number): Pose {
  const e = ease2(Math.min(1, Math.max(0, u)))
  const p = blend(a, b, e)
  return { ...p, dist: p.dist * (1 + 0.15 * Math.sin(Math.PI * e)) }
}

/** Screen px of world points under a pose: the DOM lead chips use the renderer's own camera. */
export function projectPoints(cam: PerspectiveCamera, pose: Pose, pts: readonly { x: number; y: number }[], vw: number, vh: number) {
  applyPose(cam, pose, vw, vh)
  const m = cam.projectionMatrix.clone().multiply(cam.matrixWorldInverse)
  const e = m.elements
  return pts.map(({ x, y }) => {
    // world (x, 0, -y), w = 1
    const X = e[0] * x + e[8] * -y + e[12]
    const Y = e[1] * x + e[9] * -y + e[13]
    const W = e[3] * x + e[11] * -y + e[15]
    return { x: ((X / W + 1) / 2) * vw, y: ((1 - Y / W) / 2) * vh }
  })
}
