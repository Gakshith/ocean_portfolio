import { useId } from 'react'
import type { SimProps } from '../types'
import { POSES, R_BOT, UART_FROM, V_SOUND, VIEW, bumps, irRays, pings } from './course'
import './cybot.css'

// Everything is derived from the course geometry once, at module load (deterministic for SSR).
const PINGS = pings()
const IR = irRays()
const BUMPS = bumps()
const END = POSES[POSES.length - 1]
const rad = (d: number) => (d * Math.PI) / 180
const fmt = (n: number, d: number) => n.toFixed(d)
const LAST = [...PINGS].reverse().find((p) => p.echo)!.echo!

/** S6: the static echo diagram (Still / reduced motion / phase 1). The scrub comes in phase 2. */
export function CybotStill({ headingId }: SimProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const cap = `${uid}-cap`
  const path = POSES.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ')
  const echoes = PINGS.filter((p) => p.echo).length
  const summary = `Top-down diagram of an illustrative course: the robot takes ${PINGS.length} PING readings, each a narrow forward cone of plus or minus 20 degrees. ${echoes} of them return an echo from an obstacle; the first sees nothing. One short IR reading sees a wall close ahead, and one bump marks contact with an obstacle just beside it that no cone saw. A dashed line is the path it chose.`

  return (
    <figure className="sim sim--cy" aria-labelledby={`${headingId} ${cap}`}>
      <div className="sim-cy__stage">
        <svg className="sim-cy__svg" viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} role="img" aria-label={summary}>
          <rect width={VIEW.w} height={VIEW.h} fill="var(--floor-deep)" />

          {/* UART line from the die's SE pad */}
          <rect x={0} y={UART_FROM.y - 9} width={18} height={18} fill="var(--m5-al)" opacity={0.8} />
          <text className="sim-cy__lbl" x={4} y={UART_FROM.y + 34} fill="var(--dim)">
            UART
          </text>
          <path
            d={`M18 ${UART_FROM.y} H${POSES[0].x - 8}`}
            fill="none"
            stroke="var(--m5-al)"
            strokeWidth={1}
            opacity={0.7}
          />

          {/* PING cones: forward only, ±20° */}
          {PINGS.map((p) => (
            <g key={p.n}>
              <polygon
                points={p.cone.map((q) => `${q.x},${q.y}`).join(' ')}
                fill="var(--light)"
                fillOpacity={0.05}
                stroke="var(--light)"
                strokeOpacity={0.28}
                strokeWidth={1}
              />
              <text
                className="sim-cy__lbl"
                x={p.pose.x - 10}
                y={p.pose.y - 14}
                fill="var(--sand)"
                textAnchor="end"
              >
                PING {p.n}
              </text>
            </g>
          ))}

          {/* the path it chose */}
          <path d={path} fill="none" stroke="var(--dim)" strokeWidth={1.5} strokeDasharray="7 6" />
          {PINGS.map((p) => (
            <circle key={p.n} cx={p.pose.x} cy={p.pose.y} r={4} fill="var(--light)" />
          ))}

          {/* echoes: only where a cone met something */}
          {PINGS.map((p) =>
            p.echo ? (
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
          {IR.map((r, i) => (
            <g key={i}>
              <line x1={r.from.x} y1={r.from.y} x2={r.to.x} y2={r.to.y} stroke="var(--sand)" strokeWidth={2} strokeDasharray="2 5" strokeLinecap="round" />
              <text className="sim-cy__lbl" x={(r.from.x + r.to.x) / 2} y={r.from.y + 26} fill="var(--sand)" textAnchor="middle">
                IR
              </text>
            </g>
          ))}

          {/* bump: contact tick on the outline */}
          {BUMPS.map((b, i) => {
            const a = rad(b.angle)
            const tick = (r: number) => ({ x: b.pose.x + r * Math.cos(a), y: b.pose.y + r * Math.sin(a) })
            const p0 = tick(R_BOT - 7)
            const p1 = tick(R_BOT + 7)
            return (
              <g key={i}>
                <circle cx={b.pose.x} cy={b.pose.y} r={R_BOT} fill="none" stroke="var(--line-strong)" strokeWidth={1} />
                <line x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} stroke="var(--light)" strokeWidth={3} />
                <text className="sim-cy__lbl" x={p1.x - 10} y={p1.y + 4} fill="var(--light)" textAnchor="end">
                  bump
                </text>
              </g>
            )
          })}

          {/* CyBot where the course ends */}
          <g>
            <circle cx={END.x} cy={END.y} r={R_BOT} fill="var(--floor-deep)" stroke="var(--light)" strokeWidth={1.5} />
            <line
              x1={END.x}
              y1={END.y}
              x2={END.x + R_BOT * Math.cos(rad(END.h))}
              y2={END.y + R_BOT * Math.sin(rad(END.h))}
              stroke="var(--light)"
              strokeWidth={1.5}
            />
            <text className="sim-cy__lbl" x={END.x + R_BOT + 10} y={END.y + 6} fill="var(--light)">
              CyBot
            </text>
          </g>
        </svg>
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
            PING: a narrow forward cone, ±20°
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
