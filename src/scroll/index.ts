// Public surface of the scroll slice. clock / scrollStore / TRAVEL are the frozen seam; bootScroll
// is called once by the chrome after hydration.
import { motionStore } from '../state/motion'

export { clock, type FrameFn } from './clock'
export { scrollStore, type ScrollState } from './scroll'
export { TRAVEL, type TravelKey, type TravelWindow } from './windows'

type Engine = typeof import('./engine')
let engine: Promise<Engine> | null = null
let booted = false

/** After first paint and idle (300ms cap), like the 3D chunk: never in the critical path. */
function whenIdle(): Promise<void> {
  return new Promise((res) => {
    const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback
    if (ric) ric(() => res(), { timeout: 300 })
    else setTimeout(res, 300)
  })
}

function load(): Promise<Engine> {
  engine ??= whenIdle().then(() => import('./engine'))
  return engine
}

/**
 * The engine (GSAP ticker + Lenis) runs only while motion is live. Under calm (reduced motion or
 * the user's Still) nothing is fetched and the page keeps native scroll; switching live starts or
 * stops it. Returns the unsubscribe.
 */
export function bootScroll(): () => void {
  if (booted || typeof window === 'undefined') return () => {}
  booted = true
  let live = false
  const apply = (calm: boolean) => {
    if (calm === !live) return
    live = !calm
    if (live) load().then((e) => live && e.start())
    else if (engine) engine.then((e) => e.stop())
  }
  apply(motionStore.get().calm)
  const off = motionStore.subscribe((m) => apply(m.calm))
  return () => {
    off()
    booted = false
    live = false
    engine?.then((e) => e.stop())
  }
}
