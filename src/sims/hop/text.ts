// Words for the Hop twin and formula line, shared by the renderer and the tests.
import { usedTable, type HopEvent, type HopState } from './csa1'

export function formula(e: HopEvent | undefined, s: HopState): string {
  if (!e) return `CONNECT_IND · hop = ${s.hop} · waiting for event 0`
  const head = `event ${e.event} · unmapped = (lastUnmapped + hop) mod 37 = (${e.lastUnmapped} + ${s.hop}) mod 37 = ${e.unmapped}`
  if (!e.remapped) return `${head} → used → ch${e.channel}`
  // the table the event was selected with is the map in force at that event
  const n = usedTable(s.map).length
  return `${head} → unused → used[${e.unmapped} mod ${n}] = ch${e.channel}`
}

export const hopEntry = (e: HopEvent) =>
  `${e.unmapped}→${e.remapped ? `ch${e.channel}` : e.channel}${e.lost ? ' lost' : ''}`
