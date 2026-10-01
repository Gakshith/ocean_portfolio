// The engine's view of the one clock (seam 2): frame fns on bake's gsap ticker, the scroll state
// from the scroll store. The engine never runs its own rAF in production.
import { clock, scrollStore } from '../scroll'
import type { Tick } from './engine/input'

/** The clock seam, narrowed to what the 3D needs (src/scroll in production, a rAF shim in dev). */
export interface Driver {
  add(fn: (timeMs: number, dtMs: number) => boolean | void): () => void
  invalidate(): void
  tick(): Tick
}

export const clockDriver: Driver = {
  add: (fn) => clock.add(fn),
  invalidate: () => clock.invalidate(),
  tick: () => {
    const s = scrollStore.get()
    return { y: s.y, heroP: s.heroP, from: s.from, to: s.to, t: s.t }
  },
}
