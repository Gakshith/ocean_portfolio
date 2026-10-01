// The 3D intent (R-P2-03, R-P2-13): load3D, off3D and its reasons, ?3d=1, Turn on 3D, setHas3D.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { derive } from '../motion'
import { mockReducedMotion } from './media'

const base = {
  reducedMotion: false,
  storedStill: false,
  stored3D: false,
  url3D: false,
  capable: true,
  memoryHint: false,
  saveData: false,
  failed: false,
  ready: false,
}

describe('derive (DEFAULT_3D = false)', () => {
  it('keeps 3D off by default, with the reason, and leaves auto-motion on (calm false)', () => {
    expect(derive(base)).toMatchObject({ load3D: false, off3D: 'default-off', still: true, calm: false })
  })

  it('?3d=1 turns it on for the visit, over a stored Still choice', () => {
    expect(derive({ ...base, url3D: true, storedStill: true })).toMatchObject({ load3D: true, off3D: null, stillChosen: false })
  })

  it('never overrides reduced motion or a missing GPU', () => {
    expect(derive({ ...base, url3D: true, reducedMotion: true })).toMatchObject({ load3D: false, off3D: 'reduced-motion' })
    expect(derive({ ...base, url3D: true, capable: false })).toMatchObject({ load3D: false, off3D: 'no-gpu' })
  })

  it('an explicit Still beats a stored Turn on 3D and says so', () => {
    expect(derive({ ...base, stored3D: true, storedStill: true })).toMatchObject({ load3D: false, off3D: 'still-chosen', calm: true })
  })

  it('has3D only counts while load3D, and still flips with it', () => {
    expect(derive({ ...base, stored3D: true, ready: true })).toMatchObject({ has3D: true, still: false })
    expect(derive({ ...base, ready: true })).toMatchObject({ has3D: false, still: true })
  })
})

describe('motion store', () => {
  beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
    history.replaceState(null, '', '/')
    ;(window as unknown as { WebGL2RenderingContext: unknown }).WebGL2RenderingContext = function () {}
  })
  const fresh = () => import('../motion')

  it('Turn on 3D is stored and clears an explicit Still', async () => {
    mockReducedMotion(false)
    const m = await fresh()
    m.motionStore.get().setStill(true)
    m.turnOn3D()
    expect(m.motionStore.get()).toMatchObject({ load3D: true, stillChosen: false, off3D: null })
    expect(localStorage.getItem('ocean:3d')).toBe('1')
    expect(document.documentElement.dataset.load3d).toBe('true')
  })

  it('setHas3D(true) shows 3D; setHas3D(false) is a failure that turns the path off for the visit', async () => {
    mockReducedMotion(false)
    const m = await fresh()
    m.turnOn3D()
    m.setHas3D(true)
    expect(m.motionStore.get()).toMatchObject({ has3D: true, still: false })
    m.setHas3D(false)
    expect(m.motionStore.get()).toMatchObject({ has3D: false, load3D: false, off3D: 'no-gpu', still: true })
  })

  it('reduced motion switches the 3D path off live, and back', async () => {
    const mq = mockReducedMotion(false)
    const m = await fresh()
    m.turnOn3D()
    m.setHas3D(true)
    mq.set(true)
    expect(m.motionStore.get()).toMatchObject({ load3D: false, has3D: false, off3D: 'reduced-motion' })
    mq.set(false)
    // the renderer must report its first frame again: a restarted path is not ready yet
    expect(m.motionStore.get()).toMatchObject({ load3D: true, has3D: false })
  })

  it('reads ?3d=1 from the URL', async () => {
    mockReducedMotion(false)
    history.replaceState(null, '', '/?3d=1')
    const m = await fresh()
    expect(m.motionStore.get().load3D).toBe(true)
  })
})
