// Motion preferences: the live prefers-reduced-motion query plus the user's Still toggle.
// A vanilla store so non-React code (phase 2 camera, sim loops) can subscribe too.
// SSR-safe: nothing touches window until the first get() or subscribe() on the client,
// and the server snapshot is all false so hydration matches the prerendered HTML.
import { useSyncExternalStore } from 'react'

export interface Motion {
  reducedMotion: boolean
  stillChosen: boolean
  /** Visual skin: stillChosen || reducedMotion || !has3D. */
  still: boolean
  /** No auto-motion: stillChosen || reducedMotion. Sims gate autoplay on this. */
  calm: boolean
  setStill: (on: boolean) => void
}

/** Phase 1 ships no 3D layer. Phase 2 flips this once the renderer is ready. */
const has3D = false
const STORAGE_KEY = 'ocean:still'
const QUERY = '(prefers-reduced-motion: reduce)'

type Listener = (m: Motion) => void
const listeners = new Set<Listener>()
let started = false

function build(reducedMotion: boolean, stillChosen: boolean): Motion {
  return {
    reducedMotion,
    stillChosen,
    still: stillChosen || reducedMotion || !has3D,
    calm: stillChosen || reducedMotion,
    setStill,
  }
}

const ssr: Motion = { reducedMotion: false, stillChosen: false, still: false, calm: false, setStill }
let current: Motion = ssr

function reflect(m: Motion) {
  const html = document.documentElement
  html.dataset.still = String(m.still)
  html.dataset.reducedMotion = String(m.reducedMotion)
  html.dataset.calm = String(m.calm)
}

function update(reducedMotion: boolean, stillChosen: boolean) {
  if (current !== ssr && current.reducedMotion === reducedMotion && current.stillChosen === stillChosen) return
  current = build(reducedMotion, stillChosen)
  reflect(current)
  for (const fn of listeners) fn(current)
}

function readStored(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function start() {
  if (started || typeof window === 'undefined') return
  started = true
  const mq = typeof window.matchMedia === 'function' ? window.matchMedia(QUERY) : null
  mq?.addEventListener('change', (e) => update(e.matches, current.stillChosen))
  update(mq?.matches ?? false, readStored())
}

function setStill(on: boolean) {
  start()
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? '1' : '0')
  } catch {
    // Private mode or blocked storage: the choice still applies for this visit.
  }
  update(current.reducedMotion, on)
}

export const motionStore = {
  get: (): Motion => {
    start()
    return current
  },
  subscribe: (fn: Listener): (() => void) => {
    start()
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  },
}

const getServer = () => ssr

export function useMotion(): Motion {
  return useSyncExternalStore(motionStore.subscribe, motionStore.get, getServer)
}
export function useReducedMotion(): boolean {
  return useMotion().reducedMotion
}
export function useStill(): boolean {
  return useMotion().still
}
