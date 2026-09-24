// STUB (lead, freeze commit). chrome_agent owns and replaces this file; keep these exports.
// SSR default: everything false; real values apply after hydration.
export interface Motion {
  reducedMotion: boolean
  stillChosen: boolean
  /** Visual skin: stillChosen || reducedMotion || !has3D. */
  still: boolean
  /** No auto-motion: stillChosen || reducedMotion. Sims gate autoplay on this. */
  calm: boolean
  setStill: (on: boolean) => void
}

const ssr: Motion = { reducedMotion: false, stillChosen: false, still: false, calm: false, setStill: () => {} }

export const motionStore = {
  get: (): Motion => ssr,
  subscribe: (_fn: (m: Motion) => void): (() => void) => () => {},
}

export function useMotion(): Motion {
  return ssr
}
export function useReducedMotion(): boolean {
  return false
}
export function useStill(): boolean {
  return false
}
