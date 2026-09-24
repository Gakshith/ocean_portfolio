import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BubbleLock, CybotStill, Hop, TidePool } from '.'

// Drive chrome_agent's hooks from the test.
const state = vi.hoisted(() => ({ calm: false, paused: false }))
vi.mock('../state/motion', () => ({
  useMotion: () => ({ reducedMotion: false, stillChosen: state.calm, still: true, calm: state.calm, setStill: () => {} }),
}))
vi.mock('../state/pause', () => ({ usePaused: () => state.paused }))

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

beforeEach(() => {
  state.calm = false
  state.paused = false
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const SIMS = { Hop, BubbleLock, TidePool, CybotStill }

describe('SSR', () => {
  for (const [name, C] of Object.entries(SIMS)) {
    it(`${name} hydrates onto its server HTML without a mismatch`, async () => {
      const html = renderToString(<C headingId="t-title" />)
      expect(html.length).toBeGreaterThan(100)
      const el = document.createElement('div')
      el.innerHTML = html
      document.body.append(el)
      const errors: unknown[] = []
      const spy = vi.spyOn(console, 'error').mockImplementation((...a) => errors.push(a))
      await act(async () => {
        hydrateRoot(el, <C headingId="t-title" />, { onRecoverableError: (e) => errors.push(e) })
      })
      spy.mockRestore()
      expect(errors).toEqual([])
      el.remove()
    })
  }
})

describe('Hop', () => {
  it('renders the rail, twins and the illustrative-die caption', () => {
    render(<Hop headingId="x" />)
    expect(screen.getByRole('heading', { name: 'Try it: Hop' })).toBeTruthy()
    expect(screen.getByText('running in your browser')).toBeTruthy()
    expect(screen.getByText(/An illustrative die/)).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Channel map' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Last 8 hops' })).toBeTruthy()
    const log = screen.getByRole('heading', { name: 'Last 8 hops' }).parentElement!
    expect(within(log).getAllByRole('listitem')).toHaveLength(8)
  })

  it('makes the chip grid one tab stop with arrows, stages with Space and sends LL_CHANNEL_MAP_IND', async () => {
    const user = userEvent.setup()
    const { container } = render(<Hop headingId="x" />)
    const grid = container.querySelector('[data-no-shortcuts]')!
    const chips = within(grid as HTMLElement).getAllByRole('button')
    expect(chips).toHaveLength(37)
    expect(chips.filter((c) => c.tabIndex === 0)).toHaveLength(1)
    chips[0].focus()
    await user.keyboard('{ArrowRight}')
    expect(document.activeElement).toBe(chips[1])
    await user.keyboard(' ')
    expect(chips[1].getAttribute('aria-pressed')).toBe('true')
    expect(chips[1].getAttribute('aria-label')).toContain('pending')
    await user.click(screen.getByRole('button', { name: 'Send map update' }))
    expect(screen.getByText(/LL_CHANNEL_MAP_IND · instant = event 13 · in 6/)).toBeTruthy()
    // a second update waits for the instant
    await user.click(chips[2])
    expect(screen.getAllByText('One channel map update at a time: waiting for the instant.').length).toBeGreaterThan(0)
  })

  it('announces only user actions and the instant, never autoplay hops', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('IntersectionObserver', SeenIO)
    const { container } = render(<Hop headingId="x" />)
    const live = container.querySelector('[aria-live="polite"]')!
    const formula = () => container.querySelector('.sim-hop__formula')!.textContent
    const before = formula()
    await act(async () => {
      vi.advanceTimersByTime(1250) // ~3 events at 2.5/s
    })
    expect(formula()).not.toBe(before)
    expect(live.textContent).toBe('')
  })

  it('does not autoplay when calm, and offers Step instead of Pause', async () => {
    state.calm = true
    vi.useFakeTimers()
    vi.stubGlobal('IntersectionObserver', SeenIO)
    const { container } = render(<Hop headingId="x" />)
    const formula = () => container.querySelector('.sim-hop__formula')!.textContent
    const before = formula()
    await act(async () => {
      vi.advanceTimersByTime(2000)
    })
    expect(formula()).toBe(before)
    expect(screen.queryByRole('button', { name: /Pause/ })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /Step/ }))
    expect(formula()).not.toBe(before)
  })

  it('stops autoplay while the pause bus is paused', async () => {
    state.paused = true
    vi.useFakeTimers()
    vi.stubGlobal('IntersectionObserver', SeenIO)
    const { container } = render(<Hop headingId="x" />)
    const before = container.querySelector('.sim-hop__formula')!.textContent
    await act(async () => {
      vi.advanceTimersByTime(2000)
    })
    expect(container.querySelector('.sim-hop__formula')!.textContent).toBe(before)
  })
})

describe('Bubble Lock', () => {
  it('starts at cycle 0 and shows the load-use bubble at cycle 4, the forward at cycle 5', async () => {
    const user = userEvent.setup()
    const { container } = render(<BubbleLock headingId="x" />)
    const step = screen.getByRole('button', { name: /Step/ })
    const ex = () => container.querySelector('[data-stage="EX"]')!.textContent
    expect(container.querySelector('.sim-bl__head')!.textContent).toContain('Cycle 0')
    for (let i = 0; i < 4; i++) await user.click(step)
    expect(ex()).toContain('bubble')
    expect(screen.getByText(/one bubble enters EX, even with forwarding/)).toBeTruthy()
    await user.click(step)
    expect(ex()).toContain('add x6,x5,x2')
    expect(container.querySelector('.sim-bl__fwdlabel')!.textContent).toContain('forward MEM/WB → EX')
    const now = container.querySelectorAll('th.is-now')
    expect(now).toHaveLength(1)
    expect(now[0].textContent).toBe('5')
  })

  it('has scenario radios as one group, a forwarding switch, and a labelled scroll region', async () => {
    const user = userEvent.setup()
    render(<BubbleLock headingId="x" />)
    const radios = screen.getAllByRole('radio')
    expect(new Set(radios.map((r) => (r as HTMLInputElement).name)).size).toBe(1)
    const sw = screen.getByRole('switch', { name: 'Forwarding' })
    expect(sw.getAttribute('aria-checked')).toBe('true')
    await user.click(sw)
    expect(sw.getAttribute('aria-checked')).toBe('false')
    expect(screen.getByRole('region', { name: 'Cycle table' }).tabIndex).toBe(0)
    // forwarding off: add stalls twice in ID (sub then waits twice more for add)
    const addRow = screen.getByRole('rowheader', { name: 'add x6,x5,x2' }).parentElement!
    expect(within(addRow).getAllByText('ID (stall)')).toHaveLength(2)
  })

  it('flushes 2 wrong-path instructions on a taken branch', async () => {
    const user = userEvent.setup()
    const { container } = render(<BubbleLock headingId="x" />)
    await user.click(screen.getByRole('radio', { name: 'Taken branch' }))
    const step = screen.getByRole('button', { name: /Step/ })
    for (let i = 0; i < 4; i++) await user.click(step)
    expect(container.querySelectorAll('.sim-bl__chambers .sim-bl__flushed')).toHaveLength(2)
    expect(screen.getAllByText('flushed').length).toBeGreaterThanOrEqual(2)
  })
})

describe('Tide Pool', () => {
  it('is a 16×16 grid with one tab stop; arrows move, Space inks, Shift+arrow paints', async () => {
    const user = userEvent.setup()
    render(<TidePool headingId="x" />)
    const grid = screen.getByRole('grid', { name: /Tide pool/ })
    expect(grid.hasAttribute('data-no-shortcuts')).toBe(true)
    expect(grid.style.touchAction === '' || grid.style.touchAction === 'none').toBe(true)
    const cells = within(grid).getAllByRole('gridcell')
    expect(cells).toHaveLength(256)
    expect(cells.filter((c) => c.tabIndex === 0)).toHaveLength(1)
    cells[0].focus()
    await user.keyboard('{ArrowRight}{ArrowDown}')
    expect(document.activeElement).toBe(cells[17])
    await user.keyboard(' ')
    expect(cells[17].getAttribute('aria-label')).toMatch(/^Inked, row 2, column 2/)
    await user.keyboard('{Shift>}{ArrowRight}{ArrowRight}{/Shift}')
    expect(cells[18].getAttribute('aria-label')).toMatch(/^Inked/)
    expect(cells[19].getAttribute('aria-label')).toMatch(/^Inked/)
  })

  it('reads "Draw something" when empty and names a winner on a bundled sample', async () => {
    const user = userEvent.setup()
    render(<TidePool headingId="x" />)
    expect(screen.getByText('Draw something')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Try an example' }))
    expect(await screen.findByText('→ wave')).toBeTruthy()
    expect(screen.getByText(/^gap: \d+ RAMs \(wave minus/)).toBeTruthy()
  })

  it('says "Too close to call" with no winner when the lead is 2 RAMs or less', async () => {
    const user = userEvent.setup()
    const { container } = render(<TidePool headingId="x" />)
    const cells = within(screen.getByRole('grid')).getAllByRole('gridcell')
    // one inked cell: every class answers almost the same
    cells[0].focus()
    await user.keyboard(' ')
    const verdict = await screen.findByText(/^Too close to call: \d+ vs \d+$/)
    expect(verdict).toBeTruthy()
    expect(container.querySelector('.sim-tp__bars li.is-win')).toBeNull()
    expect(screen.getByText(/^gap: [0-2] RAMs?/)).toBeTruthy()
  })

  it('teaches a new class from the drawing, up to 6', async () => {
    const user = userEvent.setup()
    render(<TidePool headingId="x" />)
    await user.click(screen.getByRole('button', { name: 'Try an example' }))
    await user.type(screen.getByLabelText('Teach a new class'), 'kelp')
    await user.click(screen.getByRole('button', { name: 'Teach from this drawing' }))
    expect(screen.getByText('New class “kelp” taught from one drawing.')).toBeTruthy()
    expect(screen.getByText('4 of 6 classes')).toBeTruthy()
    expect(screen.getByText(/RAM used: 4 classes × 64 RAMs × 16 addresses = 4,096 bits/)).toBeTruthy()
  })
})

describe('CyBot still', () => {
  it('is a labelled figure with the honesty caption and a text legend', () => {
    render(<CybotStill headingId="x" />)
    expect(screen.getByText('Illustrative course, not a recording.')).toBeTruthy()
    expect(screen.getByRole('img').getAttribute('aria-label')).toMatch(/narrow forward cone of plus or minus 20 degrees/)
    expect(screen.getByText(/d = v·t\/2 · v ≈ 343 m\/s \(air\)/)).toBeTruthy()
    expect(screen.queryByText(/servo|sweep/i)).toBeNull()
  })
})
