import { StrictMode } from 'react'
import { act, cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type { Driver, Engine, EngineOptions } from './engine/engine'

const setHas3D = vi.fn()
vi.mock('../state/motion', () => ({ setHas3D: (ready: boolean) => setHas3D(ready) }))

let init: (opts: EngineOptions) => Promise<unknown>
const load = async () => ({ createEngine: (opts: EngineOptions) => init(opts) as Promise<Engine> })

const { Stage } = await import('./stage')
const driver = { add: () => () => {}, invalidate: () => {}, heroP: () => 0 } as unknown as Driver
const settle = () => act(() => new Promise((r) => setTimeout(r, 20)))

beforeAll(() => {
  window.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia
})
afterEach(() => {
  cleanup()
  setHas3D.mockClear()
})

describe('Stage lifecycle (R-P2-10)', () => {
  it('StrictMode mount never reports 3D as failed, and reports it ready on the first frame', async () => {
    init = async (opts) => {
      setTimeout(() => opts.hooks.firstFrame(42), 0)
      return { api: {}, dispose: () => {} }
    }
    render(
      <StrictMode>
        <Stage t0={performance.now()} driver={driver} load={load} />
      </StrictMode>,
    )
    await waitFor(() => expect(document.documentElement.dataset.gl).toBe('live'))
    expect(setHas3D).not.toHaveBeenCalledWith(false)
    expect(setHas3D).toHaveBeenLastCalledWith(true)
  })

  it('unmount clears the scope without reporting a failure', async () => {
    init = () => new Promise(() => {})
    const { unmount } = render(<Stage t0={performance.now()} driver={driver} load={load} />)
    await settle()
    unmount()
    expect(document.documentElement.dataset.gl).toBeUndefined()
    expect(setHas3D).not.toHaveBeenCalled()
  })

  it('a renderer that cannot start still reports 3D off', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    init = () => Promise.reject(new Error('no adapter'))
    render(
      <StrictMode>
        <Stage t0={performance.now()} driver={driver} load={load} />
      </StrictMode>,
    )
    await waitFor(() => expect(document.documentElement.dataset.gl).toBe('failed'))
    expect(setHas3D).toHaveBeenCalledWith(false)
  })
})
