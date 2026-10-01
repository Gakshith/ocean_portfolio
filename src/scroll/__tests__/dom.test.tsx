// DOM integration: jumps through the engine land focus on the h2; the S1 pin compensates the scroll
// in the same commit without moving focus; the footer stays honest after a freeze (R-P2-17).
import { act, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockReducedMotion } from '../../state/__tests__/media'

beforeEach(() => {
  vi.resetModules()
  localStorage.clear()
  history.replaceState(null, '', '/')
  ;(window as unknown as { WebGL2RenderingContext: unknown }).WebGL2RenderingContext = function () {}
  mockReducedMotion(false)
  delete document.documentElement.dataset.gl
})
afterEach(() => {
  document.body.innerHTML = ''
})

async function live3D() {
  const m = await import('../../state/motion')
  act(() => {
    m.turnOn3D()
    m.setHas3D(true)
  })
  return m
}

describe('jumps', () => {
  it('with the 3D live, go through the engine to the dwell start, focus the h2 and fly the camera', async () => {
    const { jumpTo, onJump, setScroller } = await import('../../state/jump')
    await live3D()
    document.body.innerHTML = `<main id="main"><section id="top"><h1 id="top-title" tabindex="-1">A</h1></section>
      <section id="risc-v"><h2 id="risc-v-title" tabindex="-1">RISC-V</h2></section></main>`
    const jump = vi.fn()
    setScroller({ jump, sync: () => {} })
    const seen: unknown[] = []
    onJump((id, d) => seen.push([id, d]))
    jumpTo('risc-v')
    expect(jump).toHaveBeenCalledWith('risc-v')
    expect(document.activeElement?.id).toBe('risc-v-title')
    expect(seen).toEqual([['risc-v', { from: 'top', instant: false }]])
    setScroller(null)
  })

  it('in Still, cut natively (the engine only adopts the position) and say instant', async () => {
    const { jumpTo, onJump, setScroller } = await import('../../state/jump')
    document.body.innerHTML = `<main id="main"><section id="wisard"><h2 id="wisard-title" tabindex="-1">W</h2></section></main>`
    const jump = vi.fn()
    const sync = vi.fn()
    setScroller({ jump, sync })
    const seen: unknown[] = []
    onJump((_id, d) => seen.push(d))
    jumpTo('wisard')
    expect(jump).not.toHaveBeenCalled()
    expect(sync).toHaveBeenCalled()
    expect(document.activeElement?.id).toBe('wisard-title')
    expect(seen).toEqual([{ from: 'top', instant: true }])
    setScroller(null)
  })
})

describe('S1 pin', () => {
  it('mounts with load3D and compensates the scroll in the same commit, keeping focus', async () => {
    const { S1Hero } = await import('../../sections/S1Hero')
    const heights = new Map<string, number>()
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
      return heights.get(this.className.split(' ')[0]) ?? heights.get(this.id) ?? 0
    })
    heights.set('top', 900)
    heights.set('s1-track', 900)
    Object.defineProperty(window, 'scrollY', { value: 5000, configurable: true })
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    const { container } = render(<S1Hero />)
    const link = screen.getAllByRole('link')[0]
    link.focus()
    heights.set('s1-track', 900 + 1080) // what the pinned CSS height measures to
    const m = await import('../../state/motion')
    act(() => m.turnOn3D())
    expect(container.querySelector('.s1-track--pin')).not.toBeNull()
    expect(scrollTo).toHaveBeenCalledWith({ top: 5000 + 1080, behavior: 'instant' })
    expect(document.activeElement).toBe(link)
    // and back: the reader below S1 moves up by the same pin, still focused
    heights.set('s1-track', 900)
    act(() => m.motionStore.get().setStill(true))
    expect(container.querySelector('.s1-track--pin')).toBeNull()
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 5000 - 1080, behavior: 'instant' })
    expect(document.activeElement).toBe(link)
  })
})

describe('footer honesty (R-P2-17)', () => {
  it('claims live refraction only while the renderer draws live', async () => {
    const { Footer } = await import('../../sections/Footer')
    render(<Footer />)
    expect(document.body.textContent).toContain('This page shows that result as a still image')
    await live3D()
    expect(document.body.textContent).toContain('nothing is cross-faded')
    act(() => {
      document.documentElement.dataset.gl = 'frozen'
    })
    await waitFor(() => expect(document.body.textContent).toContain('rendered offline from a surface solved the same way'))
    expect(document.body.textContent).not.toContain('nothing is cross-faded')
  })

  it('offers Turn on 3D with its reason, or a plain line when it cannot be overridden', async () => {
    const { Footer } = await import('../../sections/Footer')
    render(<Footer />)
    expect(screen.getByRole('button', { name: /Turn on 3D/ }).textContent).toContain('not on by default yet')
  })

  it('under reduced motion, says why as a plain line, with no button to press', async () => {
    mockReducedMotion(true)
    const { Footer } = await import('../../sections/Footer')
    render(<Footer />)
    expect(screen.queryByRole('button', { name: /Turn on 3D/ })).toBeNull()
    expect(document.querySelector('.c-3d--line')?.textContent).toContain('reduced motion')
    expect(screen.getByRole('button', { name: 'Still' }).getAttribute('aria-pressed')).toBe('true')
  })
})
