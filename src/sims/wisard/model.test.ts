import { describe, expect, it } from 'vitest'
import { SEED_SAMPLES } from './samples'
import {
  BITS,
  MAX_CLASSES,
  addresses,
  classify,
  emptyGrid,
  mapping,
  numRams,
  parse,
  ramBits,
  seedModel,
  setTuple,
  shift,
  teach,
  verdict,
  verdictText,
} from './model'

const names = ['wave', 'fish', 'shell']

describe('samples', () => {
  it('are 16×16 grids of # and .', () => {
    for (const rows of Object.values(SEED_SAMPLES).flat()) {
      expect(rows).toHaveLength(16)
      for (const r of rows) expect(r).toMatch(/^[#.]{16}$/)
    }
  })
})

describe('mapping and sizes', () => {
  it('is a deterministic permutation of the 256 inputs', () => {
    const m = mapping()
    expect(new Set(m).size).toBe(BITS)
    expect(mapping()).toEqual(m)
  })

  it('sizes RAMs from the tuple size (2–8), the last tuple short when n does not divide 256', () => {
    expect(numRams(4)).toBe(64)
    expect(ramBits(3, 4)).toBe(3 * 64 * 16)
    expect(numRams(3)).toBe(86)
    expect(numRams(8)).toBe(32)
    expect(ramBits(3, 8)).toBe(3 * 32 * 256)
    const a = addresses(emptyGrid(), 3, mapping())
    expect(a).toHaveLength(86)
  })

  it('clamps the tuple size to 2–8 and retrains', () => {
    expect(setTuple(seedModel(), 1).tuple).toBe(2)
    expect(setTuple(seedModel(), 12).tuple).toBe(8)
    const m = setTuple(seedModel(4), 6)
    expect(m.classes[0].ram).toHaveLength(numRams(6) * 64)
  })
})

describe('classifier', () => {
  it('gives a training drawing the full response of its own class', () => {
    for (const n of [2, 4, 8]) {
      const m = seedModel(n)
      m.classes.forEach((c, i) => {
        const g = parse(SEED_SAMPLES[c.name as keyof typeof SEED_SAMPLES][0])
        const counts = classify(m, g)
        expect(counts[i]).toBe(numRams(n))
      })
    }
  })

  it('classifies each bundled sample as its own class with a clear lead', () => {
    const m = seedModel()
    for (const [name, list] of Object.entries(SEED_SAMPLES))
      for (const rows of list) {
        const v = verdict(classify(m, parse(rows)), false)
        expect(v.kind).toBe('winner')
        if (v.kind !== 'empty') expect(names[v.top]).toBe(name)
      }
  })
})

describe('tie rule (C-22)', () => {
  it('can be too close to call on a drawing it has not seen (fish moved 2 right, 1 down)', () => {
    const v = verdict(classify(seedModel(4), shift(parse(SEED_SAMPLES.fish[0]), 2, 1)), false)
    expect(v.kind).toBe('tie')
  })

  it('needs a lead of more than 2 RAMs to name a winner', () => {
    expect(verdict([23, 20, 5], false)).toMatchObject({ kind: 'winner', top: 0, second: 1, gap: 3 })
    expect(verdict([23, 21, 5], false)).toMatchObject({ kind: 'tie', top: 0, second: 1, gap: 2 })
    expect(verdict([22, 23, 5], false)).toMatchObject({ kind: 'tie', top: 1, second: 0, gap: 1 })
    expect(verdict([9, 9, 9], false)).toMatchObject({ kind: 'tie', gap: 0 })
  })

  it('always carries the gap as a plain count', () => {
    const v = verdict([30, 12, 4], false)
    expect(v.kind !== 'empty' && v.gap).toBe(18)
  })

  it('reads "Draw something" for an empty pool', () => {
    expect(verdict([40, 40, 40], true)).toEqual({ kind: 'empty' })
    expect(verdictText({ kind: 'empty' }, names, 64)).toBe('Draw something')
  })

  it('words the winner and the tie', () => {
    expect(verdictText(verdict([23, 14, 3], false), names, 64)).toBe(
      'Classified as wave: 23 of 64 RAMs, 9 ahead of fish.',
    )
    expect(verdictText(verdict([23, 3, 22], false), names, 64)).toBe('Too close to call: wave 23, shell 22.')
  })
})

describe('teach', () => {
  const g = parse(SEED_SAMPLES.fish[0])

  it('adds a new class from one drawing, up to 6 classes', () => {
    let m = seedModel()
    for (let k = 0; k < 3; k++) {
      const r = teach(m, `kelp${k}`, g)
      expect(r.created).toBe(true)
      m = r.model
    }
    expect(m.classes).toHaveLength(MAX_CLASSES)
    expect(teach(m, 'crab', g).error).toBe('max-classes')
    // an existing name adds another example instead
    const again = teach(m, 'Kelp0', g)
    expect(again.error).toBeUndefined()
    expect(again.created).toBe(false)
    expect(again.model.classes[3].examples).toHaveLength(2)
  })

  it('refuses an empty drawing or a blank name', () => {
    expect(teach(seedModel(), 'kelp', emptyGrid()).error).toBe('empty-drawing')
    expect(teach(seedModel(), '   ', g).error).toBe('no-name')
  })

  it('the taught drawing gets the new class full response', () => {
    const m = teach(seedModel(), 'kelp', g).model
    expect(classify(m, g)[3]).toBe(numRams(4))
  })
})
