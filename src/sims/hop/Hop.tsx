import { useId, useRef, useState, type KeyboardEvent } from 'react'
import type { SimProps } from '../types'
import { Live, Rail } from '../shared/Rail'
import { gridKeyTarget, renderedColumns, useAnnouncer, useInterval, useSimGate } from '../shared/hooks'
import {
  HOP_MAX,
  HOP_MIN,
  MIN_USED,
  NUM_DATA,
  atMinimum,
  avoidWhale,
  chipState,
  countUsed,
  countdown,
  freqMHz,
  hasStagedChange,
  newConnection,
  opening,
  sendUpdate,
  step,
  target,
  toggleStaged,
  type HopError,
  type HopState,
} from './csa1'
import { Spectrogram } from './Spectrogram'
import { NARROW, WIDE } from './frames'
import { formula, hopEntry } from './text'
import './hop.css'

const EVENT_MS = 400 // 2.5 connection events per second

const NOTES: Record<HopError, string> = {
  'in-flight': 'One channel map update at a time: waiting for the instant.',
  'min-used': `CSA#1 needs at least ${MIN_USED} used channels.`,
  'no-change': 'Tap a channel first to stage a change.',
  advertising: 'Advertising channels are not in the data channel map.',
}

export function Hop({ headingId }: SimProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const chipsRef = useRef<HTMLDivElement>(null)
  const surface = useRef<HTMLDivElement>(null)
  const [s, setS] = useState<HopState>(opening)
  const [userPaused, setUserPaused] = useState(false)
  const [note, setNote] = useState('')
  const [focusCh, setFocusCh] = useState(0)
  const [hover, setHover] = useState<number | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [live, announce] = useAnnouncer()
  const { calm, running } = useSimGate(surface, userPaused)

  const advance = (fromUser: boolean) => {
    const next = step(s)
    const e = next.log.at(-1)!
    setS(next)
    if (e.mapApplied) announce(`Channel map updated at event ${e.event}: ${countUsed(next.map)} data channels in use.`)
    else if (fromUser) announce(`Event ${e.event}: ${hopEntry(e)}.`)
  }
  useInterval(() => advance(false), EVENT_MS, running)

  const toggle = (ch: number) => {
    const r = toggleStaged(s, ch)
    if (r.error) {
      setNote(NOTES[r.error])
      announce(NOTES[r.error])
      return
    }
    setNote('')
    setS(r.state)
  }
  const send = () => {
    const r = sendUpdate(s)
    if (r.error) {
      setNote(NOTES[r.error])
      return
    }
    setNote('')
    setS(r.state)
    announce(`Update sent. New map takes effect at event ${r.state.update!.instant}.`)
  }
  const demo = () => {
    const r = avoidWhale(s)
    if (r.error) {
      setNote(NOTES[r.error])
      return
    }
    setNote('')
    setS(r.state)
    announce(`Update sent: ch10 to ch15 marked bad. New map takes effect at event ${r.state.update!.instant}.`)
  }
  const reconnect = (hop: number) => {
    setS(newConnection(s, hop))
    setNote('')
    announce(`New connection: CONNECT_IND, hop = ${hop}. Hop log reset.`)
  }
  const reset = () => {
    setS(opening())
    setNote('')
    setUserPaused(false)
    announce('Reset: a new connection with every data channel used.')
  }

  const onChipKey = (e: KeyboardEvent) => {
    const cols = renderedColumns(chipsRef.current, 10)
    const next = gridKeyTarget(e, focusCh, NUM_DATA, cols)
    if (next === null) return
    e.preventDefault()
    setFocusCh(next)
    chipsRef.current?.querySelectorAll<HTMLButtonElement>('button')[next]?.focus()
  }

  const last = s.log.at(-1)
  const cd = countdown(s)
  const tgt = target(s)
  const counts = { used: 0, pending: 0, bad: 0 }
  for (let ch = 0; ch < NUM_DATA; ch++) {
    const st = chipState(s, ch)
    if (st === 'used') counts.used++
    else if (st === 'bad') counts.bad++
    else counts.pending++
  }
  const bad = Array.from({ length: NUM_DATA }, (_, ch) => ch).filter((ch) => !s.map[ch])
  const recent = s.log.slice(-8)
  const h3 = `${uid}-h3`
  const mapH = `${uid}-map`
  const logH = `${uid}-log`
  const autoplayOn = !calm && !userPaused

  return (
    <div className={`sim sim--hop${running ? ' is-running' : ''}`} role="group" aria-labelledby={`${headingId} ${h3}`}>
      <h3 id={h3} className="sim-title">
        Try it: Hop
      </h3>

      <div ref={surface} className="sim-block sim-hop__surface">
        <span className="sim-block__tag" aria-hidden="true">
          Radio · CSA#1 · 2402–2480 MHz
        </span>
        <div className="sim-hop__wide">
          <Spectrogram s={s} f={WIDE} uid={`${uid}w`} hover={hover} onLane={toggle} onHover={setHover} />
        </div>
        <div className="sim-hop__narrow">
          <Spectrogram s={s} f={NARROW} uid={`${uid}n`} />
        </div>
        <span className="sim-block__id" aria-hidden="true">
          AG-S3
        </span>
      </div>
      <p className="sim-hop__legend sim-data sim-dim" aria-hidden="true">
        <span>▮ event</span> <span>⬚ remapped from</span> <span>◌ lost (hit the whale song)</span>{' '}
        <span>⋯ pending</span> <span>▨ ✕ bad</span> <span>～ whale song: a stand-in for interference, e.g. Wi-Fi</span>
      </p>

      <Rail name="Hop · CSA#1">
        {calm ? null : (
          <button type="button" className="sim-btn" onClick={() => setUserPaused((p) => !p)}>
            <span className="sim-btn__glyph" aria-hidden="true">
              {autoplayOn ? '❚❚' : '▶'}
            </span>
            {autoplayOn ? 'Pause' : 'Play'}
          </button>
        )}
        <button type="button" className="sim-btn" onClick={() => advance(true)}>
          Step <span className="sim-btn__glyph" aria-hidden="true">▸</span>
        </button>
        <button type="button" className="sim-btn" onClick={reset}>
          Reset
        </button>
      </Rail>

      {calm ? <p className="sim-note">Autoplay is off in Still and reduced motion. Step moves one connection event.</p> : null}

      <div className="sim-hop__controls">
        <div className="sim-range">
          <label htmlFor={`${uid}-hop`}>Hop increment</label>
          <span className="sim-data sim-dim" aria-hidden="true">
            {HOP_MIN}
          </span>
          <input
            id={`${uid}-hop`}
            type="range"
            min={HOP_MIN}
            max={HOP_MAX}
            step={1}
            value={s.hop}
            aria-describedby={`${uid}-hopnote`}
            onChange={(e) => reconnect(Number(e.target.value))}
          />
          <span className="sim-data sim-dim" aria-hidden="true">
            {HOP_MAX}
          </span>
          <output htmlFor={`${uid}-hop`}>= {s.hop}</output>
          <span id={`${uid}-hopnote`} className="sim-note">
            Changing it starts a new connection.
          </span>
        </div>
        <p className="sim-data sim-hop__formula">{formula(last, s)}</p>
        <div className="sim-hop__actions">
          <button type="button" className="sim-btn" onClick={demo} aria-disabled={s.update !== null || undefined}>
            Avoid the whale song
          </button>
          <p className="sim-data sim-hop__status" aria-live="off">
            {s.update
              ? `LL_CHANNEL_MAP_IND · instant = event ${s.update.instant} · in ${cd}`
              : last?.mapApplied
                ? `New map in force since event ${last.event}`
                : 'No map update in flight'}
          </p>
        </div>
      </div>

      <div className="sim-hop__twin">
        <div className="sim-hop__map" data-open={editOpen}>
          <div className="sim-hop__maphead">
            <h3 id={mapH} className="sim-h3">
              Channel map
            </h3>
            <p className="sim-data">
              {counts.used} used · {counts.pending} pending · {counts.bad} bad
              <span className="sim-dim"> · bad: {bad.length ? bad.map((c) => `ch${c}`).join(', ') : 'none'}</span>
            </p>
            <button
              type="button"
              className="sim-btn sim-hop__disclosure"
              aria-expanded={editOpen}
              aria-controls={`${uid}-mapbody`}
              onClick={() => setEditOpen((o) => !o)}
            >
              Edit channel map <span aria-hidden="true">{editOpen ? '▴' : '▾'}</span>
            </button>
          </div>
          <div id={`${uid}-mapbody`} className="sim-hop__mapbody">
            <div
              ref={chipsRef}
              className="sim-hop__chips"
              role="group"
              aria-label="Data channels 0 to 36. Press a channel to stage it bad or used."
              aria-describedby={`${uid}-note`}
              data-no-shortcuts=""
              onKeyDown={onChipKey}
            >
              {Array.from({ length: NUM_DATA }, (_, ch) => {
                const st = chipState(s, ch)
                const disabled = s.update !== null || atMinimum(s, ch)
                const word = st === 'used' ? '' : st === 'bad' ? '✕' : 'pending'
                return (
                  <button
                    key={ch}
                    type="button"
                    className={`sim-hop__chip sim-hop__chip--${st}`}
                    tabIndex={ch === focusCh ? 0 : -1}
                    aria-pressed={!tgt[ch]}
                    aria-disabled={disabled || undefined}
                    aria-label={`ch${ch}, ${freqMHz(ch)} MHz${
                      st === 'bad' ? ', bad' : st === 'pending-bad' ? ', pending: bad at the instant' : st === 'pending-used' ? ', pending: used at the instant' : ''
                    }`}
                    onFocus={() => setFocusCh(ch)}
                    onClick={() => toggle(ch)}
                  >
                    <span className="sim-hop__chipn">{ch}</span>
                    <span className="sim-hop__chipw" aria-hidden="true">
                      {word}
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="sim-hop__send">
              <button
                type="button"
                className="sim-btn"
                onClick={send}
                aria-disabled={!hasStagedChange(s) || undefined}
              >
                Send map update
              </button>
              <p id={`${uid}-note`} className="sim-note">
                {note || (s.update ? NOTES['in-flight'] : '')}
              </p>
            </div>
          </div>
        </div>

        <div className="sim-hop__log">
          <h3 id={logH} className="sim-h3">
            Last 8 hops
          </h3>
          {recent.length ? (
            <ol className="sim-data">
              {recent.map((e) => (
                <li key={e.event} className={e.lost ? 'is-lost' : undefined}>
                  <span className="sim-dim">e{e.event}</span> {hopEntry(e)}
                </li>
              ))}
            </ol>
          ) : (
            <p className="sim-data sim-dim">CONNECT_IND · hop = {s.hop} · no events yet</p>
          )}
          <p className="sim-note sim-dim">unmapped→channel. “ch” marks a remap.</p>
        </div>
      </div>

      <Live text={live} />
    </div>
  )
}
