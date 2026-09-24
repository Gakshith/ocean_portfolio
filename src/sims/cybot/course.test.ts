import { describe, expect, it } from 'vitest'
import { HALF_ANGLE, IR_RANGE, OBSTACLES, PING_RANGE, R_BOT, bearing, bumps, clearance, clipToCone, irRays, pings } from './course'

describe('CyBot course', () => {
  const ps = pings()

  it('has five forward PING cones of ±20°', () => {
    expect(ps).toHaveLength(5)
    for (const p of ps) {
      const edges = [p.cone[1], p.cone.at(-1)!].map((q) => bearing(p.pose, q))
      expect(edges.map((e) => Math.round(e))).toEqual([-HALF_ANGLE, HALF_ANGLE])
    }
  })

  it('draws an echo only where a cone meets an obstacle', () => {
    expect(ps.map((p) => p.echo?.obstacle ?? null)).toEqual([null, 'A', 'B', 'C', 'F'])
    for (const p of ps) {
      if (!p.echo) {
        expect(OBSTACLES.every((o) => clipToCone(p.pose, o) === null)).toBe(true)
        continue
      }
      for (const q of [p.echo.a, p.echo.b]) {
        expect(Math.abs(bearing(p.pose, q))).toBeLessThanOrEqual(HALF_ANGLE)
        expect(Math.hypot(q.x - p.pose.x, q.y - p.pose.y)).toBeLessThanOrEqual(PING_RANGE)
      }
      // exactly one obstacle in each hitting cone, so no echo hides another
      expect(OBSTACLES.filter((o) => clipToCone(p.pose, o)).length).toBe(1)
    }
  })

  it('reads d = v·t/2 with v = 343 m/s', () => {
    const last = ps.at(-1)!.echo!
    expect(last.dM).toBeCloseTo(1.25, 2)
    expect(last.tMs).toBeCloseTo(((2 * 1.25) / 343) * 1000, 3)
  })

  it('shows one short IR ray that ends on an obstacle', () => {
    const rays = irRays()
    expect(rays).toHaveLength(1)
    const len = Math.hypot(rays[0].to.x - rays[0].from.x, rays[0].to.y - rays[0].from.y)
    expect(len).toBeGreaterThan(0)
    expect(len).toBeLessThanOrEqual(IR_RANGE)
  })

  it('bumps once, on an obstacle no cone ever saw', () => {
    const b = bumps()
    expect(b).toHaveLength(1)
    const seen = new Set(ps.map((p) => p.echo?.obstacle))
    const touched = OBSTACLES.find((o) => o.a.x === b[0].at.x)!
    expect(seen.has(touched.id)).toBe(false)
  })

  it('never drives through an obstacle; only the bump touches', () => {
    const c = clearance()
    for (const [id, d] of Object.entries(c)) {
      if (id === 'E') expect(d).toBeCloseTo(R_BOT, 1)
      else expect(d).toBeGreaterThan(R_BOT)
    }
  })
})
