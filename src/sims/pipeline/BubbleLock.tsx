import { useId, useMemo, useRef, useState } from 'react'
import type { SimProps } from '../types'
import { Live, Rail } from '../shared/Rail'
import { useAnnouncer, useInterval, useSimGate } from '../shared/hooks'
import {
  SCENARIOS,
  SCENARIO_IDS,
  STAGES,
  caption,
  cellText,
  simulate,
  type Instr,
  type ScenarioId,
  type Slot,
  type Stage,
} from './model'
import './bubble.css'

const CYCLE_MS = 700

function SlotView({ slot, program }: { slot: Slot; program: Instr[] }) {
  if (!slot) return <span className="sim-bl__empty">—</span>
  if (slot.kind === 'bubble')
    return (
      <span className="sim-bl__bubble">
        <span className="sim-bl__circle" aria-hidden="true" />
        bubble
      </span>
    )
  const ins = program[slot.i]
  const tok = (
    <>
      <span className="sim-bl__full">{ins.text}</span>
      <span className="sim-bl__short">{ins.short}</span>
    </>
  )
  if (slot.kind === 'flushed')
    return (
      <span className="sim-bl__flushed">
        <s className="sim-bl__tok">{tok}</s>
        <span className="sim-bl__sub">flushed</span>
      </span>
    )
  return (
    <span>
      <span className="sim-bl__tok">{tok}</span>
      {slot.held ? <span className="sim-bl__sub">(held)</span> : null}
    </span>
  )
}

const slotWords = (slot: Slot, program: Instr[]) =>
  !slot
    ? 'empty'
    : slot.kind === 'bubble'
      ? 'bubble'
      : slot.kind === 'flushed'
        ? `${program[slot.i].text}, flushed`
        : `${program[slot.i].text}${slot.held ? ', held' : ''}`

export function BubbleLock({ headingId }: SimProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const surface = useRef<HTMLDivElement>(null)
  const [scenario, setScenario] = useState<ScenarioId>('load-use')
  const [forwarding, setForwarding] = useState(true)
  const [cycle, setCycle] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [live, announce] = useAnnouncer()
  // Play is user-started, so it runs under calm too (as cuts); it still stops off-screen and when paused.
  const { paused, inView } = useSimGate(surface)
  const run = useMemo(() => simulate(scenario, forwarding), [scenario, forwarding])
  const program = run.program
  const at = run.chambers[cycle]
  const cap = caption(run, cycle)
  const flushNow = run.events[cycle]?.some((e) => e.kind === 'flush')
  const ex = at.EX
  const fwd = ex?.kind === 'instr' ? ex.fwd : []

  const go = (c: number) => {
    const next = Math.max(0, Math.min(run.cycles, c))
    setCycle(next)
    const text = caption(run, next)
    if (text) announce(text)
    return next
  }
  useInterval(
    () => {
      if (go(cycle + 1) >= run.cycles) setPlaying(false)
    },
    CYCLE_MS,
    playing && !paused && inView,
  )
  const restart = (words: string) => {
    setCycle(0)
    setPlaying(false)
    announce(words)
  }

  const h3 = `${uid}-h3`
  const tableH = `${uid}-table`
  const done = cycle >= run.cycles

  return (
    <div className="sim sim--bl" role="group" aria-labelledby={`${headingId} ${h3}`}>
      <h3 id={h3} className="sim-title">
        Try it: Bubble Lock
      </h3>

      <div ref={surface} className="sim-block sim-bl__surface">
        <span className="sim-block__tag" aria-hidden="true">
          CPU · 5-stage · M1 straps
        </span>
        <p className="sim-bl__head sim-data">
          <strong>Cycle {cycle}</strong>
          <span className="sim-dim">
            {' '}
            · {SCENARIOS[scenario].label.toLowerCase()} · forwarding {forwarding ? 'on' : 'off'}
          </span>
        </p>
        <div className="sim-bl__band" aria-hidden="true">
          {flushNow ? <div key={`f${scenario}${cycle}`} className="sim-bl__flush">flush</div> : null}
        </div>
        <ol className="sim-bl__chambers" aria-label={`Pipeline at cycle ${cycle}`}>
          {STAGES.map((st: Stage) => (
            <li key={st} className="sim-bl__chamber" data-stage={st}>
              <span className="sim-sr">
                {st}: {slotWords(at[st], program)}
              </span>
              <span className="sim-bl__stage" aria-hidden="true">
                {st}
              </span>
              <span className="sim-bl__slot" aria-hidden="true">
                <SlotView slot={at[st]} program={program} />
              </span>
            </li>
          ))}
        </ol>
        <div className="sim-bl__fwdrow" aria-hidden={fwd.length ? undefined : true}>
          {fwd.map((f) => {
            const src = f.from === 'EX/MEM' ? 4 : 5
            return (
              <div
                key={`${scenario}${cycle}${f.reg}`}
                className="sim-bl__fwd"
                style={{ gridColumn: `3 / ${src + 1}`, ['--n' as string]: src - 2 }}
              >
                <span className="sim-bl__pipe" aria-hidden="true" />
                <span className="sim-bl__fwdlabel sim-data">
                  forward {f.from} → EX · x{f.reg}
                </span>
              </div>
            )
          })}
        </div>
        <span className="sim-block__id" aria-hidden="true">
          AG-S4
        </span>
      </div>

      <Rail name="Bubble Lock">
        <button
          type="button"
          className="sim-btn"
          onClick={() => restart(`Reset to cycle 0: ${SCENARIOS[scenario].label}, forwarding ${forwarding ? 'on' : 'off'}.`)}
        >
          Reset
        </button>
      </Rail>

      <div className="sim-bl__controls">
        <fieldset className="sim-bl__scenarios">
          <legend className="sim-h3">Scenario</legend>
          {SCENARIO_IDS.map((id) => (
            <label key={id} className="sim-bl__radio">
              <input
                type="radio"
                name={`${uid}-scenario`}
                value={id}
                checked={scenario === id}
                onChange={() => {
                  setScenario(id)
                  restart(`${SCENARIOS[id].label} loaded at cycle 0.`)
                }}
              />
              <span>{SCENARIOS[id].label}</span>
            </label>
          ))}
        </fieldset>

        <button
          type="button"
          role="switch"
          aria-label="Forwarding"
          aria-checked={forwarding}
          className="sim-btn sim-bl__switch"
          onClick={() => {
            setForwarding((f) => !f)
            restart(`Forwarding ${forwarding ? 'off' : 'on'}. Back to cycle 0.`)
          }}
        >
          <span className="sim-bl__track" aria-hidden="true">
            <span className="sim-bl__thumb" />
          </span>
          Forwarding {forwarding ? 'on' : 'off'}
        </button>

        <div className="sim-bl__stepper" role="group" aria-label="Clock">
          <span className="sim-data sim-bl__count" aria-hidden="true">
            Cycle {cycle} / {run.cycles}
          </span>
          <button type="button" className="sim-btn" onClick={() => go(cycle - 1)} aria-disabled={cycle === 0 || undefined}>
            <span className="sim-btn__glyph" aria-hidden="true">
              ◀
            </span>
            Back
          </button>
          <button type="button" className="sim-btn" onClick={() => go(cycle + 1)} aria-disabled={done || undefined}>
            Step
            <span className="sim-btn__glyph" aria-hidden="true">
              ▶
            </span>
          </button>
          <button
            type="button"
            className="sim-btn"
            onClick={() => {
              if (playing) return setPlaying(false)
              if (done) setCycle(0)
              setPlaying(true)
            }}
          >
            <span className="sim-btn__glyph" aria-hidden="true">
              {playing ? '❚❚' : '▶'}
            </span>
            {playing ? 'Pause' : 'Play'}
          </button>
        </div>
      </div>

      <p className="sim-bl__caption">{cap ?? (cycle === 0 ? 'Cycle 0: nothing fetched yet. Step clocks the pipeline once.' : `Cycle ${cycle}: no hazard this cycle.`)}</p>

      <div className="sim-bl__table">
        <h3 id={tableH} className="sim-h3">
          Cycle table
        </h3>
        <div className="sim-bl__scroll" role="region" aria-labelledby={tableH} tabIndex={0}>
          <table className="sim-data">
            <thead>
              <tr>
                <th scope="col">instr \ cycle</th>
                {Array.from({ length: run.cycles }, (_, k) => (
                  <th key={k} scope="col" className={k + 1 === cycle ? 'is-now' : undefined} aria-current={k + 1 === cycle || undefined}>
                    {k + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {run.table.map((row, i) => (
                <tr key={i}>
                  <th scope="row">{program[i].text}</th>
                  {row.map((c, k) => (
                    <td
                      key={k}
                      className={[
                        k + 1 === cycle ? 'is-now' : '',
                        c?.stall ? 'is-stall' : '',
                        c?.fwd.length ? 'is-fwd' : '',
                        c?.stage === 'flushed' ? 'is-flushed' : '',
                      ]
                        .filter(Boolean)
                        .join(' ') || undefined}
                    >
                      {cellText(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="sim-note sim-dim">
          (stall): held in that stage while a bubble enters EX. ← names the pipeline register a value is forwarded from.
        </p>
      </div>

      <Live text={live} />
    </div>
  )
}
