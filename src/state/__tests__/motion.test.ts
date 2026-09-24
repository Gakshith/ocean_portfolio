import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockReducedMotion } from './media'

async function fresh() {
  vi.resetModules()
  return import('../motion')
}

describe('motion store', () => {
  beforeEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.still
  })

  it('reads the live reduced-motion query and reflects it on <html>', async () => {
    const mq = mockReducedMotion(false)
    const { motionStore } = await fresh()
    expect(motionStore.get()).toMatchObject({ reducedMotion: false, calm: false, still: true })
    expect(document.documentElement.dataset.calm).toBe('false')

    const seen: boolean[] = []
    motionStore.subscribe((m) => seen.push(m.calm))
    mq.set(true)
    expect(motionStore.get()).toMatchObject({ reducedMotion: true, calm: true })
    expect(document.documentElement.dataset.reducedMotion).toBe('true')
    mq.set(false)
    expect(seen).toEqual([true, false])
  })

  it('persists the Still choice and makes it calm', async () => {
    mockReducedMotion(false)
    let { motionStore } = await fresh()
    motionStore.get().setStill(true)
    expect(motionStore.get()).toMatchObject({ stillChosen: true, calm: true, still: true })
    expect(localStorage.getItem('ocean:still')).toBe('1')
    ;({ motionStore } = await fresh())
    expect(motionStore.get().stillChosen).toBe(true)
  })

  it('survives blocked storage', async () => {
    mockReducedMotion(false)
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const { motionStore } = await fresh()
    expect(motionStore.get().stillChosen).toBe(false)
    spy.mockRestore()
  })
})
