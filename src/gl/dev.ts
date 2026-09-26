// DEV ONLY (`?gldev`, dynamically imported under import.meta.env.DEV, so it never ships).
// Stands in for bake_agent's clock and scroll store until they merge: a rAF loop that sleeps
// when every frame fn returns falsy, and P from scrollY over a 120vh / 100vh pin.
import type { Driver } from './engine/engine'

type Fn = (t: number, dt: number) => boolean | void

export function devDriver(): Driver {
  const fns = new Set<Fn>()
  let raf = 0
  let last = 0
  let forced: number | null = null
  const tick = (now: number) => {
    raf = 0
    const dt = last ? now - last : 16.7
    last = now
    let more = false
    for (const fn of fns) if (fn(now, dt)) more = true
    if (more) raf = requestAnimationFrame(tick)
    else last = 0
  }
  const wake = () => {
    if (!raf) raf = requestAnimationFrame(tick)
  }
  addEventListener('scroll', wake, { passive: true })
  addEventListener('resize', wake)
  ;(window as unknown as { __glDevP: (v: number | null) => void }).__glDevP = (v) => {
    forced = v
    wake()
  }
  return {
    add(fn) {
      fns.add(fn)
      wake()
      return () => fns.delete(fn)
    },
    invalidate: wake,
    heroP: () => forced ?? Math.min(1, Math.max(0, scrollY / (innerHeight * (innerWidth < 768 ? 1 : 1.2)))),
  }
}
