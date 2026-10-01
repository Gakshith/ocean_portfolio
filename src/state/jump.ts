// Jumps (die map, index rows, Interrupt project rows, any a[href="#sectionId"]).
// Still or calm: an instant cut (set the scroll, write the hash, focus the section heading).
// With the 3D live: the DOM cross-fades 120 out / 200 in around the same cut, the scroll lands on
// the target's dwell start through the engine (Lenis), and onJump tells the camera to fly.
import { motionStore } from './motion'
import { getNav, setCurrent } from './nav'
import type { SectionId } from './sections'

export interface JumpDetail {
  /** Where the page was when the jump started. */
  from: SectionId
  /** true = cut (calm or Still); false = the camera flies ≤ 900ms. */
  instant: boolean
}

/** The scroll engine's hooks while it runs (src/scroll/engine.ts). */
export interface Scroller {
  /** Scroll to the section's dwell start (3D path). */
  jump(id: SectionId): void
  /** Adopt a scroll position set natively (Lenis must not ease back to its old one). */
  sync(): void
}

const listeners = new Set<(id: SectionId, d: JumpDetail) => void>()
let scroller: Scroller | null = null

export function setScroller(s: Scroller | null): void {
  scroller = s
}

/** After a native scroll change (the pin compensating), let the engine adopt the new position. */
export function syncScroller(): void {
  scroller?.sync()
}

const OUT_MS = 120
const IN_MS = 200

export function jumpTo(id: SectionId): void {
  if (typeof document === 'undefined') return
  const section = document.getElementById(id)
  if (!section) return
  const from = getNav().current ?? 'top'
  const m = motionStore.get()
  const instant = m.calm || m.still

  const land = () => {
    if (!instant && scroller) scroller.jump(id)
    else {
      if (id === 'top') window.scrollTo({ top: 0, behavior: 'instant' })
      // scrollIntoView honours scroll-padding-top, so the heading clears the 56px bar.
      else section.scrollIntoView?.({ block: 'start', behavior: 'instant' })
      scroller?.sync()
    }
    history.replaceState(history.state, '', `#${id}`)
    document.getElementById(`${id}-title`)?.focus({ preventScroll: true })
    setCurrent(id)
    for (const fn of listeners) fn(id, { from, instant })
  }

  const main = document.getElementById('main')
  if (instant || !main || typeof main.animate !== 'function') return land()
  // The fade-out holds its end (fill) until the fade-in has started, so the page never flashes.
  const out = main.animate([{ opacity: 1 }, { opacity: 0 }], { duration: OUT_MS, easing: 'ease-in', fill: 'forwards' })
  out.finished.then(
    () => {
      land()
      main.animate([{ opacity: 0 }, { opacity: 1 }], { duration: IN_MS, easing: 'ease-out' })
      out.cancel()
    },
    land,
  )
}

/** Sections mark skipped entrances done; the camera flies (or cuts) on it. Never fires on load. */
export function onJump(fn: (id: SectionId, d: JumpDetail) => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
