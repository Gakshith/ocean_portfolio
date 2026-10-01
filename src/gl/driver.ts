// The engine's view of the one clock (seam 2): frame fns on bake's gsap ticker, S1 progress from
// the scroll store. The engine never runs its own rAF in production.
import { clock, scrollStore } from '../scroll'
import type { Driver } from './engine/engine'

export const clockDriver: Driver = {
  add: (fn) => clock.add(fn),
  invalidate: () => clock.invalidate(),
  heroP: () => scrollStore.get().heroP,
}
