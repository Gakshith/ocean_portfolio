import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import bake from '../bake/bake.json'
import type { BakeMeta } from '../bake/meta'
import { fits, makeCamera, project } from './framing'
import { LEADS, reefFromMeta } from './reef'
import { RING, RING_END, packet, reefState } from './ringwave'
import { STOP_MARGIN, jumpPose, projectPoints, stopBoxes, stopPose, travelPose } from './stops'

const meta = bake as unknown as BakeMeta
const reef = reefFromMeta(meta)
const contactRing = reef.contacts.map((c) => c.pad.ring)

describe('the reef (S7 data from bake.json)', () => {
  it('has 60 pads in clockwise ring order from the SE corner', () => {
    expect(reef.pads).toHaveLength(60)
    expect(reef.pads.map((p) => p.ring)).toEqual([...Array(60).keys()])
    // south edge east → west, then west edge south → north, north west → east, east north → south
    const at = (r: number) => reef.pads[r]
    expect(at(0).side).toBe('s')
    expect(at(0).x).toBeGreaterThan(at(14).x)
    expect(at(15).side).toBe('w')
    expect(at(15).y).toBeLessThan(at(29).y)
    expect(at(30).side).toBe('n')
    expect(at(30).x).toBeLessThan(at(44).x)
    expect(at(45).side).toBe('e')
    expect(at(45).y).toBeGreaterThan(at(59).y)
  })
  it('has five contact pads in the middle 60% of the south edge, k = 1..5 west → east', () => {
    expect(reef.contacts.map((c) => c.k)).toEqual([1, 2, 3, 4, 5])
    const die = meta.die.box
    const w = die.x1 - die.x0
    for (const c of reef.contacts) {
      expect(c.pad.side).toBe('s')
      expect(Math.abs(c.pad.x)).toBeLessThanOrEqual(0.3 * w)
    }
    for (let k = 1; k < 5; k++) expect(reef.contacts[k].pad.x).toBeGreaterThan(reef.contacts[k - 1].pad.x)
  })
  it('runs each bond wire from its pad down to a lead below the die, leads in order', () => {
    for (const c of reef.contacts) {
      expect(c.wire.y1).toBeLessThan(meta.die.box.y0)
      expect(c.wire.y0).toBeLessThan(c.pad.y)
      expect(c.wire.len).toBeGreaterThan(0)
      expect(c.lead.y).toBe(LEADS.y)
    }
    for (let k = 1; k < 5; k++) expect(reef.contacts[k].lead.x).toBeGreaterThan(reef.contacts[k - 1].lead.x)
  })
  it('has the UART pad on the east edge, near the SE corner', () => {
    const u = reef.pads.filter((p) => p.uart)
    expect(u).toHaveLength(1)
    expect(u[0].side).toBe('e')
    expect(u[0].y).toBeLessThan(0)
  })
})

describe('the ring wave (SM-2 timing)', () => {
  it('rests every pad at its start level before the trigger', () => {
    const s = reefState(null, contactRing, false)
    expect(s.pad[0]).toBeCloseTo(RING.from)
    expect(s.pad[contactRing[0]]).toBeCloseTo(RING.contactFrom)
    expect(s.outline).toEqual([0, 0, 0, 0, 0])
    expect(s.done).toBe(false)
  })
  it('peaks each pad 160 ms after its 12 ms stagger: a 720 ms clockwise sweep', () => {
    expect(reefState(160, contactRing, false).pad[0]).toBeCloseTo(1)
    expect(reefState(10 * 12 + 160, contactRing, false).pad[10]).toBeCloseTo(1)
    // pad 30 hasn't started at t = 300 (it starts at 360)
    expect(reefState(300, contactRing, false).pad[30]).toBeCloseTo(RING.from)
    expect(60 * RING.stagger).toBe(720)
  })
  it('settles to 0.55 aluminium, contacts at 0.5, after 160 + 450 ms', () => {
    const s = reefState(160 + 450, contactRing, false)
    expect(s.pad[0]).toBeCloseTo(RING.rest)
  })
  it('outlines the contacts and draws their wires from +620 ms, 70 ms apart; chips from +980 ms', () => {
    expect(reefState(620, contactRing, false).outline[0]).toBe(0)
    expect(reefState(620 + 240, contactRing, false).outline[0]).toBeCloseTo(1)
    expect(reefState(620 + 70, contactRing, false).wire[1]).toBe(0)
    expect(reefState(620 + 4 * 70 + 520, contactRing, false).wire[4]).toBeCloseTo(1)
    expect(reefState(979, contactRing, false).chip[0].opacity).toBe(0)
    const c = reefState(980 + 120, contactRing, false).chip[0]
    expect(c.opacity).toBeGreaterThan(0)
    expect(c.dy).toBeGreaterThan(0)
    expect(c.dy).toBeLessThan(RING.chipRise)
  })
  it('is done (the loop can idle) after the last chip', () => {
    expect(RING_END).toBe(980 + 4 * 70 + 240)
    const s = reefState(RING_END, contactRing, false)
    expect(s.done).toBe(true)
    expect(s.wire).toEqual([1, 1, 1, 1, 1])
  })
  it('under reduced motion rests everything lit at once', () => {
    const s = reefState(null, contactRing, true)
    expect(s.done).toBe(true)
    expect(s.pad[0]).toBeCloseTo(RING.rest)
    expect(s.chip.every((c) => c.opacity === 1 && c.dy === 0)).toBe(true)
  })
  it('runs a hover packet down the wire in 420 ms, fades in 150, none under reduced motion', () => {
    expect(packet(0, false)).toEqual({ head: 0, opacity: 1 })
    expect(packet(419, false)!.head).toBeGreaterThan(0.99)
    expect(packet(420 + 75, false)!.opacity).toBeCloseTo(0.5)
    expect(packet(420 + 150, false)).toBeNull()
    expect(packet(100, true)).toBeNull()
  })
})

describe('camera stops C0–C5 (fit a world box into a rect)', () => {
  const vw = 1440
  const vh = 900
  const boxes = stopBoxes(meta, reef)
  const rect = { x0: 760, y0: 120, x1: 1376, y1: 820 }
  it('fits every stop box inside its rect with the margin, in plan view', () => {
    const cam = makeCamera()
    for (const [id, box] of Object.entries(boxes)) {
      const p = stopPose(cam, box, rect, vw, vh)
      expect(p.tilt).toBe(0)
      const cam2 = makeCamera()
      projectPoints(cam2, p, [], vw, vh)
      expect(fits(project(cam2, box, vw, vh), rect, STOP_MARGIN * 0.999), id).toBe(true)
    }
  })
  it('C5 frames the south half: contact pads, wires and leads, the name cropped at the top', () => {
    const b = boxes.C5
    for (const c of reef.contacts) {
      expect(c.pad.y).toBeGreaterThan(b.y0)
      expect(c.pad.y).toBeLessThan(b.y1)
      expect(c.lead.y - c.lead.h).toBeGreaterThan(b.y0)
    }
    expect(b.y1).toBeGreaterThan(meta.letters.box.y0)
    expect(b.y1).toBeLessThan(meta.letters.box.y1)
  })
  it('travel starts and ends exactly on the dwell poses; jumps arc 15% higher midway', () => {
    const cam = makeCamera()
    const a = stopPose(cam, boxes.C1, rect, vw, vh)
    const b = stopPose(cam, boxes.C3, rect, vw, vh)
    expect(travelPose(a, b, 0)).toEqual(a)
    const end = travelPose(a, b, 1)
    expect(end.tx).toBeCloseTo(b.tx)
    expect(end.dist).toBeCloseTo(b.dist)
    const mid = jumpPose(a, b, 0.5)
    expect(mid.dist).toBeCloseTo(Math.sqrt(a.dist * b.dist) * 1.15, 6)
  })
  it('projects world points with the renderer camera (the DOM lead chips sit on the leads)', () => {
    const cam = makeCamera()
    const p = stopPose(cam, boxes.C5, rect, vw, vh)
    const [l0, l4] = projectPoints(cam, p, [reef.contacts[0].lead, reef.contacts[4].lead], vw, vh)
    expect(l0.x).toBeGreaterThan(rect.x0)
    expect(l4.x).toBeLessThan(rect.x1)
    expect(l4.x).toBeGreaterThan(l0.x)
    expect(Math.abs(l0.y - l4.y)).toBeLessThan(0.5)
  })
})

// The worker-ready boundary (R-P2-16): src/gl/engine/** never reads the DOM. Everything DOM-side
// is measured on the main thread (src/gl/layout.ts) into a serialisable Layout + Tick, so the
// engine can move to a Worker on an OffscreenCanvas. Any reference fails.
describe('src/gl/engine never touches the DOM', () => {
  const DOM = /\b(document|window|getBoundingClientRect|matchMedia|innerWidth|innerHeight|scrollY|devicePixelRatio|ResizeObserver|addEventListener|removeEventListener|location|localStorage|requestAnimationFrame)\b/g
  const dir = join(__dirname, 'engine')
  for (const f of readdirSync(dir).filter((x) => /\.tsx?$/.test(x)))
    it(`${f} has no DOM references`, () => {
      const src = readFileSync(join(dir, f), 'utf8').replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, '')
      expect(src.match(DOM) ?? []).toEqual([])
    })
})
