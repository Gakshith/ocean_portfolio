// Lazy chunk A (tiny): the canvas, the poster under it, and the ADV_IND loader in the plate. It
// imports the three.js engine (chunk B) and reports readiness to the motion store. All of its
// CSS ships with it (R-P2-01).
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { setHas3D } from '../state/motion'
import { ADV_LINES, ADV_PHONE, CONNECT_SHORT, GAVE_UP, connectLine } from './adv'
import type { Engine, EngineOptions } from './engine/engine'
import type { Driver } from './driver'
import { measureLayout, watchLayout } from './layout'
import bake from '../bake/bake.json'
import './gl.css'

type Phase = 'loading' | 'live' | 'frozen' | 'failed'

const ARM_MS = 300
const GIVE_UP_MS = 8000
const COLLAPSE_MS = 1200
const RESTORE_MS = 3000
// One ADV line, advancing in place, on phones and on desktops under 800 px tall: there the
// bottom-aligned plate has no room above it for the full log, which pushed it under the fixed
// die-map (1280×720: 77 px). Mirrors the media queries in gl.css.
const ONE_LINE = '(max-width: 767px), (max-height: 799px)'

const loadEngine = () => import('./engine/engine')

/** `load` is the engine chunk; tests pass a fake one. */
export function Stage({ t0, driver, load = loadEngine }: { t0: number; driver: Driver; load?: () => Promise<{ createEngine: (o: EngineOptions) => Promise<Engine> }> }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [phase, setPhase] = useState<Phase>('loading')
  const [milestone, setMilestone] = useState(0)
  const [armed, setArmed] = useState(false)
  const [connect, setConnect] = useState<null | { ms: number; collapsed: boolean }>(null)
  const [gaveUp, setGaveUp] = useState(false)
  const [slot] = useState(() => document.querySelector('[data-adv-slot]'))
  const [oneLine, setOneLine] = useState(() => matchMedia(ONE_LINE).matches)
  const [hop, setHop] = useState(0)

  useEffect(() => {
    const mq = matchMedia(ONE_LINE)
    const sync = () => setOneLine(mq.matches)
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  // html[data-gl] scopes every rule in gl.css.
  useEffect(() => {
    document.documentElement.dataset.gl = phase
  }, [phase])
  // Unmount only clears the scope. It must not report setHas3D(false): StrictMode runs this
  // cleanup once on mount, and false means unrecoverable failure (R-P2-10). The motion store
  // resets has3D itself when the path stops; failure is reported only below.
  useEffect(
    () => () => {
      delete document.documentElement.dataset.gl
    },
    [],
  )

  // ADV_IND only if 3D isn't ready by 300ms; the channel dots hop while it waits.
  useEffect(() => {
    const arm = setTimeout(() => setArmed(true), Math.max(0, ARM_MS - (performance.now() - t0)))
    return () => clearTimeout(arm)
  }, [t0])
  useEffect(() => {
    if (!armed || connect || gaveUp) return
    const id = setInterval(() => setHop((h) => h + 1), 340)
    return () => clearInterval(id)
  }, [armed, connect, gaveUp])

  useEffect(() => {
    let engine: Engine | null = null
    let alive = true
    let firstSeen = false
    let lostAt = 0
    const qs = new URLSearchParams(location.search)
    // The engine sees the page only through these: a tick per clock frame, a layout on change.
    let detach = () => {}
    const attach = (e: Engine) => {
      const unFrame = driver.add((now, dt) => e.frame(now, dt, driver.tick()))
      const unWatch = watchLayout(() => e.setLayout(measureLayout(driver.tick().heroP)))
      detach = () => {
        unFrame()
        unWatch()
        detach = () => {}
      }
    }
    const drop = () => {
      detach()
      engine?.dispose()
      engine = null
    }
    const giveUp = setTimeout(() => {
      if (firstSeen || !alive) return
      setGaveUp(true)
      setPhase('failed')
      drop()
    }, Math.max(0, GIVE_UP_MS - (performance.now() - t0)))

    const start = async (): Promise<void> => {
      const { createEngine } = await load()
      if (!alive || !canvas.current) return
      const tick = driver.tick()
      const opts: EngineOptions = {
        canvas: canvas.current,
        layout: measureLayout(tick.heroP),
        tick,
        invalidate: driver.invalidate,
        t0,
        coarse: matchMedia('(pointer: coarse)').matches,
        tier: (qs.get('tier') as EngineOptions['tier']) ?? 'auto',
        forceWebGL: qs.get('gl') === 'webgl2',
        hooks: {
          milestone: (k) => alive && setMilestone((m) => Math.max(m, k)),
          firstFrame: (ms) => {
            if (!alive) return
            firstSeen = true
            performance.mark('gl:live')
            lostAt = 0
            setConnect({ ms, collapsed: false })
            setTimeout(() => alive && setConnect((c) => (c ? { ...c, collapsed: true } : c)), COLLAPSE_MS)
            setPhase('live')
            setHas3D(true)
          },
          freeze: () => alive && setPhase('frozen'),
          lost: () => {
            // Device or context lost: rebuild from scratch (the first frame re-renders the RTs
            // deterministically). Unrecoverable after 3s → the Still path.
            if (!alive) return
            lostAt ||= performance.now()
            drop()
            const retry = () => {
              if (!alive) return
              if (performance.now() - lostAt > RESTORE_MS) {
                setPhase('failed')
                setHas3D(false)
                return
              }
              start().catch(() => setTimeout(retry, 500))
            }
            setTimeout(retry, 250)
          },
        },
      }
      engine = await createEngine(opts)
      if (!alive) {
        engine.dispose()
        return
      }
      attach(engine)
      if (import.meta.env.DEV || qs.has('gltest')) (window as unknown as { __gl: unknown }).__gl = engine.api
    }
    start().catch((e) => {
      if (!alive) return
      console.warn('[gl] 3D unavailable:', e)
      setGaveUp(true)
      setPhase('failed')
      setHas3D(false)
    })
    return () => {
      alive = false
      clearTimeout(giveUp)
      drop()
    }
  }, [t0, driver, load])

  const lines: string[] = oneLine ? [ADV_PHONE[Math.max(0, milestone - 1)]] : ADV_LINES.slice(0, Math.max(1, milestone))
  const adv: string[] = gaveUp
    ? [GAVE_UP]
    : connect
      ? connect.collapsed
        ? [CONNECT_SHORT]
        : oneLine
          ? [connectLine(connect.ms)]
          : [...lines, connectLine(connect.ms)]
      : armed
        ? lines
        : []
  const waiting = armed && !connect && !gaveUp

  return (
    <>
      <img className="gl-poster" src={`${import.meta.env.BASE_URL}${bake.stills.poster}`} alt="" aria-hidden="true" decoding="async" onError={(e) => (e.currentTarget.hidden = true)} />
      <canvas ref={canvas} className="gl-canvas" aria-hidden="true" />
      {slot &&
        adv.length > 0 &&
        createPortal(
          <div className="gl-adv">
            {adv.map((line, i) => (
              <div key={i} className={i === 0 && !oneLine && line === ADV_LINES[0] ? 'gl-adv-ch' : undefined}>
                {i === 0 && !oneLine && line === ADV_LINES[0] ? (
                  <>
                    ADV_IND ch{' '}
                    {[37, 38, 39].map((c, k) => (
                      <span key={c} className="gl-ch" data-on={waiting && hop % 3 === k ? '' : undefined}>
                        {c}
                      </span>
                    ))}
                  </>
                ) : (
                  line
                )}
              </div>
            ))}
          </div>,
          slot,
        )}
    </>
  )
}
