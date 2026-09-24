import { LANES, NUM_DATA, WHALE, chipState, freqMHz, type HopState } from './csa1'
import { useRef } from 'react'
import { TAG_PX, useUnitScale } from '../shared/hooks'
import type { Frame } from './frames'

interface Props {
  s: HopState
  f: Frame
  uid: string
  hover?: number | null
  onLane?: (ch: number) => void
  onHover?: (ch: number | null) => void
}

/** The radio block's spectrogram: 40 lanes in frequency order, one column per connection event. */
export function Spectrogram({ s, f, uid, hover = null, onLane, onHover }: Props) {
  const svg = useRef<SVGSVGElement>(null)
  // Labels render at --t-tag on screen whatever the surface width, so size them in units.
  const font = TAG_PX / (useUnitScale(svg, f.w) ?? f.nominalScale)
  const gutterLabel = f.compact ? 2 : 9 // "39" or "ch39 2480"
  const x0 = Math.max(f.gutter, Math.ceil(gutterLabel * 0.64 * font + 12))
  const x1 = f.w - 6
  const y0 = Math.max(6, Math.ceil(font * 0.6))
  const y1 = f.h - Math.ceil(font + 8)
  const laneH = (y1 - y0) / 40
  const colW = (x1 - x0) / f.cols
  const laneY = (ch: number) => y0 + (39 - LANES.indexOf(ch)) * laneH + laneH / 2
  const events = s.log.slice(-f.cols)
  const colX = (i: number) => x0 + (i + 0.5) * colW
  const markW = Math.min(colW * 0.55, 14)
  const markH = Math.max(laneH * 0.9, 3)
  const last = events.at(-1)
  const prev = events.at(-2)
  const whaleTop = laneY(WHALE[WHALE.length - 1]) - laneH / 2
  const whaleBot = laneY(WHALE[0]) + laneH / 2
  const hatch = `hatch-${uid}`
  const clip = `clip-${uid}`
  const period = f.compact ? 26 : 60
  // 8s per crossing of the band: one wavelength of drift takes 8s × period / width, then loops.
  const driftMs = Math.round((8000 * period) / (x1 - x0))
  const lostLabels = f.compact ? events.filter((e) => e.lost).slice(-1) : events.filter((e) => e.lost)

  return (
    <svg
      ref={svg}
      className="sim-hop__svg"
      viewBox={`0 0 ${f.w} ${f.h}`}
      aria-hidden="true"
      focusable="false"
      fontFamily="var(--f-mono)"
      fontSize={font}
      onMouseLeave={() => onHover?.(null)}
    >
      <defs>
        <clipPath id={clip}>
          <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} />
        </clipPath>
        <pattern id={hatch} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="1.4" height="5" fill="var(--dim)" />
        </pattern>
      </defs>

      {/* data lanes */}
      {Array.from({ length: NUM_DATA }, (_, ch) => {
        const st = chipState(s, ch)
        const y = laneY(ch)
        return (
          <g key={ch}>
            {st === 'bad' || st === 'pending-used' ? (
              <rect x={x0} y={y - laneH / 2 + 0.5} width={x1 - x0} height={laneH - 1} fill={`url(#${hatch})`} opacity={0.55} />
            ) : null}
            <line
              x1={x0}
              x2={x1}
              y1={y}
              y2={y}
              stroke="var(--m2-violet)"
              strokeOpacity={s.map[ch] ? 0.6 : 0.2}
              strokeWidth={1}
            />
            {st.startsWith('pending') ? (
              <rect
                className="sim-hop__pending"
                x={x0 + 0.5}
                y={y - laneH / 2 + 0.5}
                width={x1 - x0 - 1}
                height={laneH - 1}
                fill="none"
                stroke="var(--light)"
                strokeDasharray="4 3"
              />
            ) : null}
            {st === 'bad' ? (
              <text x={x0 - 4} y={y} dy="0.35em" textAnchor="end" fill="var(--dim)">
                ✕
              </text>
            ) : null}
          </g>
        )
      })}

      {/* advertising lanes at their real places */}
      {[37, 38, 39].map((ch) => (
        <g key={ch}>
          <line x1={x0} x2={x1} y1={laneY(ch)} y2={laneY(ch)} stroke="var(--light)" strokeOpacity={0.8} strokeWidth={1} />
          <text x={x0 - 6} y={laneY(ch)} dy="0.35em" textAnchor="end" fill="var(--sand)">
            {f.compact ? ch : `ch${ch} ${freqMHz(ch)}`}
          </text>
        </g>
      ))}
      {/* whale song: interference over ch10–15 */}
      <g className="sim-hop__whale">
        <rect x={x0} y={whaleTop} width={x1 - x0} height={whaleBot - whaleTop} fill="var(--light)" opacity={0.04} />
        <g clipPath={`url(#${clip})`}>
          <g
            className="sim-hop__whale-drift"
            style={{ ['--drift' as string]: `${period}px`, animationDuration: `${driftMs}ms` }}
          >
            {[0.2, 0.5, 0.8].map((k, i) => (
              <path
                key={i}
                d={wave(x0 - period, x1, whaleTop + (whaleBot - whaleTop) * k, (whaleBot - whaleTop) * 0.22, period)}
              fill="none"
              stroke="var(--light)"
              strokeOpacity={0.35}
                strokeWidth={f.compact ? 1 : 1.5}
              />
            ))}
          </g>
        </g>
        <text x={x1 - 4} y={whaleTop - 3} textAnchor="end" fill="var(--sand)">
          whale song
        </text>
      </g>

      {/* hover outline (mouse only; keyboard uses the chip grid) */}
      {hover !== null ? (
        <>
          <rect
            x={x0}
            y={laneY(hover) - laneH / 2}
            width={x1 - x0}
            height={laneH}
            fill="none"
            stroke="var(--sea)"
            strokeWidth={1.5}
          />
          <text x={x0 + 4} y={laneY(hover) - laneH / 2 - 3} fill="var(--light)">
            ch{hover} · {freqMHz(hover)} MHz
          </text>
        </>
      ) : null}

      {/* instant columns */}
      {events.map((e, i) =>
        e.mapApplied ? (
          <g key={`i${e.event}`}>
            <line x1={colX(i)} x2={colX(i)} y1={y0} y2={y1} stroke="var(--light)" strokeOpacity={0.5} strokeDasharray="2 3" />
            <text x={colX(i)} y={f.h - 4} textAnchor="middle" fill="var(--light)">
              new map
            </text>
          </g>
        ) : null,
      )}

      {/* the latest hop: connector and remap ghost */}
      {last && prev ? (
        <line
          key={`c${last.event}`}
          className="sim-hop__connector"
          x1={colX(events.length - 2)}
          y1={laneY(prev.channel)}
          x2={colX(events.length - 1)}
          y2={laneY(last.channel)}
          stroke="var(--light)"
          strokeOpacity={0.5}
        />
      ) : null}
      {last?.remapped ? (
        <g key={`g${last.event}`} className="sim-hop__ghost">
          <rect
            x={colX(events.length - 1) - markW / 2}
            y={laneY(last.unmapped) - markH / 2}
            width={markW}
            height={markH}
            fill="none"
            stroke="var(--light)"
            strokeDasharray="2 2"
          />
          <line
            x1={colX(events.length - 1)}
            x2={colX(events.length - 1)}
            y1={laneY(last.unmapped)}
            y2={laneY(last.channel)}
            stroke="var(--light)"
            strokeOpacity={0.7}
            markerEnd="none"
          />
        </g>
      ) : null}

      {/* connection events */}
      {events.map((e, i) =>
        e.lost ? (
          <circle
            key={e.event}
            className="sim-hop__mark"
            cx={colX(i)}
            cy={laneY(e.channel)}
            r={Math.max(markH * 0.75, 3)}
            fill="var(--floor-1)"
            stroke="var(--dim)"
            strokeWidth={1.2}
            strokeDasharray="3 2"
          />
        ) : (
          <rect
            key={e.event}
            className="sim-hop__mark"
            x={colX(i) - markW / 2}
            y={laneY(e.channel) - markH / 2}
            width={markW}
            height={markH}
            fill="var(--light)"
          />
        ),
      )}
      {lostLabels.map((e) => {
        const i = events.indexOf(e)
        return (
          <text key={`l${e.event}`} x={colX(i)} y={laneY(e.channel) + markH + font} textAnchor="middle" fill="var(--dim)">
            lost
          </text>
        )
      })}

      {/* the map switch sweep at the instant */}
      {last?.mapApplied ? <line key={`s${last.event}`} className="sim-hop__sweep" style={{ ['--sweep' as string]: `${y1 - y0}px` }} x1={x0} x2={x1} y1={y0} y2={y0} stroke="var(--light)" /> : null}

      <text x={x0} y={f.h - 4} fill="var(--dim)">
        time →
      </text>

      {/* mouse targets for the data lanes */}
      {onLane
        ? Array.from({ length: NUM_DATA }, (_, ch) => (
            <rect
              key={`t${ch}`}
              className="sim-hop__lane"
              x={x0}
              y={laneY(ch) - laneH / 2}
              width={x1 - x0}
              height={laneH}
              fill="transparent"
              onClick={() => onLane(ch)}
              onMouseEnter={() => onHover?.(ch)}
            />
          ))
        : null}
    </svg>
  )
}

function wave(xa: number, xb: number, y: number, amp: number, period: number): string {
  let d = `M${xa} ${y}`
  for (let x = xa; x < xb; x += period / 2) {
    const up = Math.round((x - xa) / (period / 2)) % 2 === 0
    d += ` Q${x + period / 4} ${y + (up ? -amp : amp)} ${x + period / 2} ${y}`
  }
  return d
}
