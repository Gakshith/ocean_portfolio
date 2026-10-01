// SM-2 timing as pure functions of time (plan S7 Motion, 03-motion SM-2 table). Everything the
// reef shows during the power-up is reefState(t): pad light, contact outlines, wire draw, chips.
// The renderer and the DOM chips read the same state, so they can't drift apart.

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
export const power2Out = (x: number) => 1 - (1 - x) * (1 - x)
export const power2InOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2)
export const power3Out = (x: number) => 1 - Math.pow(1 - x, 3)
export const expoOut = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x))

export const RING = {
  /** 60 pads × 12 ms = a 720 ms clockwise sweep. */
  stagger: 12,
  up: 160,
  down: 450,
  /** Aluminium pad light: rest before, peak, rest after (R-10: only contact pads turn sea). */
  from: 0.32,
  peak: 1,
  rest: 0.55,
  /** Contact pads ride the wave from their own rest. */
  contactFrom: 0.5,
  contactRest: 0.5,
  /** The five contact pads take a sea outline and draw their bond wires. */
  contactAt: 620,
  contactStagger: 70,
  outlineDur: 240,
  wireDur: 520,
  /** The DOM lead chips surface. */
  chipAt: 980,
  chipDur: 240,
  chipRise: 6,
  /** Hover / focus: a packet runs down the wire, then fades. */
  packetDur: 420,
  packetFade: 150,
} as const

export interface ReefState {
  /** Light per pad in ring order, 0..1 (× the pad's colour). */
  pad: Float32Array
  /** Per contact k = 1..5 (index k−1). */
  outline: number[]
  wire: number[]
  chip: { opacity: number; dy: number }[]
  /** Nothing moves any more: the loop can idle. */
  done: boolean
}

/** End of the whole power-up, ms after the trigger. */
export const RING_END = Math.max(
  59 * RING.stagger + RING.up + RING.down,
  RING.contactAt + 4 * RING.contactStagger + Math.max(RING.outlineDur, RING.wireDur),
  RING.chipAt + 4 * RING.contactStagger + RING.chipDur,
)

/**
 * @param t ms since S7's top crossed 70% of the viewport; null = not triggered yet.
 * @param contactRing ring indices of the five contact pads (k order).
 * @param reduced reduced motion / Still: everything rests lit at once, nothing pulses.
 */
export function reefState(t: number | null, contactRing: readonly number[], reduced: boolean, n = 60): ReefState {
  const pad = new Float32Array(n)
  const isContact = new Set(contactRing)
  if (reduced || (t !== null && t >= RING_END)) {
    for (let i = 0; i < n; i++) pad[i] = isContact.has(i) ? RING.contactRest : RING.rest
    return { pad, outline: [1, 1, 1, 1, 1], wire: [1, 1, 1, 1, 1], chip: Array.from({ length: 5 }, () => ({ opacity: 1, dy: 0 })), done: true }
  }
  for (let i = 0; i < n; i++) {
    const c = isContact.has(i)
    const from = c ? RING.contactFrom : RING.from
    const rest = c ? RING.contactRest : RING.rest
    if (t === null) {
      pad[i] = from
      continue
    }
    const local = t - i * RING.stagger
    if (local <= 0) pad[i] = from
    else if (local < RING.up) pad[i] = from + (RING.peak - from) * power2Out(local / RING.up)
    else pad[i] = RING.peak + (rest - RING.peak) * power2InOut(clamp01((local - RING.up) / RING.down))
  }
  const outline: number[] = []
  const wire: number[] = []
  const chip: { opacity: number; dy: number }[] = []
  for (let k = 0; k < 5; k++) {
    const tk = t === null ? -1 : t - RING.contactAt - k * RING.contactStagger
    outline.push(tk <= 0 ? 0 : expoOut(clamp01(tk / RING.outlineDur)))
    wire.push(tk <= 0 ? 0 : power3Out(clamp01(tk / RING.wireDur)))
    const tc = t === null ? -1 : t - RING.chipAt - k * RING.contactStagger
    const e = tc <= 0 ? 0 : power2Out(clamp01(tc / RING.chipDur))
    chip.push({ opacity: e, dy: (1 - e) * RING.chipRise })
  }
  return { pad, outline, wire, chip, done: false }
}

/** The hover packet: its head along the wire (0 at the pad, 1 at the lead) and its opacity.
 *  null when it has finished. Reduced motion: no packet (the wire is simply lit). */
export function packet(t: number, reduced: boolean): { head: number; opacity: number } | null {
  if (reduced || t < 0) return null
  if (t < RING.packetDur) return { head: expoOut(t / RING.packetDur), opacity: 1 }
  const f = (t - RING.packetDur) / RING.packetFade
  return f >= 1 ? null : { head: 1, opacity: 1 - f }
}
