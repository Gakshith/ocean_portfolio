// STUB (lead, phase 2 freeze): bake_agent replaces this and keeps the exports.
import type { SectionId } from '../state/sections'

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

const initial: ScrollState = { y: 0, heroP: 1, from: 'top', to: 'top', t: 0, dwellPx: 0 }

export const scrollStore = {
  get: (): ScrollState => initial,
  subscribe(fn: (s: ScrollState) => void): () => void {
    void fn
    return () => {}
  },
}
