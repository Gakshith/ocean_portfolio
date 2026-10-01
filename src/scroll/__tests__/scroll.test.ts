// Scroll state, travel windows, the S1 pin's compensation and stickiness, and the S6 scrub frame.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { POSES, pings } from '../../sims/cybot/course'
import { PING_DUR, pingStart, scrubFrame } from '../../sims/cybot/scrub'
import { SECTIONS, type SectionId } from '../../state/sections'
import { pinCompensation } from '../pin'
import { compute, dwellStart, type Layout } from '../scroll'

const vh = 900
const tops = Object.fromEntries(SECTIONS.map((s, i) => [s.id, i * 2000])) as Record<SectionId, number>
const L: Layout = { vh, pinLen: 1080, tops }

describe('scroll state', () => {
  it('heroP runs over the pin and stays 1 without one', () => {
    expect(compute(540, L).heroP).toBe(0.5)
    expect(compute(5000, L).heroP).toBe(1)
    expect(compute(0, { ...L, pinLen: 0 }).heroP).toBe(1)
  })

  it('travels while the next top moves from 100% to 30% of the viewport, and dwells otherwise', () => {
    const a = tops['link-layer'] - vh
    const b = tops['link-layer'] - 0.3 * vh
    expect(compute(a, L)).toMatchObject({ from: 'about', to: 'link-layer', t: 0 })
    expect(compute((a + b) / 2, L)).toMatchObject({ from: 'about', to: 'link-layer', t: 0.5 })
    expect(compute(b + 10, L)).toMatchObject({ from: 'link-layer', to: 'link-layer', t: 0, dwellPx: 10 })
  })

  it('cybot > contact is the plan window: the last 60vh of S6 plus the first 40vh of S7', () => {
    const c = tops.contact
    expect(compute(c - 0.6 * vh, L)).toMatchObject({ from: 'cybot', to: 'contact', t: 0 })
    expect(compute(c + 0.4 * vh - 1, L).to).toBe('contact')
    expect(dwellStart('contact', L)).toBe(c + 0.4 * vh)
    expect(dwellStart('top', L)).toBe(0)
  })
})

describe('S1 pin compensation (no visible jump)', () => {
  const pin = 1080
  const s1Bottom = 900
  it('mounting: a reader inside S1 stays put; a reader below it moves down by the pin', () => {
    expect(pinCompensation(0, pin, s1Bottom, true)).toBe(0)
    expect(pinCompensation(400, pin, s1Bottom, true)).toBe(400)
    expect(pinCompensation(3000, pin, s1Bottom, true)).toBe(3000 + pin)
  })
  it('unmounting: inside the pin shows S1; below it moves up by the pin', () => {
    expect(pinCompensation(500, pin, s1Bottom, false)).toBe(0)
    expect(pinCompensation(4080, pin, s1Bottom, false)).toBe(3000)
  })
})

describe('sticky never dies silently', () => {
  // position: sticky stops working under any ancestor whose overflow is not visible (clip is fine:
  // it is not a scroll container). The S1 track's ancestors are html, body, #root and main.
  const ANCESTOR = /^(html|body|#root|main|\.s1-track)([:[.][^\s>+~]*)?$/
  /** Declarations of overflow on the ancestors that would clip. */
  function clippers(css: string): string[] {
    const bad: string[] = []
    for (const [, sel, body] of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
      if (!sel.split(',').some((s) => ANCESTOR.test(s.trim()))) continue
      for (const [decl, , v] of body.matchAll(/overflow(-x|-y)?\s*:\s*([a-z]+)/g)) if (v !== 'visible' && v !== 'clip') bad.push(`${sel.trim()} { ${decl} }`)
    }
    return bad
  }

  it('catches a clipping ancestor (the check itself)', () => {
    expect(clippers('body { overflow-x: hidden }')).toHaveLength(1)
    expect(clippers('html, body { overflow-x: clip }')).toHaveLength(0)
    expect(clippers('main .card { overflow: auto }')).toHaveLength(0)
  })

  it('no stylesheet gives html, body, #root, main or the S1 track a clipping overflow', () => {
    const css = ['styles/base.css', 'styles/sections.css', 'styles/tokens.css', 'chrome/chrome.css', 'chrome/ui.css']
      .map((f) => readFileSync(join(__dirname, '../..', f), 'utf8'))
      .join('\n')
    expect(clippers(css)).toEqual([])
  })
})

describe('S6 scrub frame (C-14)', () => {
  const ps = pings()
  it('ends exactly on the static diagram', () => {
    const f = scrubFrame(1)
    expect(f.uart).toBe(1)
    expect(f.cones.every((c) => c.fill === 1)).toBe(true)
    expect(f.cones.map((c) => c.echo)).toEqual(ps.map((p) => !!p.echo))
    expect(f.robot).toMatchObject({ x: POSES.at(-1)!.x, y: POSES.at(-1)!.y, h: POSES.at(-1)!.h })
    expect(f.path).toHaveLength(POSES.length)
    expect(f.ir && f.bump).toBe(true)
  })
  it('draws the UART line first, then fills each cone outward, with the echo only once reached', () => {
    expect(scrubFrame(0.04).uart).toBe(0.5)
    expect(scrubFrame(0.04).cones.every((c) => c.fill === 0)).toBe(true)
    const k = 1 // ping 2 hits obstacle A
    const reach = ps[k].echo!.d / 300
    expect(scrubFrame(pingStart(k) + PING_DUR * (reach - 0.05)).cones[k].echo).toBe(false)
    expect(scrubFrame(pingStart(k) + PING_DUR * (reach + 0.05)).cones[k].echo).toBe(true)
  })
  it('shows IR and bump only after the robot reaches them', () => {
    expect(scrubFrame(pingStart(3) + PING_DUR).ir).toBe(false)
    expect(scrubFrame(pingStart(4)).ir).toBe(true)
    expect(scrubFrame(pingStart(4) + PING_DUR).bump).toBe(false)
    expect(scrubFrame(1).bump).toBe(true)
  })
})
