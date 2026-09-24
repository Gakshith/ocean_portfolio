// Where am I: the current section (drives the bar label, the phone chip and the minimap)
// and the set of visited sections. Tracked from scroll after hydration; null on the server.
import { useSyncExternalStore } from 'react'
import { SECTIONS, type SectionId } from './sections'

export interface NavState {
  current: SectionId | null
  visited: ReadonlySet<SectionId>
}

const ssr: NavState = { current: null, visited: new Set() }
let state: NavState = ssr
const listeners = new Set<() => void>()

export function isSectionId(id: string): id is SectionId {
  return SECTIONS.some((s) => s.id === id)
}

export function setCurrent(id: SectionId) {
  if (state.current === id) return
  const visited = new Set(state.visited)
  visited.add(id)
  state = { current: id, visited }
  for (const fn of listeners) fn()
}

/** A section counts as current once its top passes 40% of the viewport. */
export function measureCurrent(): SectionId | null {
  let found: SectionId | null = null
  for (const { id } of SECTIONS) {
    const el = document.getElementById(id)
    if (!el) continue
    if (found === null) found = id
    if (el.getBoundingClientRect().top <= window.innerHeight * 0.4) found = id
  }
  const doc = document.documentElement
  if (window.scrollY > 0 && window.scrollY + window.innerHeight >= doc.scrollHeight - 2) {
    return SECTIONS[SECTIONS.length - 1].id
  }
  return found
}

/**
 * Follows the scroll. The hash follows too, with replaceState so Back leaves the site
 * rather than rewinding sections (02-ux §5). `canWriteHash` lets the Interrupt hold it still.
 */
export function trackSections(canWriteHash: () => boolean): () => void {
  let frame = 0
  let first = true
  const run = () => {
    frame = 0
    const id = measureCurrent()
    if (!id) return
    const changed = id !== state.current
    setCurrent(id)
    if (changed && !first && canWriteHash()) {
      const hash = id === 'top' ? '' : `#${id}`
      if (location.hash !== hash) history.replaceState(history.state, '', `${location.pathname}${location.search}${hash}`)
    }
    first = false
  }
  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(run)
  }
  run()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  return () => {
    if (frame) cancelAnimationFrame(frame)
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
  }
}

const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
const get = () => state

/** Non-React read. */
export const getNav = (): NavState => state
const getServer = () => ssr

export function useNav(): NavState {
  return useSyncExternalStore(subscribe, get, getServer)
}
