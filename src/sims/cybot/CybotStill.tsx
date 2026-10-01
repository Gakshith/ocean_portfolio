import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'
import { stills } from '../../bake/stills'
import { clock } from '../../scroll/clock'
import { useMotion } from '../../state/motion'
import { TAG_PX, useUnitScale } from '../shared/hooks'
import type { SimProps } from '../types'
import { POSES, R_BOT, UART_FROM, V_SOUND, VIEW, bumps, irRays, pings } from './course'
import { scrubFrame, type ScrubFrame } from './scrub'
import './cybot.css'

// Everything is derived from the course geometry once, at module load (deterministic for SSR).
const PINGS = pings()
const IR = irRays()
const BUMPS = bumps()
const rad = (d: number) => (d * Math.PI) / 180
const fmt = (n: number, d: number) => n.toFixed(d)
const LAST = [...PINGS].reverse().find((p) => p.echo)!.echo!
const FULL = scrubFrame(1)
const END = POSES[POSES.length - 1]

// The SE-reef backdrop (R-P2-11): the baked die corner at the stage's left edge, placed so its
// UART pad sits exactly where the hairline starts. It spans 30 die units, i.e. 300 SVG units.
const base = import.meta.env.BASE_URL
const REEF_W = 300
const REEF_H = (REEF_W * stills.s6.h) / stills.s6.w
const PAD_X = 20
const PAD_HALF = 12 // a 2.4-die-unit pad at 10 SVG units per die unit
const reefStyle = {
  left: `${((PAD_X - stills.s6.pad.x * REEF_W) / VIEW.w) * 100}%`,
  top: `${((UART_FROM.y - stills.s6.pad.y * REEF_H) / VIEW.h) * 100}%`,
  width: `${(REEF_W / VIEW.w) * 100}%`,
  height: `${(REEF_H / VIEW.h) * 100}%`,
}
const reefSrcSet = stills.s6.srcset.map(([w, p]) => `${base}${p} ${w}w`).join(', ')
const UART_X0 = PAD_X + PAD_HALF
const UART_LEN = POSES[0].x - 8 - UART_X0

const subscribeNothing = () => () => {}
const useHydrated = () => useSyncExternalStore(subscribeNothing, () => true, () => false)

/** Scrub progress: how far the sticky stage has travelled through its track, read on the clock. */
function useScrub(on: boolean) {
  const track = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const [p, setP] = useState(1)
  useEffect(() => {
    if (!on) return // the static diagram ignores p
    const measure = () => {
      const t = track.current
      const st = stage.current
      if (!t || !st) return false
      const span = t.offsetHeight - st.offsetHeight
      const top = parseFloat(getComputedStyle(st).top) || 0
      const v = span > 0 ? Math.min(1, Math.max(0, (top - t.getBoundingClientRect().top) / span)) : 1
      setP(Math.round(v * 1000) / 1000)
      return false
    }
    return clock.add(measure)
  }, [on])
  return { track, stage, p }
}

/** S6: the echo sequence. A scroll scrub while motion is live (C-14); under calm (reduced motion
 *  or Still) and without JS, the static diagram, which is the scrub's last frame. */
export function CybotStill({ headingId }: SimProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const svg = useRef<SVGSVGElement>(null)
  const { calm } = useMotion()
  const scrub = useHydrated() && !calm
  const { track, stage, p } = useScrub(scrub)
  const f: ScrubFrame = scrub ? scrubFrame(p) : FULL
  // Labels render at --t-tag on screen, so their size in units follows the drawing's scale.
  const fs = TAG_PX / (useUnitScale(svg, VIEW.w) ?? 1)
  const narrow = fs > 24 // phone: "PING 3" becomes "3" (the legend names the cones)
  const cap = `${uid}-cap`
  const path = f.path.map((q, i) => `${i ? 'L' : 'M'}${q.x} ${q.y}`).join(' ')
  const echoes = PINGS.filter((q) => q.echo).length
  const summary = `Top-down diagram of an illustrative course: the robot takes ${PINGS.length} PING readings, each a narrow forward cone of plus or minus 20 degrees. ${echoes} of them return an echo from an obstacle; the first sees nothing. One short IR reading sees a wall close ahead, and one bump marks contact with an obstacle just beside it that no cone saw. A dashed line is the path it chose.`
  const R = f.robot
  const atEnd = R.x === END.x && R.y === END.y

  return (
    <figure className={scrub ? 'sim sim--cy sim-cy--scrub' : 'sim sim--cy'} aria-labelledby={`${headingId} ${cap}`}>
      <div ref={track} className="sim-cy__track">
        <div ref={stage} className="sim-cy__stage">
          <img
            className="sim-cy__reef"
            style={reefStyle}
            src={base + stills.s6.src}
            srcSet={reefSrcSet}
            sizes="30vw"
            width={stills.s6.w}
            height={stills.s6.h}
            loading="lazy"
            decoding="async"
            alt=""
            aria-hidden="true"
          />
          <svg ref={svg} className="sim-cy__svg" viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} fontSize={fs} role="img" aria-label={summary}>
            {/* UART line from the die's SE pad (the pad itself is the baked backdrop's) */}
            <text className="sim-cy__lbl" x={4} y={UART_FROM.y + PAD_HALF + 6 + fs} fill="var(--dim)">
              UART
            </text>
            <path
              d={`M${UART_X0} ${UART_FROM.y} H${POSES[0].x - 8}`}
              fill="none"
              stroke="var(--m5-al)"
              strokeWidth={1}
              opacity={0.7}
              strokeDasharray={UART_LEN}
              strokeDashoffset={UART_LEN * (1 - f.uart)}
            />

            {/* PING cones: forward only, ±20° */}
            {PINGS.map((p, k) => {
              const fill = f.cones[k].fill
              if (fill <= 0) return null
              const [apex] = p.cone
              return (
                <g key={p.n}>
                  <polygon
                    points={p.cone.map((q) => `${apex.x + (q.x - apex.x) * fill},${apex.y + (q.y - apex.y) * fill}`).join(' ')}
                    fill="var(--light)"
                    fillOpacity={0.05}
                    stroke="var(--light)"
                    strokeOpacity={0.28}
                    strokeWidth={1}
                  />
                  <text
                    className="sim-cy__lbl"
                    x={p.pose.x - R_BOT - 8}
                    y={p.pose.y - fs * 0.6}
                    fill="var(--sand)"
                    textAnchor="end"
                  >
                    {narrow ? p.n : `PING ${p.n}`}
                  </text>
                </g>
              )
            })}

            {/* the path it chose */}
            <path d={path} fill="none" stroke="var(--dim)" strokeWidth={1.5} strokeDasharray="7 6" />
            {PINGS.map((p, k) =>
              f.cones[k].fill > 0 ? <circle key={p.n} cx={p.pose.x} cy={p.pose.y} r={4} fill="var(--light)" /> : null,
            )}

            {/* echoes: only where a cone met something */}
            {PINGS.map((p, k) =>
              p.echo && f.cones[k].echo ? (
                <g key={p.n}>
                  <line x1={p.echo.a.x} y1={p.echo.a.y} x2={p.echo.b.x} y2={p.echo.b.y} stroke="var(--light)" strokeWidth={3} />
                  <text
                    className="sim-cy__lbl"
                    x={p.pose.h === 0 ? (p.echo.a.x + p.echo.b.x) / 2 + 12 : Math.min(p.echo.a.x, p.echo.b.x) - 12}
                    y={(p.echo.a.y + p.echo.b.y) / 2}
                    fill="var(--light)"
                    textAnchor={p.pose.h === 0 ? 'start' : 'end'}
                    dominantBaseline="middle"
                  >
                    {fmt(p.echo.dM, 2)} m
                  </text>
                </g>
              ) : null,
            )}

            {/* IR: short dotted ray */}
            {f.ir && IR.map((r, i) => (
              <g key={i}>
                <line x1={r.from.x} y1={r.from.y} x2={r.to.x} y2={r.to.y} stroke="var(--sand)" strokeWidth={2} strokeDasharray="2 5" strokeLinecap="round" />
                <text className="sim-cy__lbl" x={(r.from.x + r.to.x) / 2} y={r.from.y + fs + 6} fill="var(--sand)" textAnchor="middle">
                  IR
                </text>
              </g>
            ))}

            {/* bump: contact tick on the outline */}
            {f.bump && BUMPS.map((b, i) => {
              const a = rad(b.angle)
              const tick = (r: number) => ({ x: b.pose.x + r * Math.cos(a), y: b.pose.y + r * Math.sin(a) })
              const p0 = tick(R_BOT - 7)
              const p1 = tick(R_BOT + 7)
              return (
                <g key={i}>
                  <circle cx={b.pose.x} cy={b.pose.y} r={R_BOT} fill="none" stroke="var(--line-strong)" strokeWidth={1} />
                  <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke="var(--light)" strokeWidth={3} />
                  <text className="sim-cy__lbl" x={p1.x - 10} y={p1.y + fs * 0.35} fill="var(--light)" textAnchor="end">
                    bump
                  </text>
                </g>
              )
            })}

            {/* CyBot: where the scrub has it, or where the course ends */}
            <g>
              <circle cx={R.x} cy={R.y} r={R_BOT} fill="var(--floor-deep)" stroke="var(--light)" strokeWidth={1.5} />
              <line
                x1={R.x}
                y1={R.y}
                x2={R.x + R_BOT * Math.cos(rad(R.h))}
                y2={R.y + R_BOT * Math.sin(rad(R.h))}
                stroke="var(--light)"
                strokeWidth={1.5}
              />
              {/* named once at rest: a moving label would cross the echo and IR labels */}
              {atEnd && (
                <text className="sim-cy__lbl" x={R.x + R_BOT + 10} y={R.y + fs * 0.35} fill="var(--light)">
                  CyBot
                </text>
              )}
            </g>
          </svg>
        </div>
        <div className="sim-cy__run" aria-hidden="true" />
      </div>

      <figcaption id={cap} className="sim-cy__caption">
        Illustrative course, not a recording.
      </figcaption>

      <div className="sim-cy__readout">
        <p className="sim-data">
          d = v·t/2 · v ≈ {V_SOUND} m/s (air) · last echo t = {fmt(LAST.tMs, 1)} ms → d = {fmt(LAST.dM, 2)} m
        </p>
        <ul className="sim-cy__legend">
          <li>
            <span className="sim-cy__key sim-cy__key--cone" aria-hidden="true" />
            PING (numbered in order): a narrow forward cone, ±20°
          </li>
          <li>
            <span className="sim-cy__key sim-cy__key--echo" aria-hidden="true" />
            Echo: drawn only where a cone met an obstacle
          </li>
          <li>
            <span className="sim-cy__key sim-cy__key--ir" aria-hidden="true" />
            IR: a short-range reading straight ahead
          </li>
          <li>
            <span className="sim-cy__key sim-cy__key--bump" aria-hidden="true" />
            Bump: contact on the robot's outline
          </li>
          <li>
            <span className="sim-cy__key sim-cy__key--path" aria-hidden="true" />
            Path: turns only on what the sensors revealed
          </li>
        </ul>
      </div>
    </figure>
  )
}
