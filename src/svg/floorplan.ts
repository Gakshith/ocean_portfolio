// The illustrative die, in die units (0–100, y down). One source for the S1 still, the S2 die
// map, the S7 atoll and chrome's minimap. Plan, S2 "Visual": Radio a wide NW block (~3:1),
// CPU centre-west (~5:2), Memory east (~3:2), the south third open lagoon facing the contact
// pads on the S reef, and the UART pad on the SE reef.
import type { SectionId } from '../state/sections'

export const DIE = { w: 100, h: 100 } as const

export interface Block {
  section: SectionId
  label: string
  x: number
  y: number
  w: number
  h: number
  layer: 'm2-violet' | 'm1-copper' | 'm3-oxide'
}

export const blocks: readonly Block[] = [
  { section: 'link-layer', label: 'Radio', x: 14, y: 14, w: 57, h: 19, layer: 'm2-violet' },
  { section: 'risc-v', label: 'CPU', x: 14, y: 39, w: 45, h: 18, layer: 'm1-copper' },
  { section: 'wisard', label: 'Memory', x: 65, y: 39, w: 21, h: 14, layer: 'm3-oxide' },
]

/** Seal rings (outer, inner) and the core the blocks sit in. */
export const seal = { outer: 0.5, inner: 2 } as const
export const core = { x: 10, y: 10, w: 80, h: 80 } as const
/** The lagoon: the open south third of the core. */
export const lagoon = { x: 14, y: 62, w: 72, h: 24 } as const

export type Side = 'n' | 'e' | 's' | 'w'
export interface Pad {
  side: Side
  /** Index along the side, 0..PADS_PER_SIDE-1, clockwise-agnostic (left→right, top→bottom). */
  i: number
  /** Centre, die units. */
  x: number
  y: number
  /** 1..5 for the five contact pads (S7 rows 01–05), else null. */
  contact: number | null
  uart: boolean
}

export const PADS_PER_SIDE = 15
export const PAD_SIZE = 2.4
const RING = 5 // pad-ring centreline inset from the die edge
const span = (i: number) => 10 + (i * 80) / (PADS_PER_SIDE - 1)

// Contact pads: five in the middle 60% of the S edge. UART: the E side, next to the SE corner.
const CONTACT_I = [3, 5, 7, 9, 11]
const UART_I = 13

function makePads(): Pad[] {
  const out: Pad[] = []
  for (let i = 0; i < PADS_PER_SIDE; i++) {
    out.push({ side: 'n', i, x: span(i), y: RING, contact: null, uart: false })
    out.push({ side: 'e', i, x: DIE.w - RING, y: span(i), contact: null, uart: i === UART_I })
    const c = CONTACT_I.indexOf(i)
    out.push({ side: 's', i, x: span(i), y: DIE.h - RING, contact: c < 0 ? null : c + 1, uart: false })
    out.push({ side: 'w', i, x: RING, y: span(i), contact: null, uart: false })
  }
  return out
}

/** All 60 pads of the reef. */
export const pads: readonly Pad[] = makePads()

const uart = pads.find((p) => p.uart)!
export const uartPad = { x: uart.x, y: uart.y } as const
