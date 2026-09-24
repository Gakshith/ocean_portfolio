// CyBot echo diagram: an illustrative course (not a recording) whose drawing is computed from
// geometry, so every mark follows the physics: a PING is a forward cone (±20°), an echo exists
// only where that cone meets an obstacle, IR is a short forward ray, bump is contact.
// Units are SVG units; 1 unit = 5 mm.

export const VIEW = { w: 1000, h: 600 }
export const MM_PER_UNIT = 5
export const R_BOT = 30
export const PING_RANGE = 300
export const HALF_ANGLE = 20
/** IR reach, measured from the robot's front edge. */
export const IR_RANGE = 60
/** Speed of sound in air, m/s. */
export const V_SOUND = 343

export interface Pt {
  x: number
  y: number
}
export interface Seg {
  id: string
  a: Pt
  b: Pt
}

/** Obstacles are never drawn; only their echoes are. */
export const OBSTACLES: readonly Seg[] = [
  { id: 'A', a: { x: 560, y: 60 }, b: { x: 560, y: 240 } },
  { id: 'B', a: { x: 180, y: 560 }, b: { x: 520, y: 560 } },
  { id: 'C', a: { x: 760, y: 250 }, b: { x: 760, y: 470 } },
  { id: 'E', a: { x: 660, y: 388 }, b: { x: 660, y: 402 } }, // low and to the side: felt only by bump
  { id: 'F', a: { x: 500, y: 580 }, b: { x: 950, y: 580 } },
]

export interface Pose extends Pt {
  /** Heading in degrees, 0 = +x (east), 90 = +y (down the page). */
  h: number
  ping?: boolean
  ir?: boolean
  bump?: boolean
}

/** The path, in order. Turns happen in place at a pose, after its sensor reading. */
export const POSES: readonly Pose[] = [
  { x: 130, y: 140, h: 0, ping: true }, // nothing ahead: drive on
  { x: 330, y: 140, h: 0, ping: true }, // echo ahead: turn right
  { x: 330, y: 330, h: 90, ping: true }, // echo ahead: turn left
  { x: 560, y: 330, h: 0, ping: true }, // echo ahead, still far: creep closer
  { x: 690, y: 330, h: 0, ir: true }, // IR sees it close: turn right
  { x: 690, y: 330, h: 90, ping: true }, // far echo: drive on
  { x: 690, y: 390, h: 90, bump: true }, // bump on the left side
  { x: 690, y: 370, h: 90 }, // back off
  { x: 715, y: 440, h: 70 }, // veer right, away from the bump
  { x: 715, y: 520, h: 90 },
]

export const UART_FROM: Pt = { x: 0, y: 140 }

const rad = (d: number) => (d * Math.PI) / 180
const dist = (p: Pt, q: Pt) => Math.hypot(p.x - q.x, p.y - q.y)
const lerp = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })

/** Signed angle from the heading to the point, in degrees (−180, 180]. */
export function bearing(from: Pose, p: Pt): number {
  const a = (Math.atan2(p.y - from.y, p.x - from.x) * 180) / Math.PI - from.h
  return ((((a + 180) % 360) + 360) % 360) - 180
}

export function inCone(from: Pose, p: Pt): boolean {
  return Math.abs(bearing(from, p)) <= HALF_ANGLE && dist(from, p) <= PING_RANGE
}

const SAMPLES = 400

/** The part of a segment inside the cone, if any. */
export function clipToCone(from: Pose, s: Seg): { a: Pt; b: Pt; near: number } | null {
  let first: Pt | null = null
  let last: Pt | null = null
  let near = Infinity
  for (let k = 0; k <= SAMPLES; k++) {
    const p = lerp(s.a, s.b, k / SAMPLES)
    if (!inCone(from, p)) continue
    first ??= p
    last = p
    near = Math.min(near, dist(from, p))
  }
  return first && last ? { a: first, b: last, near } : null
}

export interface Ping {
  n: number
  pose: Pose
  /** Cone polygon points: apex, then the arc. */
  cone: Pt[]
  echo: { obstacle: string; a: Pt; b: Pt; d: number; tMs: number; dM: number } | null
}

export function pings(): Ping[] {
  return POSES.filter((p) => p.ping).map((pose, k) => {
    const hits = OBSTACLES.map((o) => ({ o, c: clipToCone(pose, o) })).filter((h) => h.c)
    hits.sort((p, q) => p.c!.near - q.c!.near)
    const hit = hits[0]
    const cone: Pt[] = [{ x: pose.x, y: pose.y }]
    for (let a = -HALF_ANGLE; a <= HALF_ANGLE; a += 5)
      cone.push({ x: pose.x + PING_RANGE * Math.cos(rad(pose.h + a)), y: pose.y + PING_RANGE * Math.sin(rad(pose.h + a)) })
    let echo: Ping['echo'] = null
    if (hit) {
      const dM = (hit.c!.near * MM_PER_UNIT) / 1000
      echo = { obstacle: hit.o.id, a: hit.c!.a, b: hit.c!.b, d: hit.c!.near, dM, tMs: ((2 * dM) / V_SOUND) * 1000 }
    }
    return { n: k + 1, pose, cone, echo }
  })
}

/** Distance from p to segment s. */
export function segDist(p: Pt, s: Seg): number {
  const dx = s.b.x - s.a.x
  const dy = s.b.y - s.a.y
  const t = Math.max(0, Math.min(1, ((p.x - s.a.x) * dx + (p.y - s.a.y) * dy) / (dx * dx + dy * dy)))
  return dist(p, lerp(s.a, s.b, t))
}

/** IR: a short ray from the front edge along the heading to the obstacle it reaches. */
export function irRays(): { from: Pt; to: Pt; pose: Pose }[] {
  return POSES.filter((p) => p.ir).flatMap((pose) => {
    const from = { x: pose.x + R_BOT * Math.cos(rad(pose.h)), y: pose.y + R_BOT * Math.sin(rad(pose.h)) }
    for (let s = 0; s <= IR_RANGE; s += 0.5) {
      const p = { x: from.x + s * Math.cos(rad(pose.h)), y: from.y + s * Math.sin(rad(pose.h)) }
      if (OBSTACLES.some((o) => segDist(p, o) < 0.5)) return [{ from, to: p, pose }]
    }
    return []
  })
}

/** Bump: where the robot's outline touches an obstacle. */
export function bumps(): { pose: Pose; at: Pt; angle: number }[] {
  return POSES.filter((p) => p.bump).flatMap((pose) => {
    const o = OBSTACLES.find((s) => segDist(pose, s) <= R_BOT + 0.01)
    if (!o) return []
    const angle = (Math.atan2(nearestOn(pose, o).y - pose.y, nearestOn(pose, o).x - pose.x) * 180) / Math.PI
    return [{ pose, at: nearestOn(pose, o), angle }]
  })
}

function nearestOn(p: Pt, s: Seg): Pt {
  const dx = s.b.x - s.a.x
  const dy = s.b.y - s.a.y
  const t = Math.max(0, Math.min(1, ((p.x - s.a.x) * dx + (p.y - s.a.y) * dy) / (dx * dx + dy * dy)))
  return lerp(s.a, s.b, t)
}

/** Closest approach of the robot centre to each obstacle along the whole path. */
export function clearance(): Record<string, number> {
  const out: Record<string, number> = {}
  for (const o of OBSTACLES) {
    let m = Infinity
    for (let i = 1; i < POSES.length; i++)
      for (let k = 0; k <= 200; k++) m = Math.min(m, segDist(lerp(POSES[i - 1], POSES[i], k / 200), o))
    out[o.id] = m
  }
  return out
}
