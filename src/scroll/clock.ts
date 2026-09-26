// STUB (lead, phase 2 freeze): bake_agent replaces this and keeps the exports.
// One clock: gsap.ticker (lagSmoothing 0). Each tick: Lenis.raf → ScrollTrigger.update →
// scrollStore emit → frame fns. Sleeps (no rAF) when every frame fn returns falsy, Lenis is
// idle and no tween is active; wakes on input, scroll, resize, invalidate() or a tween start.

/** Return true to request the next tick. Never called while pauseBus is paused. */
export type FrameFn = (timeMs: number, dtMs: number) => boolean | void

export const clock = {
  add(fn: FrameFn): () => void {
    void fn
    return () => {}
  },
  invalidate(): void {},
  takeInvalidated(): boolean {
    return false
  },
}
