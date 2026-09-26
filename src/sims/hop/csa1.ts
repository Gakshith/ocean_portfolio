// Hop: BLE Channel Selection Algorithm #1 on one connection, as a pure teaching model.
// No DOM, no timers: the renderer calls step() once per connection event.
//
//   unmapped = (lastUnmapped + hopIncrement) mod 37
//   channel  = unmapped if it is used, else used[unmapped mod numUsed] (used = ascending table)
//   the next event always starts from lastUnmapped, never from the remapped channel.
// A channel map change is an LL_CHANNEL_MAP_IND procedure: staged, sent with instant = n + 6,
// applied at that connection event. One update in flight; at least 2 used channels.

export const NUM_DATA = 37
export const HOP_MIN = 5
export const HOP_MAX = 16
export const HOP_DEFAULT = 7
export const INSTANT_OFFSET = 6
export const MIN_USED = 2
/** Connection events kept for the spectrogram. */
export const LOG_CAP = 48
/** Data channels under the "whale song" (stand-in for interference, e.g. Wi-Fi). */
export const WHALE: readonly number[] = [10, 11, 12, 13, 14, 15]

export type ChannelMap = readonly boolean[] // length 37, true = used

export interface HopEvent {
  event: number
  lastUnmapped: number
  unmapped: number
  channel: number
  remapped: boolean
  /** Landed on a used channel under the whale song. */
  lost: boolean
  /** The pending map took effect at this event (its instant). */
  mapApplied: boolean
}

export interface HopState {
  hop: number
  /** Connection event counter of the next event to run. */
  nextEvent: number
  lastUnmapped: number
  /** The map in force. */
  map: ChannelMap
  /** The map being edited (equals `map` when nothing is staged). */
  staged: ChannelMap
  /** The LL_CHANNEL_MAP_IND in flight. */
  update: { map: ChannelMap; instant: number } | null
  log: readonly HopEvent[]
}

export type HopError = 'in-flight' | 'min-used' | 'no-change' | 'advertising'

export const ALL_USED: ChannelMap = Array.from({ length: NUM_DATA }, () => true)

/** Centre frequency in MHz, channels 0–39 (37/38/39 are advertising). */
export function freqMHz(ch: number): number {
  if (ch === 37) return 2402
  if (ch === 38) return 2426
  if (ch === 39) return 2480
  return ch <= 10 ? 2404 + 2 * ch : 2428 + 2 * (ch - 11)
}

/** All 40 channels, lowest frequency first. */
export const LANES: readonly number[] = Array.from({ length: 40 }, (_, i) => i).sort(
  (a, b) => freqMHz(a) - freqMHz(b),
)

export function usedTable(map: ChannelMap): number[] {
  const t: number[] = []
  map.forEach((u, ch) => u && t.push(ch))
  return t
}

export function countUsed(map: ChannelMap): number {
  return map.filter(Boolean).length
}

export function selectChannel(lastUnmapped: number, hop: number, map: ChannelMap) {
  const unmapped = (lastUnmapped + hop) % NUM_DATA
  if (map[unmapped]) return { unmapped, channel: unmapped, remapped: false, remapIndex: -1 }
  const table = usedTable(map)
  const remapIndex = unmapped % table.length
  return { unmapped, channel: table[remapIndex], remapped: true, remapIndex }
}

export function connect(hop = HOP_DEFAULT, map: ChannelMap = ALL_USED): HopState {
  const h = Math.min(HOP_MAX, Math.max(HOP_MIN, Math.round(hop)))
  return { hop: h, nextEvent: 0, lastUnmapped: 0, map, staged: map, update: null, log: [] }
}

export function step(s: HopState): HopState {
  const event = s.nextEvent
  let { map, staged, update } = s
  const mapApplied = update !== null && update.instant === event
  if (mapApplied) {
    map = update!.map
    staged = map
    update = null
  }
  const sel = selectChannel(s.lastUnmapped, s.hop, map)
  const entry: HopEvent = {
    event,
    lastUnmapped: s.lastUnmapped,
    unmapped: sel.unmapped,
    channel: sel.channel,
    remapped: sel.remapped,
    lost: WHALE.includes(sel.channel),
    mapApplied,
  }
  const log = [...s.log, entry]
  return {
    ...s,
    map,
    staged,
    update,
    nextEvent: event + 1,
    lastUnmapped: sel.unmapped,
    log: log.length > LOG_CAP ? log.slice(log.length - LOG_CAP) : log,
  }
}

export function run(s: HopState, events: number): HopState {
  for (let i = 0; i < events; i++) s = step(s)
  return s
}

/** The deterministic state the sim opens on: a fresh connection with 8 events run. */
export function opening(): HopState {
  return run(connect(), 8)
}

/** Moving the hop slider is a new connection (CONNECT_IND); the map in force carries over. */
export function newConnection(s: HopState, hop: number): HopState {
  return connect(hop, s.map)
}

/** Where each channel ends up once any pending change lands. */
export function target(s: HopState): ChannelMap {
  return s.update ? s.update.map : s.staged
}

export type ChipState = 'used' | 'pending-bad' | 'pending-used' | 'bad'

export function chipState(s: HopState, ch: number): ChipState {
  const now = s.map[ch]
  const next = target(s)[ch]
  if (now === next) return now ? 'used' : 'bad'
  return next ? 'pending-used' : 'pending-bad'
}

/** Would staging `ch` as bad be refused by the 2-channel minimum? */
export function atMinimum(s: HopState, ch: number): boolean {
  return s.staged[ch] && countUsed(s.staged) <= MIN_USED
}

export function toggleStaged(s: HopState, ch: number): { state: HopState; error?: HopError } {
  if (ch < 0 || ch >= NUM_DATA) return { state: s, error: 'advertising' }
  if (s.update) return { state: s, error: 'in-flight' }
  if (atMinimum(s, ch)) return { state: s, error: 'min-used' }
  const staged = s.staged.map((u, i) => (i === ch ? !u : u))
  return { state: { ...s, staged } }
}

export function hasStagedChange(s: HopState): boolean {
  return !s.update && s.staged.some((u, i) => u !== s.map[i])
}

/** Sends LL_CHANNEL_MAP_IND with instant = n + 6, n being the event just run. */
export function sendUpdate(s: HopState): { state: HopState; error?: HopError } {
  if (s.update) return { state: s, error: 'in-flight' }
  if (!hasStagedChange(s)) return { state: s, error: 'no-change' }
  const n = s.nextEvent - 1
  return { state: { ...s, update: { map: s.staged, instant: n + INSTANT_OFFSET } } }
}

/** Events left until the instant (6 right after sending, 1 just before it lands). */
export function countdown(s: HopState): number | null {
  return s.update ? s.update.instant - (s.nextEvent - 1) : null
}

/** One-tap demo: stage every whale-covered channel as bad and send. */
export function avoidWhale(s: HopState): { state: HopState; error?: HopError } {
  if (s.update) return { state: s, error: 'in-flight' }
  const staged = s.map.map((u, ch) => u && !WHALE.includes(ch))
  if (countUsed(staged) < MIN_USED) return { state: s, error: 'min-used' }
  if (staged.every((u, i) => u === s.map[i])) return { state: s, error: 'no-change' }
  return sendUpdate({ ...s, staged })
}
