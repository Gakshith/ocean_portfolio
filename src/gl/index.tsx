// The 3D mount (App's first child). Renders null on the server and on the first client render, so
// hydration matches the prerendered Still HTML. While motion.load3D is true it requests the stage
// chunk after first paint (requestIdleCallback, 300ms timeout); the stage requests three.js.
import { useEffect, useState, type ComponentType } from 'react'
import { useMotion } from '../state/motion'
import type { Driver } from './driver'

type StageProps = { t0: number; driver: Driver }
type Loaded = { Stage: ComponentType<StageProps>; driver: Driver; t0: number }

const idle = (fn: () => void) => {
  if (typeof requestIdleCallback === 'function') {
    const id = requestIdleCallback(fn, { timeout: 300 })
    return () => cancelIdleCallback(id)
  }
  const id = setTimeout(fn, 300)
  return () => clearTimeout(id)
}

// DEV only: `?gldev` runs the 3D on a local rAF shim until bake_agent's clock merges. Safe to read
// during render: the output is null until the chunk loads, so it can't change hydration.
const devOn = () => import.meta.env.DEV && typeof location !== 'undefined' && new URLSearchParams(location.search).has('gldev')

export function Gl3D() {
  const { load3D } = useMotion()
  const dev = devOn()
  const on = load3D || dev
  const [loaded, setLoaded] = useState<Loaded | null>(null)

  useEffect(() => {
    if (!on) return
    const t0 = performance.now()
    let cancelled = false
    const cancelIdle = idle(() => {
      performance.mark('gl:chunk')
      const driver = import.meta.env.DEV && dev ? import('./dev').then((m) => m.devDriver()) : import('./driver').then((m) => m.clockDriver)
      Promise.all([import('./stage'), driver]).then(([m, d]) => {
        if (!cancelled) setLoaded({ Stage: m.Stage, driver: d, t0 })
      })
    })
    return () => {
      cancelled = true
      cancelIdle()
      setLoaded(null)
    }
  }, [on, dev])

  if (!on || !loaded) return null
  const { Stage, driver, t0 } = loaded
  return <Stage t0={t0} driver={driver} />
}
