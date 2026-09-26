// Tide Pool: a WiSARD weightless classifier as a pure model.
// The 16×16 pool is 256 bits. A fixed pseudo-random mapping splits them into tuples of n bits;
// each tuple addresses one RAM of 2^n one-bit cells. Training writes 1 at the addressed cell;
// a class's response is how many of its RAMs hold a 1 at the address the drawing produces.
// Nothing here is an accuracy claim: every number is computed from the pool you drew.

import { SEED_SAMPLES } from './samples'

export const SIDE = 16
export const BITS = SIDE * SIDE
export const TUPLE_MIN = 2
export const TUPLE_MAX = 8
export const TUPLE_DEFAULT = 4
export const MAX_CLASSES = 6
/** A winner is shown only when the top count leads the second by more than this. */
export const TIE_MARGIN = 2
const SEED = 0x5eed_7d1e

export type Grid = Uint8Array

export interface WClass {
  name: string
  examples: Grid[]
  /** numRams × 2^n cells, 1 = written. */
  ram: Uint8Array
}

export interface WModel {
  tuple: number
  order: readonly number[]
  classes: WClass[]
}

export function emptyGrid(): Grid {
  return new Uint8Array(BITS)
}

export function parse(rows: readonly string[]): Grid {
  const g = emptyGrid()
  rows.forEach((row, y) => [...row].forEach((c, x) => (g[y * SIDE + x] = c === '#' ? 1 : 0)))
  return g
}

export function shift(g: Grid, dx: number, dy: number): Grid {
  const out = emptyGrid()
  for (let y = 0; y < SIDE; y++)
    for (let x = 0; x < SIDE; x++) {
      const sx = x - dx
      const sy = y - dy
      if (sx >= 0 && sy >= 0 && sx < SIDE && sy < SIDE) out[y * SIDE + x] = g[sy * SIDE + sx]
    }
  return out
}

export const isEmpty = (g: Grid) => g.every((b) => b === 0)

/** Deterministic permutation of the 256 inputs (mulberry32 Fisher–Yates), the same on server and client. */
export function mapping(seed = SEED): number[] {
  let a = seed >>> 0
  const rand = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const order = Array.from({ length: BITS }, (_, i) => i)
  for (let i = BITS - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return order
}

export const numRams = (n: number) => Math.ceil(BITS / n)
export const ramBits = (classes: number, n: number) => classes * numRams(n) * 2 ** n

/** The address each RAM sees for this drawing. The last tuple is short when n doesn't divide 256. */
export function addresses(g: Grid, n: number, order: readonly number[]): number[] {
  const out: number[] = []
  for (let r = 0; r < numRams(n); r++) {
    let addr = 0
    for (let j = 0; j < n; j++) {
      const k = r * n + j
      if (k < BITS && g[order[k]]) addr |= 1 << j
    }
    out.push(addr)
  }
  return out
}

function write(ram: Uint8Array, g: Grid, n: number, order: readonly number[]) {
  addresses(g, n, order).forEach((addr, r) => (ram[r * 2 ** n + addr] = 1))
}

function build(name: string, examples: Grid[], n: number, order: readonly number[]): WClass {
  const ram = new Uint8Array(numRams(n) * 2 ** n)
  for (const g of examples) write(ram, g, n, order)
  return { name, examples, ram }
}

function seedExamples(rows: string[][]): Grid[] {
  const out: Grid[] = []
  for (const r of rows) out.push(parse(r))
  return out
}

export function seedModel(tuple = TUPLE_DEFAULT): WModel {
  const order = mapping()
  const n = clampTuple(tuple)
  const classes = Object.entries(SEED_SAMPLES).map(([name, rows]) => build(name, seedExamples(rows), n, order))
  return { tuple: n, order, classes }
}

const clampTuple = (n: number) => Math.min(TUPLE_MAX, Math.max(TUPLE_MIN, Math.round(n)))

/** Re-partitions and retrains every class from its stored examples. */
export function setTuple(m: WModel, tuple: number): WModel {
  const n = clampTuple(tuple)
  return { ...m, tuple: n, classes: m.classes.map((c) => build(c.name, c.examples, n, m.order)) }
}

export type TeachError = 'empty-drawing' | 'no-name' | 'max-classes'

/** Adds this drawing to the named class, creating it if there is room (max 6). */
export function teach(m: WModel, rawName: string, g: Grid): { model: WModel; created: boolean; error?: TeachError } {
  const name = rawName.trim().slice(0, 16)
  if (!name) return { model: m, created: false, error: 'no-name' }
  if (isEmpty(g)) return { model: m, created: false, error: 'empty-drawing' }
  const at = m.classes.findIndex((c) => c.name.toLowerCase() === name.toLowerCase())
  if (at < 0 && m.classes.length >= MAX_CLASSES) return { model: m, created: false, error: 'max-classes' }
  const copy = Uint8Array.from(g)
  const classes =
    at < 0
      ? [...m.classes, build(name, [copy], m.tuple, m.order)]
      : m.classes.map((c, i) => (i === at ? build(c.name, [...c.examples, copy], m.tuple, m.order) : c))
  return { model: { ...m, classes }, created: at < 0 }
}

export function classify(m: WModel, g: Grid): number[] {
  const addrs = addresses(g, m.tuple, m.order)
  const size = 2 ** m.tuple
  return m.classes.map((c) => addrs.reduce((sum, addr, r) => sum + c.ram[r * size + addr], 0))
}

export type Verdict =
  | { kind: 'empty' }
  | { kind: 'winner' | 'tie'; top: number; second: number; topCount: number; secondCount: number; gap: number }

export function verdict(counts: readonly number[], empty: boolean): Verdict {
  if (empty || counts.length === 0) return { kind: 'empty' }
  const order = counts.map((c, i) => [c, i] as const).sort((a, b) => b[0] - a[0] || a[1] - b[1])
  const [topCount, top] = order[0]
  const [secondCount, second] = order[1] ?? [0, -1]
  const gap = topCount - secondCount
  return { kind: gap > TIE_MARGIN ? 'winner' : 'tie', top, second, topCount, secondCount, gap }
}

/** "Classified as wave: 23 of 64 RAMs, 9 ahead of shell." and friends. */
export function verdictText(v: Verdict, names: readonly string[], rams: number): string {
  if (v.kind === 'empty') return 'Draw something'
  if (v.kind === 'tie') return `Too close to call: ${names[v.top]} ${v.topCount}, ${names[v.second]} ${v.secondCount}.`
  return `Classified as ${names[v.top]}: ${v.topCount} of ${rams} RAMs, ${v.gap} ahead of ${names[v.second]}.`
}
