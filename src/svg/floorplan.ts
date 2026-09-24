// STUB (lead, freeze commit). sections_agent owns and replaces this file; keep these exports.
// Placeholder geometry in die units; the real floorplan follows the plan's S2 "Visual".
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
  { section: 'link-layer', label: 'Radio', x: 14, y: 14, w: 42, h: 14, layer: 'm2-violet' },
  { section: 'risc-v', label: 'CPU', x: 14, y: 34, w: 40, h: 16, layer: 'm1-copper' },
  { section: 'wisard', label: 'Memory', x: 60, y: 30, w: 26, h: 18, layer: 'm3-oxide' },
]

export const uartPad = { x: 88, y: 88 } as const
