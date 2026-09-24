// Jumps (die map, index rows, Interrupt project rows, any a[href="#sectionId"]).
// Phase 1 is always Still, so a jump is an instant cut: set the scroll, write the hash,
// move focus to the section heading. Phase 2 adds the camera arc behind the same call.
import { setCurrent } from './nav'
import type { SectionId } from './sections'

const listeners = new Set<(id: SectionId) => void>()

export function jumpTo(id: SectionId): void {
  if (typeof document === 'undefined') return
  const section = document.getElementById(id)
  if (!section) return
  if (id === 'top') window.scrollTo({ top: 0, behavior: 'instant' })
  // scrollIntoView honours scroll-padding-top, so the heading clears the 56px bar.
  else section.scrollIntoView?.({ block: 'start', behavior: 'instant' })
  history.replaceState(history.state, '', `#${id}`)
  document.getElementById(`${id}-title`)?.focus({ preventScroll: true })
  setCurrent(id)
  for (const fn of listeners) fn(id)
}

/** Sections use this to mark skipped entrances done. */
export function onJump(fn: (id: SectionId) => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
