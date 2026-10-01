// The scroll engine (R-P2-12): one clock, idle sleep, Lenis only on fine pointers, live switching
// with reduced motion, and nothing loaded under calm. GSAP and Lenis are stubbed: what is under
// test is the wiring, not their internals.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const order: string[] = []
const lenises: Record<string, ReturnType<typeof vi.fn> | unknown>[] = []

vi.mock('gsap', () => {
  const listeners = new Set<(t: number, d: number) => void>()
  const ticker = {
    add: vi.fn((fn: (t: number, d: number) => void) => listeners.add(fn)),
    remove: vi.fn((fn: (t: number, d: number) => void) => listeners.delete(fn)),
    sleep: vi.fn(),
    lagSmoothing: vi.fn(),
    fire(t: number) {
      for (const fn of [...listeners]) fn(t, 16)
    },
    get size() {
      return listeners.size
    },
  }
  return { default: { ticker, globalTimeline: { getChildren: () => [] } } }
})

vi.mock('lenis', () => ({
  default: vi.fn(function (this: Record<string, unknown>) {
    this.raf = vi.fn(() => order.push('lenis.raf'))
    this.isScrolling = false
    this.on = vi.fn(() => () => {})
    this.destroy = vi.fn()
    this.scrollTo = vi.fn()
    this.stop = vi.fn()
    this.start = vi.fn()
    this.resize = vi.fn()
    lenises.push(this)
  }),
}))

function mockMedia({ reduced = false, fine = true } = {}) {
  const state = { reduced, fine }
  const subs = new Set<(e: { matches: boolean }) => void>()
  window.matchMedia = ((q: string) => ({
    get matches() {
      return q.includes('reduced-motion') ? state.reduced : q.includes('pointer: fine') ? state.fine : false
    },
    media: q,
    addEventListener: (_: string, fn: (e: { matches: boolean }) => void) => q.includes('reduced-motion') && subs.add(fn),
    removeEventListener: (_: string, fn: (e: { matches: boolean }) => void) => subs.delete(fn),
  })) as unknown as typeof window.matchMedia
  return {
    setReduced(v: boolean) {
      state.reduced = v
      for (const fn of subs) fn({ matches: v })
    },
  }
}

const setY = (y: number) => Object.defineProperty(window, 'scrollY', { value: y, configurable: true })

beforeEach(() => {
  vi.resetModules()
  order.length = 0
  lenises.length = 0
  localStorage.clear()
  setY(0)
})
afterEach(async () => {
  const e = await import('../engine')
  e.stop()
})

async function gsapTicker() {
  return (await import('gsap')).default.ticker as unknown as {
    add: ReturnType<typeof vi.fn>
    remove: ReturnType<typeof vi.fn>
    sleep: ReturnType<typeof vi.fn>
    fire(t: number): void
    size: number
  }
}

describe('one clock', () => {
  it('drives Lenis, then the scroll store, then the frame fns, all from gsap.ticker', async () => {
    mockMedia()
    const engine = await import('../engine')
    const { clock } = await import('../clock')
    const { scrollStore } = await import('../scroll')
    engine.start()
    scrollStore.subscribe(() => order.push('store'))
    clock.add(() => {
      order.push('frame')
      return true
    })
    const ticker = await gsapTicker()
    expect(ticker.add).toHaveBeenCalled()
    setY(120)
    ticker.fire(1)
    expect(order).toEqual(['lenis.raf', 'store', 'frame'])
  })

  it('sleeps (no rAF) when nothing needs a frame, and wakes on input', async () => {
    mockMedia()
    const engine = await import('../engine')
    const { clock } = await import('../clock')
    engine.start()
    clock.add(() => false)
    const ticker = await gsapTicker()
    ticker.fire(1) // y moved from the store's -1 sentinel: one more frame
    ticker.fire(2) // nothing moved, nothing asked: sleep
    expect(ticker.remove).toHaveBeenCalled()
    expect(ticker.sleep).toHaveBeenCalled()
    expect(ticker.size).toBe(0)
    window.dispatchEvent(new Event('wheel'))
    expect(ticker.size).toBe(1)
  })

  it('stops calling frame fns while the page is paused, and resumes in place', async () => {
    mockMedia()
    const engine = await import('../engine')
    const { clock } = await import('../clock')
    const { setPauseReason } = await import('../../state/pause')
    engine.start()
    let n = 0
    clock.add(() => {
      n++
      return true
    })
    const ticker = await gsapTicker()
    ticker.fire(1)
    setPauseReason('interrupt', true)
    expect((lenises[0].stop as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1)
    ticker.fire(2)
    expect(n).toBe(1)
    setPauseReason('interrupt', false)
    ticker.fire(3)
    expect(n).toBe(2)
  })
})

describe('Lenis', () => {
  it('runs on a fine pointer', async () => {
    mockMedia({ fine: true })
    ;(await import('../engine')).start()
    expect(lenises).toHaveLength(1)
  })

  it('stays off on a coarse pointer (touch keeps native scroll)', async () => {
    mockMedia({ fine: false })
    const engine = await import('../engine')
    engine.start()
    expect(lenises).toHaveLength(0)
    expect(engine.getLenis()).toBeNull()
  })
})

describe('bootScroll', () => {
  const idle = () => new Promise((r) => setTimeout(r, 350))

  it('loads nothing under reduced motion, and switches live when it changes', async () => {
    const media = mockMedia({ reduced: true })
    const { bootScroll } = await import('../index')
    const stop = bootScroll()
    await idle()
    expect(lenises).toHaveLength(0)
    media.setReduced(false)
    await idle()
    expect(lenises).toHaveLength(1)
    media.setReduced(true)
    await Promise.resolve()
    await Promise.resolve()
    expect((lenises[0].destroy as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1)
    stop()
  })

  it("loads nothing when the user chose Still", async () => {
    mockMedia()
    localStorage.setItem('ocean:still', '1')
    const { bootScroll } = await import('../index')
    const stop = bootScroll()
    await idle()
    expect(lenises).toHaveLength(0)
    stop()
  })
})
