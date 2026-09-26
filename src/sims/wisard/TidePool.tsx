import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent, type PointerEvent } from 'react'
import type { SimProps } from '../types'
import { Live, Rail } from '../shared/Rail'
import { useAnnouncer, useSimGate } from '../shared/hooks'
import { SEED_SAMPLES } from './samples'
import {
  MAX_CLASSES,
  SIDE,
  TUPLE_MAX,
  TUPLE_MIN,
  classify,
  emptyGrid,
  isEmpty,
  numRams,
  parse,
  ramBits,
  seedModel,
  setTuple,
  teach,
  verdict,
  verdictText,
  type Grid,
  type TeachError,
  type Verdict,
  type WModel,
} from './model'
import './tide.css'

const WASH_DEBOUNCE = 150

const EXAMPLES = Object.entries(SEED_SAMPLES).flatMap(([name, list]) => list.map((rows, k) => ({ name, k, rows })))
// interleave classes: wave 1, fish 1, shell 1, wave 2, …
EXAMPLES.sort((a, b) => a.k - b.k)

const TEACH_NOTES: Record<TeachError, string> = {
  'no-name': 'Name the class first.',
  'empty-drawing': 'Draw something to teach from.',
  'max-classes': `${MAX_CLASSES} classes is the limit. Reset to start over.`,
}

interface Result {
  counts: number[]
  v: Verdict
}

const evaluate = (m: WModel, g: Grid): Result => {
  const counts = classify(m, g)
  return { counts, v: verdict(counts, isEmpty(g)) }
}

export function TidePool({ headingId }: SimProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const pool = useRef<HTMLDivElement>(null)
  const pad = useRef<HTMLDivElement>(null)
  const [model, setModel] = useState<WModel>(() => seedModel())
  const [grid, setGrid] = useState<Grid>(emptyGrid)
  const [focus, setFocus] = useState(0)
  const [result, setResult] = useState<Result>(() => evaluate(seedModel(), emptyGrid()))
  const [wash, setWash] = useState(0)
  const [example, setExample] = useState(0)
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [live, announce] = useAnnouncer()
  const stroke = useRef<{ mode: 0 | 1; x: number; y: number } | null>(null)
  const spoken = useRef('')
  const touched = useRef(false)
  const { calm, paused, inView } = useSimGate(pool)

  // The tide washes 150ms after the last change, then the bars and the verdict update.
  useEffect(() => {
    if (!touched.current) return
    const t = window.setTimeout(() => {
      const r = evaluate(model, grid)
      setResult(r)
      if (r.v.kind !== 'empty') setWash((w) => w + 1)
      const text = verdictText(r.v, model.classes.map((c) => c.name), numRams(model.tuple))
      if (text !== spoken.current) {
        spoken.current = text
        announce(text)
      }
    }, WASH_DEBOUNCE)
    return () => window.clearTimeout(t)
  }, [model, grid, announce])

  const change = (g: Grid) => {
    touched.current = true
    setGrid(g)
  }
  // Functional update: several pointermoves can land before one render.
  const paint = (cells: number[], mode: 0 | 1) => {
    touched.current = true
    setGrid((cur) => {
      if (cells.every((i) => cur[i] === mode)) return cur
      const g = Uint8Array.from(cur)
      for (const i of cells) g[i] = mode
      return g
    })
  }

  const cellAt = (e: PointerEvent) => {
    const r = pad.current!.getBoundingClientRect()
    const x = Math.min(SIDE - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * SIDE)))
    const y = Math.min(SIDE - 1, Math.max(0, Math.floor(((e.clientY - r.top) / r.height) * SIDE)))
    return { x, y }
  }
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.currentTarget.setPointerCapture?.(e.pointerId)
    const { x, y } = cellAt(e)
    const mode = grid[y * SIDE + x] ? 0 : 1
    stroke.current = { mode, x, y }
    paint([y * SIDE + x], mode)
  }
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const s = stroke.current
    if (!s) return
    const { x, y } = cellAt(e)
    if (x === s.x && y === s.y) return
    paint(line(s.x, s.y, x, y), s.mode)
    stroke.current = { ...s, x, y }
  }
  const onUp = () => {
    stroke.current = null
  }

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const x = focus % SIDE
    const y = Math.floor(focus / SIDE)
    let nx = x
    let ny = y
    if (e.key === 'ArrowRight') nx = Math.min(SIDE - 1, x + 1)
    else if (e.key === 'ArrowLeft') nx = Math.max(0, x - 1)
    else if (e.key === 'ArrowDown') ny = Math.min(SIDE - 1, y + 1)
    else if (e.key === 'ArrowUp') ny = Math.max(0, y - 1)
    else if (e.key === 'Home') nx = 0
    else if (e.key === 'End') nx = SIDE - 1
    else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      paint([focus], grid[focus] ? 0 : 1)
      return
    } else return
    e.preventDefault()
    const next = ny * SIDE + nx
    if (e.shiftKey && e.key.startsWith('Arrow')) paint([focus, next], 1)
    setFocus(next)
    pad.current?.querySelector<HTMLElement>(`[data-i="${next}"]`)?.focus()
  }

  const clear = () => {
    change(emptyGrid())
    setNote('')
  }
  const tryExample = () => {
    const ex = EXAMPLES[example % EXAMPLES.length]
    change(parse(ex.rows))
    setExample((k) => k + 1)
    setNote(`Loaded a sample drawing bundled with the page: ${ex.name} ${ex.k + 1}.`)
  }
  const onTuple = (n: number) => {
    touched.current = true
    setModel((m) => setTuple(m, n))
  }
  const onTeach = (e: FormEvent) => {
    e.preventDefault()
    const r = teach(model, name, grid)
    if (r.error) {
      setNote(TEACH_NOTES[r.error])
      announce(TEACH_NOTES[r.error])
      return
    }
    touched.current = true
    setModel(r.model)
    const n = name.trim().slice(0, 16)
    const msg = r.created ? `New class “${n}” taught from one drawing.` : `Class “${n}” taught one more drawing.`
    setNote(msg)
    announce(msg)
    setName('')
  }
  const reset = () => {
    const m = seedModel()
    touched.current = false
    spoken.current = ''
    setModel(m)
    setGrid(emptyGrid())
    setResult(evaluate(m, emptyGrid()))
    setExample(0)
    setName('')
    setNote('')
    announce('Reset: the three seed classes, tuple size 4, an empty pool.')
  }

  const names = model.classes.map((c) => c.name)
  const rams = numRams(model.tuple)
  const { v, counts } = result
  const h3 = `${uid}-h3`
  const inked = grid.reduce((a, b) => a + b, 0)
  const shimmer = inView && !calm && !paused

  return (
    <div className="sim sim--tp" role="group" aria-labelledby={`${headingId} ${h3}`}>
      <h3 id={h3} className="sim-title">
        Try it: Tide Pool
      </h3>

      <div className="sim-block sim-tp__surface">
        <span className="sim-block__tag" aria-hidden="true">
          Memory · {model.classes.length} × {rams} RAMs
        </span>
        <div className="sim-tp__stage">
          <div ref={pool} className={`sim-tp__pool${shimmer ? ' is-lit' : ''}`}>
            <div
              ref={pad}
              className="sim-tp__pad"
              role="grid"
              aria-label="Tide pool, 16 by 16 cells"
              aria-describedby={`${uid}-padhelp`}
              aria-rowcount={SIDE}
              aria-colcount={SIDE}
              data-no-shortcuts=""
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
              onKeyDown={onKey}
            >
              {Array.from({ length: SIDE }, (_, y) => (
                <div key={y} role="row" className="sim-tp__row">
                  {Array.from({ length: SIDE }, (_, x) => {
                    const i = y * SIDE + x
                    return (
                      <div
                        key={x}
                        role="gridcell"
                        data-i={i}
                        tabIndex={i === focus ? 0 : -1}
                        className={grid[i] ? 'sim-tp__cell is-on' : 'sim-tp__cell'}
                        aria-label={`${grid[i] ? 'Inked' : 'Empty'}, row ${y + 1}, column ${x + 1}`}
                        onFocus={() => setFocus(i)}
                      />
                    )
                  })}
                </div>
              ))}
              {wash ? <span key={wash} className="sim-tp__wash" aria-hidden="true" /> : null}
            </div>
          </div>

          <div className="sim-tp__readout">
            <p className="sim-h3">Discriminators (one RAM set per class)</p>
            <p className="sim-note sim-dim">
              wave, fish and shell start trained on a few sample drawings bundled with this page.
            </p>
            <ul className="sim-tp__bars">
              {model.classes.map((c, i) => {
                const win = v.kind === 'winner' && v.top === i
                return (
                  <li key={c.name} className={win ? 'is-win' : undefined}>
                    <span className="sim-tp__name">{c.name}</span>
                    <span className="sim-tp__bar" aria-hidden="true">
                      <span style={{ width: `${v.kind === 'empty' ? 0 : (counts[i] / rams) * 100}%` }} />
                    </span>
                    <span className="sim-tp__n sim-data">
                      {v.kind === 'empty' ? '—' : `${counts[i]} of ${rams}`}
                      <span className="sim-sr"> RAMs</span>
                    </span>
                  </li>
                )
              })}
            </ul>
            <p className="sim-tp__verdict" data-kind={v.kind}>
              {v.kind === 'empty'
                ? 'Draw something'
                : v.kind === 'tie'
                  ? `Too close to call: ${v.topCount} vs ${v.secondCount}`
                  : `→ ${names[v.top]}`}
            </p>
            <p className="sim-data sim-sand">
              {v.kind === 'empty'
                ? `gap: — (the pool is empty)`
                : `gap: ${v.gap} ${v.gap === 1 ? 'RAM' : 'RAMs'} (${names[v.top]} minus ${names[v.second]})`}
            </p>
          </div>
        </div>
        <span className="sim-block__id" aria-hidden="true">
          AG-S5
        </span>
      </div>
      <p id={`${uid}-padhelp`} className="sim-note sim-dim">
        Draw with a finger or the mouse, or tap cells. Keyboard: arrows move, Space toggles, Shift and an arrow paints.
        {inked ? ` ${inked} of 256 cells inked.` : ''}
      </p>

      <Rail name="Tide Pool · WiSARD">
        <button type="button" className="sim-btn" onClick={reset}>
          Reset
        </button>
      </Rail>

      <div className="sim-tp__controls">
        <div className="sim-tp__row1">
          <button type="button" className="sim-btn" onClick={clear}>
            Clear
          </button>
          <button type="button" className="sim-btn" onClick={tryExample}>
            Try an example
          </button>
          <div className="sim-range">
            <label htmlFor={`${uid}-tuple`}>Tuple size</label>
            <span className="sim-data sim-dim" aria-hidden="true">
              {TUPLE_MIN}
            </span>
            <input
              id={`${uid}-tuple`}
              type="range"
              min={TUPLE_MIN}
              max={TUPLE_MAX}
              step={1}
              value={model.tuple}
              onChange={(e) => onTuple(Number(e.target.value))}
            />
            <span className="sim-data sim-dim" aria-hidden="true">
              {TUPLE_MAX}
            </span>
            <output htmlFor={`${uid}-tuple`}>= {model.tuple} bits</output>
          </div>
        </div>
        <p className="sim-data">
          RAM used: {model.classes.length} classes × {rams} RAMs × {2 ** model.tuple} addresses ={' '}
          {ramBits(model.classes.length, model.tuple).toLocaleString('en-US')} bits
        </p>
        <form className="sim-tp__teach" onSubmit={onTeach}>
          <label htmlFor={`${uid}-name`}>Teach a new class</label>
          <input
            id={`${uid}-name`}
            className="sim-tp__input"
            type="text"
            maxLength={16}
            autoComplete="off"
            placeholder="name, e.g. kelp"
            value={name}
            data-no-shortcuts=""
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit" className="sim-btn">
            Teach from this drawing
          </button>
          <span className="sim-note sim-dim">
            {model.classes.length} of {MAX_CLASSES} classes
          </span>
        </form>
        <p className="sim-note" aria-live="off">
          {note}
        </p>
      </div>

      <Live text={live} />
    </div>
  )
}

/** Cells on the line between two cells (Bresenham), so a fast stroke leaves no gaps. */
function line(x0: number, y0: number, x1: number, y1: number): number[] {
  const out: number[] = []
  const dx = Math.abs(x1 - x0)
  const dy = -Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx + dy
  for (;;) {
    out.push(y0 * SIDE + x0)
    if (x0 === x1 && y0 === y1) return out
    const e2 = 2 * err
    if (e2 >= dy) {
      err += dy
      x0 += sx
    }
    if (e2 <= dx) {
      err += dx
      y0 += sy
    }
  }
}
