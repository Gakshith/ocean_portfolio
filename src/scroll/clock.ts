// The one clock (R-P2-12). A tiny facade in the entry; the lazy engine (engine.ts) attaches
// gsap.ticker as its driver, and until then (or while motion is calm) a plain rAF driver runs.
// Each tick: the engine's pre-step (Lenis.raf, then the scroll store) → frame fns. It sleeps (no
// rAF at all) when nothing asked for another tick; it wakes on input, scroll, resize, invalidate().
//
// The facade imports nothing: the engine injects the pause check (pauseBus) when it attaches, and
// wakes the clock when the page resumes.

/** Return true to request the next tick. Never called while pauseBus is paused. */
export type FrameFn = (timeMs: number, dtMs: number) => boolean | void

export interface Driver {
  /** Start calling runTick every frame. */
  wake(): void
  /** Stop calling it (no rAF). */
  sleep(): void
}
/** Runs before the frame fns; returns true while it still needs frames (Lenis easing, scrolling). */
export type PreStep = (timeMs: number, dtMs: number) => boolean

const fns = new Set<FrameFn>()
let driver: Driver | null = null
let pre: PreStep | null = null
let awake = false
let invalidated = false
let isPaused: () => boolean = () => false

/** One tick. Drivers call this; tests may too. */
export function runTick(timeMs: number, dtMs: number): void {
  let keep = pre ? pre(timeMs, dtMs) : false
  if (!isPaused()) for (const fn of [...fns]) if (fn(timeMs, dtMs)) keep = true
  if (!keep) {
    awake = false
    driver?.sleep()
  }
}

export function wakeClock(): void {
  if (awake) return
  driver ??= rafDriver()
  if (!driver) return
  awake = true
  driver.wake()
}

/** The engine installs gsap.ticker, its pre-step and the pause check; null returns to the rAF
 *  driver with no pause check. */
export function attachDriver(next: Driver | null, step: PreStep | null, paused: (() => boolean) | null = null): void {
  const was = awake
  if (awake) driver?.sleep()
  awake = false
  driver = next ?? rafDriver()
  pre = step
  isPaused = paused ?? (() => false)
  if (was || fns.size) wakeClock()
}

function rafDriver(): Driver | null {
  if (typeof requestAnimationFrame !== 'function') return null
  let id = 0
  let last = 0
  const loop = (t: number) => {
    id = requestAnimationFrame(loop)
    const dt = last ? t - last : 16.7
    last = t
    runTick(t, dt)
  }
  return {
    wake() {
      last = 0
      cancelAnimationFrame(id)
      id = requestAnimationFrame(loop)
    },
    sleep() {
      cancelAnimationFrame(id)
      id = 0
    },
  }
}

export const clock = {
  add(fn: FrameFn): () => void {
    fns.add(fn)
    wakeClock()
    return () => {
      fns.delete(fn)
    }
  },
  /** Anyone: "something changed, draw next tick" (resize, motion change, jump, context restore). */
  invalidate(): void {
    invalidated = true
    wakeClock()
  },
  /** The renderer: read-and-clear inside its frame fn. */
  takeInvalidated(): boolean {
    const v = invalidated
    invalidated = false
    return v
  },
}
