// DEV ONLY (`?gldev`, dynamically imported under import.meta.env.DEV, so it never ships).
// Stands in for bake_agent's clock and scroll store until they merge: a rAF loop that sleeps
// when every frame fn returns falsy, P from scrollY over a 120vh / 100vh pin, and the travel
// state from section tops with the contract's TRAVEL windows (seam 2).
import { pauseBus } from '../state/pause'
import { SECTIONS, type SectionId } from '../state/sections'
import type { Tick } from './engine/input'
import type { Driver } from './driver'

/** seam 2 TRAVEL: [top(to) − vh, top(to) − 0.3vh]; cybot>contact [top − 0.6vh, top + 0.4vh]. A
 *  window never ends past the last scroll position, or its stop could never be reached. */
export function travelAt(y: number, vh: number, tops: readonly { id: SectionId; top: number }[], maxY = Infinity): Pick<Tick, 'from' | 'to' | 't'> {
  let at: SectionId = 'top'
  for (let i = 1; i < tops.length; i++) {
    const a = tops[i - 1]
    const b = tops[i]
    const [w0, e1] = b.id === 'contact' && a.id === 'cybot' ? [b.top - 0.6 * vh, b.top + 0.4 * vh] : [b.top - vh, b.top - 0.3 * vh]
    const w1 = Math.max(w0 + 1, Math.min(e1, maxY))
    if (y < w0) break
    if (y < w1) return { from: a.id, to: b.id, t: (y - w0) / (w1 - w0) }
    at = b.id
  }
  return { from: at, to: at, t: 0 }
}

type Fn = (t: number, dt: number) => boolean | void

export function devDriver(): Driver {
  const fns = new Set<Fn>()
  let raf = 0
  let last = 0
  let forced: number | null = null
  let tops: { id: SectionId; top: number }[] | null = null
  let maxY = Infinity
  const measureTops = () => {
    maxY = document.documentElement.scrollHeight - innerHeight
    return (tops = SECTIONS.flatMap(({ id }) => {
      const el = document.getElementById(id)
      return el ? [{ id, top: el.getBoundingClientRect().top + scrollY }] : []
    }))
  }
  new ResizeObserver(() => (tops = null)).observe(document.body)
  const tick = (now: number) => {
    raf = 0
    // Like the real clock: frame fns never run while the Interrupt (or a hidden tab) pauses.
    if (pauseBus.isPaused()) {
      last = 0
      return
    }
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
  pauseBus.subscribe((paused) => {
    if (!paused) wake()
  })
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
    tick: () => {
      const y = scrollY
      const heroP = forced ?? Math.min(1, Math.max(0, y / (innerHeight * (innerWidth < 768 ? 1 : 1.2))))
      const tt = tops ?? measureTops()
      return { y, heroP, ...travelAt(y, innerHeight, tt, maxY) }
    },
  }
}
