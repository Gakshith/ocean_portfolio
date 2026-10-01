// The lazy scroll engine (R-P2-12): GSAP core's ticker as the one clock, and Lenis on fine
// pointers. Loaded after first paint, only while motion is live (!calm); under calm (reduced
// motion or the user's Still) it is never imported, so the page keeps native scroll.
//
// Each tick: Lenis.raf → the scroll store → frame fns (clock.ts). The clock sleeps the ticker
// (no rAF at all) when nothing needs another frame, and wakes on input, scroll or resize.
import gsap from 'gsap'
import Lenis from 'lenis'
import { setScroller } from '../state/jump'
import { pauseBus, registerContextSaver } from '../state/pause'
import { attachDriver, runTick, wakeClock, type Driver } from './clock'
import { dwellStart, getLayout, invalidateLayout, updateScroll } from './scroll'

gsap.ticker.lagSmoothing(0)

let lenis: Lenis | null = null
let running = false
let lastY = -1
const offs: (() => void)[] = []

const tweensActive = () => gsap.globalTimeline.getChildren(true, true, false).some((a) => a.isActive())
const tick = (time: number, deltaMs: number) => runTick(time * 1000, deltaMs)

const driver: Driver = {
  wake() {
    gsap.ticker.add(tick)
  },
  sleep() {
    gsap.ticker.remove(tick)
    // GSAP wakes its own ticker for any new tween; with none running, stop the rAF now rather
    // than after its 120-frame autoSleep.
    if (!tweensActive()) gsap.ticker.sleep()
  },
}

/** Runs first in every tick. True while something still needs frames. */
function preStep(timeMs: number): boolean {
  let easing = false
  if (lenis) {
    lenis.raf(timeMs)
    easing = !!lenis.isScrolling
  }
  const y = window.scrollY
  const moved = y !== lastY
  lastY = y
  updateScroll(y)
  return easing || moved || tweensActive()
}

/** Lenis only where it helps: a fine pointer (mouse, trackpad). Touch keeps native scroll. */
export function wantsLenis(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(pointer: fine)').matches
}

export const isRunning = (): boolean => running
export const getLenis = (): Lenis | null => lenis

export function start(): void {
  if (running) return
  running = true
  if (wantsLenis()) {
    lenis = new Lenis({ autoRaf: false, lerp: 0.1, smoothWheel: true, syncTouch: false, anchors: false })
    // Wheel input starts Lenis easing, which needs frames: wake the clock in the same event.
    offs.push(lenis.on('virtual-scroll', () => wakeClock()))
  }
  attachDriver(driver, preStep, () => pauseBus.isPaused())
  const wake = () => wakeClock()
  const resized = () => {
    invalidateLayout()
    lenis?.resize()
    wakeClock()
  }
  for (const ev of ['scroll', 'wheel', 'touchstart', 'keydown'] as const) {
    window.addEventListener(ev, wake, { passive: true })
    offs.push(() => window.removeEventListener(ev, wake))
  }
  window.addEventListener('resize', resized)
  offs.push(() => window.removeEventListener('resize', resized))
  // The Surface Interrupt pauses the page: Lenis stops with it, and both resume in place.
  offs.push(
    pauseBus.subscribe((paused, reasons) => {
      if (paused && reasons.has('interrupt')) lenis?.stop()
      else if (!paused) {
        lenis?.start()
        wakeClock()
      }
    }),
  )
  // The Interrupt restores scrollY natively; Lenis must adopt it or it would ease back.
  offs.push(registerContextSaver({ save() {}, restore: () => syncScroll() }))
  setScroller({ jump: (id) => jump(dwellStart(id, getLayout())), sync: syncScroll })
  wakeClock()
}

export function stop(): void {
  if (!running) return
  running = false
  setScroller(null)
  for (const off of offs.splice(0)) off()
  lenis?.destroy()
  lenis = null
  gsap.ticker.remove(tick)
  attachDriver(null, null)
}

/** Put Lenis (and the store) where the window already is: after a native scroll or a pin change. */
export function syncScroll(): void {
  invalidateLayout()
  lenis?.scrollTo(window.scrollY, { immediate: true, force: true })
  wakeClock()
}

function jump(y: number): void {
  if (lenis) lenis.scrollTo(y, { immediate: true, force: true })
  else window.scrollTo({ top: y, behavior: 'instant' })
  updateScroll(window.scrollY)
  wakeClock()
}
