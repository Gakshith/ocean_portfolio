// Main-thread half of the engine boundary: measures the page into a Layout (src/gl/engine/input.ts)
// and re-measures only when layout can have changed. The engine never touches the DOM.
import type { Rect } from './framing'
import type { Layout, StageId } from './engine/input'
import type { SectionId } from '../state/sections'

const rectOf = (r: DOMRect): Rect => ({ x0: r.left, y0: r.top, x1: r.right, y1: r.bottom })

export function measureLayout(heroP: number): Layout {
  const vw = innerWidth
  const vh = innerHeight
  const y = scrollY
  let top = 0
  let bottom = vh
  let plate: Rect | null = null
  for (const el of document.querySelectorAll<HTMLElement>('[data-gl-avoid]')) {
    const r = el.getBoundingClientRect()
    if (r.width < 1 || r.height < 1) continue
    const full = r.width >= vw * 0.9
    if (full && r.top <= 1) top = Math.max(top, r.bottom)
    else if (full && r.bottom >= vh - 1) bottom = Math.min(bottom, r.top)
    // Outside the pin, the plate's rect at scroll 0 is where it sits inside the pin.
    else plate = heroP < 1 ? rectOf(r) : { x0: r.left, y0: r.top + y, x1: r.right, y1: r.bottom + y }
  }
  const stages: Layout['stages'] = {}
  for (const el of document.querySelectorAll<HTMLElement>('[data-gl-stage]')) {
    const r = el.getBoundingClientRect()
    if (r.width < 1 || r.height < 1) continue
    stages[el.dataset.glStage as StageId] = { x0: r.left, y0: r.top + y, x1: r.right, y1: r.bottom + y }
  }
  const sections: Layout['sections'] = {}
  for (const el of document.querySelectorAll<HTMLElement>('[data-section]')) sections[el.dataset.section as SectionId] = el.getBoundingClientRect().top + y
  return { vw, vh, dpr: devicePixelRatio, top, bottom, plate, plateHeroP: heroP, stages, sections }
}

/** Calls `fn` after anything that can move the measured elements: a resize, one of them resizing,
 *  web fonts settling. Returns the unsubscribe. */
export function watchLayout(fn: () => void): () => void {
  let raf = 0
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(() => ((raf = 0), fn()))
  }
  const ro = new ResizeObserver(kick)
  for (const el of document.querySelectorAll('[data-gl-avoid], [data-gl-stage], [data-section]')) ro.observe(el)
  addEventListener('resize', kick)
  let alive = true
  document.fonts?.ready.then(() => alive && kick())
  return () => {
    alive = false
    cancelAnimationFrame(raf)
    ro.disconnect()
    removeEventListener('resize', kick)
  }
}
