import { describe, expect, it } from 'vitest'
import { ADV_LINES, advData, crc, crc24, header, pdu } from './adv'
import { TILT, ease3, easeFocus, focusTarget, range, s1Camera, s1Light } from './choreo'
import { applyPose, fitS1, fits, freeRegions, makeCamera, project } from './framing'

describe('ADV_IND packet', () => {
  it('is a legacy ADV_IND with a random static address, 17/31 bytes of AdvData', () => {
    expect(header).toEqual([0x40, 0x17])
    expect(advData.slice(0, 5)).toEqual([0x02, 0x01, 0x06, 0x0d, 0x09])
    expect(advData.length).toBe(17)
    expect(pdu.length).toBe(2 + 6 + 17)
    expect(ADV_LINES[4]).toContain('17/31 bytes')
  })
  it('CRC-24 matches an independent shift-register implementation', () => {
    const lfsr = (data: number[]) => {
      const r = [0x55, 0x55, 0x55]
      for (let d of data)
        for (let v = 0; v < 8; v++) {
          const t = (r[0] >> 7) & 1
          r[0] = ((r[0] << 1) | (r[1] >> 7)) & 0xff
          r[1] = ((r[1] << 1) | (r[2] >> 7)) & 0xff
          r[2] = (r[2] << 1) & 0xff
          if ((d & 1) !== t) {
            r[2] ^= 0x5b
            r[1] ^= 0x06
          }
          d >>= 1
        }
      return (r[0] << 16) | (r[1] << 8) | r[2]
    }
    expect(crc).toBe(lfsr(pdu))
    expect(crc24([0x00])).toBe(lfsr([0x00]))
  })
})

describe('SM-1 choreography (plan S1 Motion)', () => {
  it('focuses over P 0.05–0.45 with power3.inOut', () => {
    expect(focusTarget(0)).toBe(0)
    expect(focusTarget(0.05)).toBe(0)
    expect(focusTarget(0.25)).toBeCloseTo(ease3(0.5))
    expect(focusTarget(0.45)).toBe(1)
    expect(range(0.5, 0.45, 0.55)).toBeCloseTo(0.5)
  })
  it('tilts 28° → 0° with the focus and rises over P 0.55–1', () => {
    expect(s1Camera(0).tilt).toBeCloseTo(TILT)
    expect(s1Camera(0.45).tilt).toBe(0)
    expect(s1Camera(0.55).rise).toBe(0)
    expect(s1Camera(1).rise).toBe(1)
  })
  it('stops down 1.6 → 0.42 and ambient 0.35 → 0.02', () => {
    expect(s1Light(0, 0).exposure).toBeCloseTo(1.6)
    expect(s1Light(0, 0).ambient).toBeCloseTo(0.35)
    expect(s1Light(0.5, 1).exposure).toBeCloseTo(0.42)
    expect(s1Light(0.5, 1).ambient).toBeCloseTo(0.02)
  })
  it('the lagoon stills before the open sea', () => {
    const L = s1Light(0.25, 0.5)
    expect(L.lagoon).toBeLessThan(L.sea)
  })
  it('the residual is gone and everything is still from P 0.9 (RTs freeze, 0 idle frames)', () => {
    for (const P of [0.9, 0.95, 1]) expect(s1Light(P, 1).moving).toBe(false)
    expect(s1Light(0.6, 1).moving).toBe(true) // the 3% residual during the hold
    expect(s1Light(0.6, 1).resid).toBeCloseTo(0.03)
  })
  it('metal tints in over P 0.72–1', () => {
    expect(s1Light(0.72, 1).metal).toBe(0)
    expect(s1Light(1, 1).metal).toBe(1)
  })
  it('a surface landing mid-scroll eases in (~250ms), never snaps', () => {
    const f = easeFocus(0, 1, 0.016)
    expect(f).toBeGreaterThan(0)
    expect(f).toBeLessThan(0.2)
  })
})

describe('fitted framing (C-02)', () => {
  const letters = { x0: -0.736, y0: -0.355, x1: 0.736, y1: 0.355 }
  const die = { x0: -0.914, y0: -0.914, x1: 0.914, y1: 0.914 }
  const cases: [number, number, { x0: number; y0: number; x1: number; y1: number }][] = [
    [1280, 720, { x0: 64, y0: 330, x1: 598, y1: 704 }],
    [1440, 900, { x0: 64, y0: 305, x1: 598, y1: 772 }],
    [1920, 1080, { x0: 84, y0: 480, x1: 618, y1: 1000 }],
    [375, 667, { x0: 16, y0: 300, x1: 359, y1: 598 }],
    [390, 844, { x0: 16, y0: 440, x1: 374, y1: 775 }],
  ]
  for (const [vw, vh, plate] of cases)
    it(`letters fit through the hold and the die fits at P 1 at ${vw}×${vh}`, () => {
      const cam = makeCamera()
      const bottom = vw < 768 ? vh - 56 : vh
      const regions = freeRegions(vw, vh, 56, bottom, plate)
      const c = fitS1(cam, letters, die, regions, TILT, vw, vh)!
      expect(c).toBeTruthy()
      for (const P of [0.3, 0.45, 0.5, 0.55]) {
        const { tilt } = s1Camera(P)
        applyPose(cam, { tx: c.target.x, ty: c.target.y, dist: c.near, tilt, cx: c.cx, cy: c.cy }, vw, vh)
        expect(fits(project(cam, letters, vw, vh), c.region, 0)).toBe(true)
      }
      applyPose(cam, { tx: c.target.x, ty: c.target.y, dist: c.far, tilt: 0, cx: c.cx, cy: c.cy }, vw, vh)
      expect(fits(project(cam, die, vw, vh), c.region, 0)).toBe(true)
      expect(c.far).toBeGreaterThanOrEqual(c.near)
    })
})
