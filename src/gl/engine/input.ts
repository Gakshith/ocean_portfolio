// The engine's whole view of the page (R-P2-16, worker-ready): plain serialisable data, measured on
// the main thread (src/gl/layout.ts) and handed in. Nothing under src/gl/engine/** reads the DOM, so
// the engine can move to a Worker on an OffscreenCanvas by posting these two objects.
import type { Rect } from '../framing'
import type { SectionId } from '../../state/sections'

/** Elements the camera frames into (`data-gl-stage`). S3–S5 surfaces arrive in step 9. */
export type StageId = 'about' | 'cybot' | 'contact'

/** Re-measured only when layout changes (resize, a watched element resizing, fonts ready). */
export interface Layout {
  vw: number
  vh: number
  dpr: number
  /** The free band between the bars (`data-gl-avoid`, full width), viewport px. */
  top: number
  bottom: number
  /** The S1 plate (`data-gl-avoid`, not full width) as it sits inside the pin, viewport px, and
   *  the hero progress when measured: a measurement inside the pin (heroP < 1) is authoritative. */
  plate: Rect | null
  plateHeroP: number
  /** Stage rects in document px (viewport px + scrollY): a dwell pans 1:1 with the page. */
  stages: Partial<Record<StageId, Rect>>
  /** Section tops in document px. */
  sections: Partial<Record<SectionId, number>>
}

/** Per tick, from the scroll store. */
export interface Tick {
  y: number
  heroP: number
  from: SectionId
  to: SectionId
  /** Travel progress between from and to, 0..1 (0 while dwelling). */
  t: number
}

/** A jump (nav link, key, minimap): fly there in ≤ 900 ms, or cut when instant (calm / still). */
export interface Jump {
  from: SectionId
  to: SectionId
  instant: boolean
}

/** Rect in document px → viewport px at scroll y. */
export const toViewport = (r: Rect, y: number): Rect => ({ x0: r.x0, y0: r.y0 - y, x1: r.x1, y1: r.y1 - y })
