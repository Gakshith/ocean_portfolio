// Motion preferences: the live prefers-reduced-motion query, the user's Still choice and the
// intent to run the 3D layer. A vanilla store so non-React code (the camera, the scroll engine,
// sim loops) can subscribe too. SSR-safe: nothing touches window until the first get() or
// subscribe() on the client, and the server snapshot is all false so hydration matches the
// prerendered HTML.
//
// Two controls (R-P2-13): "Still" is the motion switch (stillChosen: 3D off AND calm), and
// "Turn on 3D" is separate (turnOn3D, stored; ?3d=1 presses it for one visit, R-P2-03).
import { useSyncExternalStore } from 'react'

export interface Motion {
  reducedMotion: boolean
  stillChosen: boolean
  /** Visual skin: stillChosen || reducedMotion || !has3D. */
  still: boolean
  /** No auto-motion: stillChosen || reducedMotion. Sims gate autoplay on this. */
  calm: boolean
  setStill: (on: boolean) => void
  /** The renderer is live (webgl_agent's setHas3D). Always false while !load3D. */
  has3D: boolean
  /** Intent to run the 3D path. The S1 pin keys on this. */
  load3D: boolean
  /** Why 3D is off; null while load3D. */
  off3D: Off3D
}

export type Off3D =
  | null
  | 'still-chosen'
  | 'default-off'
  | 'device-memory'
  | 'save-data'
  | 'reduced-motion'
  | 'no-gpu'

/** Flip to true once Akash's real-phone measurements pass (plan open question 4). */
export const DEFAULT_3D = false

/** Reasons the "Turn on 3D" button can override; the others show as a plain line. */
export const OVERRIDABLE: ReadonlySet<Off3D> = new Set<Off3D>(['still-chosen', 'default-off', 'device-memory', 'save-data'])

const STILL_KEY = 'ocean:still'
const ON3D_KEY = 'ocean:3d'
const QUERY = '(prefers-reduced-motion: reduce)'

interface Inputs {
  reducedMotion: boolean
  /** Stored explicit Still ('ocean:still' = '1'). */
  storedStill: boolean
  /** Stored "Turn on 3D" ('ocean:3d' = '1'). */
  stored3D: boolean
  /** ?3d=1 for this visit; spent once the user presses Still. */
  url3D: boolean
  capable: boolean
  memoryHint: boolean
  saveData: boolean
  /** setHas3D(false) while load3D: the renderer failed for good this visit. */
  failed: boolean
  ready: boolean
}

type Listener = (m: Motion) => void
const listeners = new Set<Listener>()
let started = false
let inputs: Inputs = {
  reducedMotion: false,
  storedStill: false,
  stored3D: false,
  url3D: false,
  capable: false,
  memoryHint: false,
  saveData: false,
  failed: false,
  ready: false,
}

export function derive(i: Inputs): Omit<Motion, 'setStill'> {
  const stillChosen = i.storedStill && !i.url3D
  const turnedOn = i.url3D || i.stored3D
  const want3D = turnedOn || (DEFAULT_3D && !i.memoryHint && !i.saveData)
  const load3D = !i.reducedMotion && i.capable && !i.failed && !stillChosen && want3D
  const has3D = load3D && i.ready
  const off3D: Off3D = load3D
    ? null
    : i.reducedMotion
      ? 'reduced-motion'
      : !i.capable || i.failed
        ? 'no-gpu'
        : stillChosen
          ? 'still-chosen'
          : DEFAULT_3D && i.saveData
            ? 'save-data'
            : DEFAULT_3D && i.memoryHint
              ? 'device-memory'
              : 'default-off'
  return {
    reducedMotion: i.reducedMotion,
    stillChosen,
    still: stillChosen || i.reducedMotion || !has3D,
    calm: stillChosen || i.reducedMotion,
    has3D,
    load3D,
    off3D,
  }
}

const ssr: Motion = {
  reducedMotion: false,
  stillChosen: false,
  still: false,
  calm: false,
  setStill,
  has3D: false,
  load3D: false,
  off3D: null,
}
let current: Motion = ssr

function reflect(m: Motion) {
  const html = document.documentElement
  html.dataset.still = String(m.still)
  html.dataset.reducedMotion = String(m.reducedMotion)
  html.dataset.calm = String(m.calm)
  html.dataset.load3d = String(m.load3D)
}

function commit(patch: Partial<Inputs>) {
  const next = { ...inputs, ...patch }
  const d = derive(next)
  if (!d.load3D) next.ready = false // a torn-down renderer is not ready; the next start re-reports
  inputs = next
  const m: Motion = { ...d, setStill }
  const same =
    current !== ssr && (Object.keys(d) as (keyof typeof d)[]).every((k) => current[k] === m[k])
  if (same) return
  current = m
  reflect(current)
  for (const fn of listeners) fn(current)
}

function read(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}
function write(key: string, on: boolean) {
  try {
    window.localStorage.setItem(key, on ? '1' : '0')
  } catch {
    // Private mode or blocked storage: the choice still applies for this visit.
  }
}

/** WebGPU, or at least the WebGL2 API. Real init failures come back through setHas3D(false). */
function detectCapable(): boolean {
  if (typeof navigator !== 'undefined' && 'gpu' in navigator) return true
  return typeof window !== 'undefined' && 'WebGL2RenderingContext' in window
}

function start() {
  if (started || typeof window === 'undefined') return
  started = true
  const mq = typeof window.matchMedia === 'function' ? window.matchMedia(QUERY) : null
  mq?.addEventListener('change', (e) => commit({ reducedMotion: e.matches }))
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
  let url3D = false
  try {
    url3D = new URLSearchParams(window.location.search).get('3d') === '1'
  } catch {
    url3D = false
  }
  commit({
    reducedMotion: mq?.matches ?? false,
    storedStill: read(STILL_KEY),
    stored3D: read(ON3D_KEY),
    url3D,
    capable: detectCapable(),
    memoryHint: typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 2,
    saveData: nav.connection?.saveData === true,
  })
}

/** The Still switch: on = 3D off and no auto-motion. Off only clears the explicit Still. */
function setStill(on: boolean) {
  start()
  write(STILL_KEY, on)
  commit(on ? { storedStill: true, url3D: false } : { storedStill: false })
}

/** "Turn on 3D" (R-P2-13): stored, and it clears an explicit Still. */
export function turnOn3D(): void {
  start()
  write(ON3D_KEY, true)
  write(STILL_KEY, false)
  commit({ stored3D: true, storedStill: false, failed: false })
}

/** webgl_agent: true on the first real frame; false only on unrecoverable failure (R-P2-10). */
export function setHas3D(ready: boolean): void {
  start()
  if (ready) {
    if (current.load3D) commit({ ready: true })
  } else if (current.load3D) commit({ ready: false, failed: true })
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
