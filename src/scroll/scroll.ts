// Where the page is, in the terms the camera needs (contract seam 2). Section tops are measured
// once per layout change (a ResizeObserver on the document, plus resize), never per frame; each
// tick only reads scrollY. The engine emits inside the clock tick, before the frame fns; without
// the engine (calm), get() still answers from the live scroll position.
import { SECTIONS, type SectionId } from '../state/sections'
import { travelPairs } from './windows'

export interface ScrollState {
  y: number
  /** S1 pin progress (120vh ≥ 768 / 100vh < 768); 1 when there is no pin. */
  heroP: number
  from: SectionId
  to: SectionId
  /** Travel progress between from and to, 0..1 (0 while dwelling). */
  t: number
  dwellPx: number
}

export interface Layout {
  vh: number
  /** The S1 pin's scroll length in px (0 without the pin). */
  pinLen: number
  tops: Record<SectionId, number>
}

const initial: ScrollState = { y: 0, heroP: 1, from: 'top', to: 'top', t: 0, dwellPx: 0 }
let state: ScrollState = initial
let layout: Layout | null = null
let watching = false
const listeners = new Set<(s: ScrollState) => void>()

/** Pure: the state for a scroll position in a measured layout. */
export function compute(y: number, L: Layout): ScrollState {
  const heroP = L.pinLen > 0 ? Math.min(1, Math.max(0, y / L.pinLen)) : 1
  const top = (id: SectionId) => L.tops[id]
  let dwell: { id: SectionId; start: number } = { id: 'top', start: 0 }
  for (const { from, to, win } of travelPairs()) {
    const [a, b] = win(L.vh, top)
    if (y >= a && y < b) return { y, heroP, from, to, t: (y - a) / (b - a), dwellPx: 0 }
    if (y >= b) dwell = { id: to, start: b }
  }
  return { y, heroP, from: dwell.id, to: dwell.id, t: 0, dwellPx: y - dwell.start }
}

/** Where a jump lands: the target's dwell start (the end of the window that travels into it). */
export function dwellStart(id: SectionId, L: Layout): number {
  if (id === 'top') return 0
  const pair = travelPairs().find((p) => p.to === id)!
  return pair.win(L.vh, (s) => L.tops[s])[1]
}

export function measureLayout(): Layout {
  const tops = {} as Record<SectionId, number>
  const y = window.scrollY
  for (const { id } of SECTIONS) {
    const el = document.getElementById(id)
    tops[id] = el ? el.getBoundingClientRect().top + y : 0
  }
  const track = document.querySelector<HTMLElement>('.s1-track--pin')
  const s1 = document.getElementById('top')
  const pinLen = track && s1 ? Math.max(0, track.offsetHeight - s1.offsetHeight) : 0
  return { vh: window.innerHeight, pinLen, tops }
}

function watch() {
  if (watching || typeof window === 'undefined') return
  watching = true
  const dirty = () => {
    layout = null
  }
  window.addEventListener('resize', dirty)
  if (typeof ResizeObserver === 'function') new ResizeObserver(dirty).observe(document.documentElement)
}

/** The current layout, measured lazily after any change. */
export function getLayout(): Layout {
  watch()
  layout ??= measureLayout()
  return layout
}

/** Force a re-measure (the pin mounted or unmounted). */
export function invalidateLayout(): void {
  layout = null
}

/** The engine's per-tick update; emits only when something changed. */
export function updateScroll(y = window.scrollY): ScrollState {
  const next = compute(y, getLayout())
  const same =
    next.y === state.y && next.heroP === state.heroP && next.from === state.from && next.to === state.to && next.t === state.t
  if (!same) {
    state = next
    for (const fn of listeners) fn(state)
  }
  return state
}

export const scrollStore = {
  get: (): ScrollState => (typeof window === 'undefined' ? initial : updateScroll()),
  subscribe(fn: (s: ScrollState) => void): () => void {
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  },
}
