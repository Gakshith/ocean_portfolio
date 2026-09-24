import { describe, expect, it, vi } from 'vitest'

describe('pause bus', () => {
  it('emits synchronously per reason change and resumes when all clear', async () => {
    vi.resetModules()
    const { pauseBus, setPauseReason } = await import('../pause')
    const calls: [boolean, string[]][] = []
    const off = pauseBus.subscribe((p, r) => calls.push([p, [...r]]))
    setPauseReason('interrupt', true)
    expect(pauseBus.isPaused()).toBe(true)
    setPauseReason('interrupt', true) // no change, no emit
    setPauseReason('hidden', true)
    setPauseReason('interrupt', false)
    setPauseReason('hidden', false)
    expect(calls).toEqual([
      [true, ['interrupt']],
      [true, ['interrupt', 'hidden']],
      [true, ['hidden']],
      [false, []],
    ])
    off()
  })

  it('pauses while the tab is hidden', async () => {
    vi.resetModules()
    const { pauseBus } = await import('../pause')
    const vis = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    expect(pauseBus.isPaused()).toBe(true) // the first call wires the listener and syncs
    vis.mockReturnValue('visible')
    document.dispatchEvent(new Event('visibilitychange'))
    expect(pauseBus.isPaused()).toBe(false)
    vis.mockRestore()
  })
})
