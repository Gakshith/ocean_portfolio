// STUB (lead, phase 2 freeze): bake_agent replaces this and keeps the exports.
// Camera travel windows in scroll-y px. Default: [top(to) - vh, top(to) - 0.3vh], i.e. the next
// section's top moves 100% → 30% of the viewport. cybot>contact: [top(contact) - 0.6vh, top(contact) + 0.4vh].
import type { SectionId } from '../state/sections'

export type TravelKey = `${SectionId}>${SectionId}`
export type TravelWindow = (vh: number, top: (id: SectionId) => number) => [number, number]

export const TRAVEL: Partial<Record<TravelKey, TravelWindow>> = {}
