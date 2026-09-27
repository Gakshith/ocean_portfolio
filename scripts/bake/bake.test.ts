// @vitest-environment node
// The committed bake, checked in CI without the encoder: one fresh solve must reproduce the shipped
// field byte for byte (determinism across machines), and the acceptance bars hold on what ships.
// AVIF bytes are checked locally by `npm run bake -- --check` (libaom output is platform-bound).
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'
import G from '../../src/content/glyphs.json'
import * as fp from '../../src/svg/floorplan'
import { makeTarget, TEXELS_PER_TRACK, type Target } from '../../src/bake/target'
import meta from '../../src/bake/bake.json'
import stills from '../../src/bake/stills.json'
import { downsample2, downsampleField, fromHalf, packRG16F, solveField, toF32, toHalf, unpackRG16F, type Field } from './field'
import { contrast, precision, seam, tileIntensity } from './metrics'

const ROOT = join(__dirname, '../..')
const pub = (f: string) => new Uint8Array(readFileSync(join(ROOT, 'public/bake', f)))
const sha = (b: Uint8Array) => createHash('sha256').update(b).digest('hex')
const N = 512

let t: Target
let f2: Field
let field: Field
let shipped: { N: number; gx: Float64Array; gy: Float64Array }

// One solve at 1024² (R-P2-15); the shipped 512² and 256² fields are it averaged down.
beforeAll(() => {
  t = makeTarget(G, fp, N)
  f2 = solveField(makeTarget(G, fp, 2 * N))
  field = downsampleField(f2)
  shipped = { N, ...unpackRG16F(pub('slope-512.f16'), N) }
}, 900_000)

describe('RG16F encoding', () => {
  it('rounds to nearest even exactly like the platform half type', () => {
    const vals = [0, -0, 1, -1, 0.1, 0.7186, 1e-5, 6e-8, 65504, 70000, 2 ** -14, 2 ** -24, 0.333251953125, 1.0009765625, 1.00146484375]
    for (const v of vals) expect(fromHalf(toHalf(v))).toBe(Math.f16round(v))
  })
})

describe('the shipped field', () => {
  it('is what a fresh solve produces, byte for byte', () => {
    expect(sha(packRG16F(f2.gx, f2.gy, 2 * N))).toBe(meta.sha256.slope1024)
    expect(sha(pub('slope-1024.f16'))).toBe(meta.sha256.slope1024)
    expect(pub('slope-1024.f16').length).toBe(4 * N * N * 4)
    // The stills are rendered from exactly this file (R-P2-08: one surface on every tier).
    expect(meta.acceptance.stillsFrom).toBe(meta.sha256.slope1024)
    const fresh = packRG16F(field.gx, field.gy, N)
    expect(sha(fresh)).toBe(meta.sha256.slope512)
    expect(sha(pub('slope-512.f16'))).toBe(meta.sha256.slope512)
    expect(sha(packRG16F(downsample2(field.gx, N), downsample2(field.gy, N), N / 2))).toBe(meta.sha256.slope256)
    expect(pub('slope-512.f16').length).toBe(N * N * 4)
    expect(pub('slope-256.f16').length).toBe((N / 2) * (N / 2) * 4)
    expect(pub('traces-512.u8').length).toBe(N * N)
    expect(sha(pub('traces-512.u8'))).toBe(meta.sha256.traces)
  })

  it('is stored GL order: row 0 = south, G = ∂h/∂y north-up', () => {
    const raw = pub('slope-512.f16')
    const dv = new DataView(raw.buffer)
    // A texel near the south edge of the tile: canvas row N−3 is file row 2.
    const x = 200
    const canvasRow = N - 3
    const fileRow = N - 1 - canvasRow
    expect(fromHalf(dv.getUint16((fileRow * N + x) * 4, true))).toBe(Math.f16round(field.gx[canvasRow * N + x]))
    expect(fromHalf(dv.getUint16((fileRow * N + x) * 4 + 2, true))).toBe(Math.f16round(field.gy[canvasRow * N + x]))
  })

  it('holds the proof precision bar: RG16F vs f32, ≤ 1% of display pixels off by > 10%', () => {
    const I32 = tileIntensity({ N, gx: toF32(field.gx), gy: toF32(field.gy) })
    const I16 = tileIntensity(shipped)
    const p = precision(I32, I16, N)
    expect(p.pxOff10).toBeLessThanOrEqual(0.01)
    expect(p.pxOff10).toBeCloseTo(meta.acceptance.f16PxOff10, 4)
    expect(p.rms).toBeCloseTo(meta.acceptance.f16rms, 4)
  })

  it('prints the name: letters ≥ 3× fill and ≥ 8× core (C-03)', () => {
    const c = contrast(t, tileIntensity(shipped))
    expect(c.LF).toBeGreaterThanOrEqual(3)
    expect(c.LC).toBeGreaterThanOrEqual(8)
    expect(+c.LF.toFixed(2)).toBe(meta.acceptance.LF)
    expect(meta.acceptance.s1Display.LF).toBeGreaterThanOrEqual(3)
  })

  it('meets the open sea without a seam (R-P2-05 amended)', () => {
    const s = seam({ N, gx: field.gx, gy: field.gy }, field.full)
    expect(field.edgeNormalTexels).toBeLessThanOrEqual(0.5)
    expect(Math.abs(s.bandI - 1)).toBeLessThanOrEqual(0.02)
    expect(s.bandMaxDev).toBeLessThanOrEqual(0.02)
    expect(s.last3TexelsMaxDev).toBeLessThanOrEqual(0.06)
    expect(s.cropRms).toBeLessThanOrEqual(0.01)
  })
})

describe('bake.json and the stills', () => {
  it('frames the name at 6.5 texels per track, inside the die', () => {
    const { letters, die } = meta
    expect(letters.texelsPerTrack).toBe(TEXELS_PER_TRACK)
    expect(letters.box.x0).toBeGreaterThan(die.box.x0)
    expect(letters.box.x1).toBeLessThan(die.box.x1)
    // GOJURU = 6 glyphs of 8 tracks + 5 gaps of 2 = 58 tracks.
    expect((letters.box.x1 - letters.box.x0) / meta.tile.texel).toBeCloseTo(58 * TEXELS_PER_TRACK, 3)
  })

  it('carries the floorplan: 60 pads, five contact pads, one UART pad, three blocks', () => {
    expect(meta.pads).toHaveLength(60)
    expect(meta.pads.filter((p) => p.contact).map((p) => p.contact)).toEqual(expect.arrayContaining([1, 2, 3, 4, 5]))
    expect(meta.pads.filter((p) => p.uart)).toHaveLength(1)
    expect(meta.blocks.map((b) => b.layer)).toEqual(fp.blocks.map((b) => b.layer))
    for (const p of meta.pads) expect(Math.max(Math.abs(p.x), Math.abs(p.y))).toBeLessThan(1)
  })

  it('keeps every still in budget and the manifest in step with the files', () => {
    const size = (p: string) => pub(p.replace(/^bake\//, '')).length
    const s1Max = meta.stills.s1.srcset[meta.stills.s1.srcset.length - 1][1] as string
    expect(size(s1Max)).toBeLessThanOrEqual(60_000)
    expect(size(meta.stills.poster)).toBeLessThanOrEqual(60_000)
    expect(size(meta.stills.s6)).toBeLessThanOrEqual(25_000)
    const lines = new TextDecoder().decode(pub('manifest.sha256')).trim().split('\n')
    for (const line of lines) {
      const [hash, name] = line.split(/\s+/)
      expect(sha(pub(name)), name).toBe(hash)
    }
    expect(stills.s1).toEqual(meta.stills.s1)
    expect(stills.s6.src).toBe(meta.stills.s6)
  })
})
