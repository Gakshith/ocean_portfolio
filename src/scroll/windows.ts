// Camera travel windows in scroll-y px, one table (contract seam 2). The camera travels only while
// a window is open and dwells otherwise. Default: the next section's top moves from 100% to 30% of
// the viewport. cybot>contact is the plan's C4 → C5 rise: the last 60vh of S6 plus the first 40vh
// of S7 (viewport-top terms).
import { SECTIONS, type SectionId } from '../state/sections'

export type TravelKey = `${SectionId}>${SectionId}`
export type TravelWindow = (vh: number, top: (id: SectionId) => number) => [number, number]

export const DEFAULT_WINDOW = (to: SectionId): TravelWindow => (vh, top) => [top(to) - vh, top(to) - 0.3 * vh]

export const TRAVEL: Partial<Record<TravelKey, TravelWindow>> = {
  'cybot>contact': (vh, top) => [top('contact') - 0.6 * vh, top('contact') + 0.4 * vh],
}

/** The consecutive pairs in page order, each with its window. */
export function travelPairs(): { from: SectionId; to: SectionId; win: TravelWindow }[] {
  const out: { from: SectionId; to: SectionId; win: TravelWindow }[] = []
  for (let i = 1; i < SECTIONS.length; i++) {
    const from = SECTIONS[i - 1].id
    const to = SECTIONS[i].id
    out.push({ from, to, win: TRAVEL[`${from}>${to}`] ?? DEFAULT_WINDOW(to) })
  }
  return out
}
