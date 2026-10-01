// The S6 scrub (C-14) as a pure function of scrub progress p ∈ [0, 1]: what is drawn at p.
// The UART line draws in over the first 8%. PING k's forward cone fills outward over 8%, starting
// at 10% + 18%·k (the plan's 20% spacing would leave 2% for the bump sequence after the last
// ping), and its echo appears only once the cone's front reaches the obstacle. Between pings the
// robot drives the path it chose, turning in place before it moves; IR and bump appear when it
// reaches them. At p = 1 the drawing is exactly the static diagram. Text is never keyed to p.
import { POSES, PING_RANGE, pings, type Pose } from './course'

export const UART_END = 0.08
export const PING_DUR = 0.08
export const pingStart = (k: number) => 0.1 + 0.18 * k

const PINGS = pings()
/** POSES index of each ping, in order. */
const PING_AT = POSES.flatMap((p, i) => (p.ping ? [i] : []))
const IR_AT = POSES.findIndex((p) => p.ir)
const BUMP_AT = POSES.findIndex((p) => p.bump)

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const ease = (x: number) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2) // smooth, no overshoot

/** The time window [a, b] over which the robot moves from POSES[i] to POSES[i + 1]. */
function segmentWindows(): [number, number][] {
  const out: [number, number][] = []
  const legs: [number, number, number, number][] = [] // [fromPose, toPose, t0, t1]
  for (let k = 0; k < PING_AT.length; k++) {
    const from = PING_AT[k]
    const to = k + 1 < PING_AT.length ? PING_AT[k + 1] : POSES.length - 1
    const t0 = pingStart(k) + PING_DUR
    const t1 = k + 1 < PING_AT.length ? pingStart(k + 1) : 1
    legs.push([from, to, t0, t1])
  }
  for (const [from, to, t0, t1] of legs) {
    // Share the leg by path length, with a floor so a turn in place still takes a moment.
    const w: number[] = []
    for (let i = from; i < to; i++) w.push(Math.hypot(POSES[i + 1].x - POSES[i].x, POSES[i + 1].y - POSES[i].y) + 40)
    const sum = w.reduce((a, b) => a + b, 0)
    let t = t0
    for (let i = from; i < to; i++) {
      const d = ((t1 - t0) * w[i - from]) / sum
      out[i] = [t, t + d]
      t += d
    }
  }
  return out
}
const SEG = segmentWindows()

const turn = (a: number, b: number, f: number) => {
  const d = ((((b - a + 180) % 360) + 360) % 360) - 180
  return a + d * f
}

export interface ScrubFrame {
  /** 0..1 of the UART hairline drawn. */
  uart: number
  /** Per ping: how far the cone has filled (0..1), and whether its echo shows. */
  cones: { n: number; fill: number; echo: boolean }[]
  robot: Pose
  /** Path vertices reached so far, ending at the robot. */
  path: { x: number; y: number }[]
  ir: boolean
  bump: boolean
}

export function scrubFrame(pIn: number): ScrubFrame {
  const p = clamp01(pIn)
  const cones = PINGS.map((q, k) => {
    const fill = clamp01((p - pingStart(k)) / PING_DUR)
    return { n: q.n, fill, echo: !!q.echo && fill * PING_RANGE >= q.echo.d }
  })
  let robot: Pose = { ...POSES[0] }
  const path = [{ x: POSES[0].x, y: POSES[0].y }]
  let reached = 0
  for (let i = 0; i < SEG.length; i++) {
    const [a, b] = SEG[i]
    if (p <= a) break
    const f = clamp01((p - a) / (b - a))
    const A = POSES[i]
    const B = POSES[i + 1]
    // turn first (30% of the segment), then drive
    const h = turn(A.h, B.h, ease(clamp01(f / 0.3)))
    const m = ease(clamp01((f - 0.3) / 0.7))
    robot = { x: A.x + (B.x - A.x) * m, y: A.y + (B.y - A.y) * m, h }
    path.push({ x: robot.x, y: robot.y })
    if (f >= 1) {
      reached = i + 1
      path[path.length - 1] = { x: B.x, y: B.y }
    } else break
  }
  return {
    uart: clamp01(p / UART_END),
    cones,
    robot,
    path,
    ir: reached >= IR_AT,
    bump: reached >= BUMP_AT,
  }
}
