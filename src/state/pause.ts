// The pause bus: sims and (phase 2) the render loop stop while the Surface Interrupt is
// open or the tab is hidden, then resume in place. Emits synchronously, in the same frame.
import { useSyncExternalStore } from 'react'

export type PauseReason = 'interrupt' | 'hidden'
type Listener = (paused: boolean, reasons: Set<PauseReason>) => void

const reasons = new Set<PauseReason>()
const listeners = new Set<Listener>()
let watchingVisibility = false

function emit() {
  const paused = reasons.size > 0
  for (const fn of listeners) fn(paused, new Set(reasons))
}

function watchVisibility() {
  if (watchingVisibility || typeof document === 'undefined') return
  watchingVisibility = true
  const sync = () => setPauseReason('hidden', document.visibilityState === 'hidden')
  document.addEventListener('visibilitychange', sync)
  sync()
}

/** chrome-internal: raise or clear one reason. Emits only when the set changes. */
export function setPauseReason(reason: PauseReason, on: boolean) {
  if (on === reasons.has(reason)) return
  if (on) reasons.add(reason)
  else reasons.delete(reason)
  emit()
}

export const pauseBus = {
  isPaused: (): boolean => {
    watchVisibility()
    return reasons.size > 0
  },
  subscribe: (fn: Listener): (() => void) => {
    watchVisibility()
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  },
}

const subscribeReact = (onChange: () => void) => pauseBus.subscribe(onChange)
const getServer = () => false

export function usePaused(): boolean {
  return useSyncExternalStore(subscribeReact, pauseBus.isPaused, getServer)
}

type ContextSaver = { save: () => void; restore: () => void }
const savers = new Set<ContextSaver>()

/** Phase 2 camera slot: saved when the Interrupt opens, restored when it returns. */
export function registerContextSaver(saver: ContextSaver): () => void {
  savers.add(saver)
  return () => {
    savers.delete(saver)
  }
}

/** chrome-internal. */
export function saveContext() {
  for (const s of savers) s.save()
}
/** chrome-internal. */
export function restoreContext() {
  for (const s of savers) s.restore()
}
