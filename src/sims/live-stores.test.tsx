// Against chrome_agent's real stores (no mocks): the Interrupt and the Still toggle stop autoplay.
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { motionStore } from '../state/motion'
import { setPauseReason } from '../state/pause'
import { BubbleLock, Hop } from '.'

class SeenIO {
  cb: IntersectionObserverCallback
  constructor(cb: IntersectionObserverCallback) {
    this.cb = cb
  }
  observe(el: Element) {
    this.cb([{ intersectionRatio: 1, target: el } as unknown as IntersectionObserverEntry], this as never)
  }
  disconnect() {}
  unobserve() {}
  takeRecords() {
    return []
  }
}

const tick = (ms: number) => act(async () => void vi.advanceTimersByTime(ms))

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('IntersectionObserver', SeenIO)
})
afterEach(() => {
  act(() => {
    setPauseReason('interrupt', false)
    motionStore.get().setStill(false)
  })
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('real pause bus and motion store', () => {
  it('Hop stops while the Interrupt is open and resumes in place when it closes', async () => {
    const { container } = render(<Hop headingId="x" />)
    const formula = () => container.querySelector('.sim-hop__formula')!.textContent
    await tick(900)
    const running = formula()
    act(() => setPauseReason('interrupt', true))
    const frozen = formula()
    expect(frozen).toBe(running)
    await tick(2000)
    expect(formula()).toBe(frozen)
    act(() => setPauseReason('interrupt', false))
    await tick(450)
    expect(formula()).not.toBe(frozen)
    // resumed from where it stopped: the next event number follows on
    const n = (s: string | null) => Number(/event (\d+)/.exec(s ?? '')![1])
    expect(n(formula())).toBe(n(frozen) + 1)
  })

  it('Hop stops on the Still toggle, hides Pause, and restarts when Still is turned off', async () => {
    const { container } = render(<Hop headingId="x" />)
    const formula = () => container.querySelector('.sim-hop__formula')!.textContent
    act(() => motionStore.get().setStill(true))
    expect(document.documentElement.dataset.calm).toBe('true')
    const frozen = formula()
    await tick(2000)
    expect(formula()).toBe(frozen)
    expect(screen.queryByRole('button', { name: /Pause/ })).toBeNull()
    act(() => motionStore.get().setStill(false))
    await tick(450)
    expect(formula()).not.toBe(frozen)
  })

  it('Bubble Lock Play holds on the Interrupt', async () => {
    const { container } = render(<BubbleLock headingId="x" />)
    const cycle = () => container.querySelector('.sim-bl__head strong')!.textContent
    act(() => screen.getByRole('button', { name: /Play/ }).click())
    await tick(1450) // two 700ms cycles in one batch
    expect(cycle()).toBe('Cycle 2')
    act(() => setPauseReason('interrupt', true))
    await tick(2100)
    expect(cycle()).toBe('Cycle 2')
    act(() => setPauseReason('interrupt', false))
    await tick(700)
    expect(cycle()).toBe('Cycle 3')
  })
})
