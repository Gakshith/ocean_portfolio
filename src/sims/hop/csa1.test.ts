import { describe, expect, it } from 'vitest'
import {
  ALL_USED,
  LANES,
  avoidWhale,
  chipState,
  connect,
  countdown,
  freqMHz,
  newConnection,
  run,
  selectChannel,
  sendUpdate,
  step,
  toggleStaged,
  usedTable,
  WHALE,
  type ChannelMap,
} from './csa1'

const without = (...bad: number[]): ChannelMap => ALL_USED.map((_, ch) => !bad.includes(ch))

describe('channels', () => {
  it('maps channel index to centre frequency, advertising at their real places', () => {
    expect(freqMHz(37)).toBe(2402)
    expect(freqMHz(0)).toBe(2404)
    expect(freqMHz(10)).toBe(2424)
    expect(freqMHz(38)).toBe(2426)
    expect(freqMHz(11)).toBe(2428)
    expect(freqMHz(36)).toBe(2478)
    expect(freqMHz(39)).toBe(2480)
  })

  it('orders the 40 lanes by frequency', () => {
    expect(LANES).toHaveLength(40)
    expect(LANES[0]).toBe(37)
    expect(LANES[12]).toBe(38) // 37, then 0..10, then 38
    expect(LANES[39]).toBe(39)
  })
})

describe('CSA#1', () => {
  it('hops (lastUnmapped + hop) mod 37 with every channel used, starting from 0', () => {
    const s = run(connect(7), 7)
    expect(s.log.map((e) => e.channel)).toEqual([7, 14, 21, 28, 35, 5, 12])
    expect(s.log.every((e) => !e.remapped)).toBe(true)
  })

  it('remaps an unused channel to used[unmapped mod numUsed]', () => {
    const map = without(7)
    const sel = selectChannel(0, 7, map)
    expect(sel.unmapped).toBe(7)
    expect(sel.remapped).toBe(true)
    // used table skips 7, so index 7 holds channel 8
    expect(usedTable(map)[7]).toBe(8)
    expect(sel.channel).toBe(8)
  })

  it('remaps with numUsed < unmapped (wraps the index)', () => {
    const map = without(...Array.from({ length: 27 }, (_, i) => i + 10)) // used: 0..9
    const sel = selectChannel(20, 9, map) // unmapped 29
    expect(sel.unmapped).toBe(29)
    expect(sel.channel).toBe(29 % 10)
  })

  it('starts the next hop from lastUnmapped, not from the remapped channel', () => {
    const s = run(connect(7, without(7)), 2)
    expect(s.log[0]).toMatchObject({ unmapped: 7, channel: 8, remapped: true })
    expect(s.log[1]).toMatchObject({ lastUnmapped: 7, unmapped: 14, channel: 14 })
  })

  it('marks a hop that lands under the whale song as lost', () => {
    const s = run(connect(5), 3) // 5, 10, 15
    expect(s.log.map((e) => [e.channel, e.lost])).toEqual([
      [5, false],
      [10, true],
      [15, true],
    ])
  })
})

describe('LL_CHANNEL_MAP_IND', () => {
  it('stages without changing the map in force', () => {
    const { state } = toggleStaged(connect(), 3)
    expect(state.map[3]).toBe(true)
    expect(state.staged[3]).toBe(false)
    expect(chipState(state, 3)).toBe('pending-bad')
  })

  it('applies the staged map exactly at instant n + 6', () => {
    let s = run(connect(7), 10) // events 0..9 ran, n = 9
    s = toggleStaged(s, 7).state
    const sent = sendUpdate(s)
    expect(sent.error).toBeUndefined()
    s = sent.state
    expect(s.update?.instant).toBe(15)
    expect(countdown(s)).toBe(6)
    s = run(s, 5) // events 10..14 still use the old map
    expect(s.map[7]).toBe(true)
    expect(countdown(s)).toBe(1)
    expect(s.log.at(-1)!.mapApplied).toBe(false)
    s = step(s) // event 15 = instant
    expect(s.log.at(-1)).toMatchObject({ event: 15, mapApplied: true })
    expect(s.map[7]).toBe(false)
    expect(s.update).toBeNull()
    expect(chipState(s, 7)).toBe('bad')
  })

  it('uses the new map at the instant event itself', () => {
    // hop 7 from 0: event 0 → 7. Send before any event: n = -1, instant = 5.
    let s = connect(7)
    s = sendUpdate(toggleStaged(s, 35).state).state
    expect(s.update?.instant).toBe(5)
    s = run(s, 5) // 7, 14, 21, 28, 35 (event 4 is before the instant)
    expect(s.log.at(-1)!.channel).toBe(35)
    s = run(connect(7), 0)
    s = sendUpdate(toggleStaged(s, 5).state).state
    s = run(s, 6) // event 5 → unmapped 5, now unused → remapped
    expect(s.log.at(-1)).toMatchObject({ event: 5, unmapped: 5, remapped: true, mapApplied: true })
  })

  it('allows one update in flight', () => {
    let s = sendUpdate(toggleStaged(connect(), 3).state).state
    expect(toggleStaged(s, 4).error).toBe('in-flight')
    expect(sendUpdate(s).error).toBe('in-flight')
    expect(avoidWhale(s).error).toBe('in-flight')
    s = run(s, 6)
    expect(s.update).toBeNull()
    expect(toggleStaged(s, 4).error).toBeUndefined()
  })

  it('refuses to send when nothing is staged', () => {
    expect(sendUpdate(connect()).error).toBe('no-change')
  })

  it('keeps at least 2 used channels', () => {
    let s = connect(7, without(...Array.from({ length: 34 }, (_, i) => i + 3))) // used 0,1,2
    s = toggleStaged(s, 0).state
    expect(toggleStaged(s, 1).error).toBe('min-used')
    expect(toggleStaged(s, 2).error).toBe('min-used')
    // re-enabling is always allowed
    expect(toggleStaged(s, 0).error).toBeUndefined()
  })

  it('avoids the whale song in one update and never lands there again', () => {
    let s = run(connect(5), 4)
    const r = avoidWhale(s)
    expect(r.error).toBeUndefined()
    s = run(r.state, 6)
    for (const ch of WHALE) expect(s.map[ch]).toBe(false)
    s = run(s, 37 * 3)
    expect(s.log.some((e) => WHALE.includes(e.channel))).toBe(false)
  })
})

describe('connection', () => {
  it('fixes hop per connection; a new hop is a new CONNECT_IND that resets the log', () => {
    let s = sendUpdate(toggleStaged(run(connect(7), 12), 3).state).state
    s = newConnection(s, 9)
    expect(s).toMatchObject({ hop: 9, nextEvent: 0, lastUnmapped: 0, update: null, log: [] })
    expect(s.map[3]).toBe(true) // the unsent (in-flight) update is dropped with the old connection
    expect(run(s, 1).log[0].channel).toBe(9)
  })

  it('clamps hop to 5–16', () => {
    expect(connect(2).hop).toBe(5)
    expect(connect(40).hop).toBe(16)
  })
})
