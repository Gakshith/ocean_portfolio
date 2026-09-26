import { describe, expect, it } from 'vitest'
import { caption, cellText, simulate, type Chambers, type PipeRun } from './model'

const rows = (r: PipeRun) => r.table.map((row) => row.map(cellText))
const show = (r: PipeRun, c: number) => {
  const ch: Chambers = r.chambers[c]
  return Object.fromEntries(
    Object.entries(ch).map(([k, s]) => [
      k,
      !s ? '—' : s.kind === 'bubble' ? 'bubble' : `${r.program[s.i].short}${s.kind === 'flushed' ? ' flushed' : s.stalled ? ' (stall)' : ''}`,
    ]),
  )
}

describe('load-use (lw → add → sub)', () => {
  const on = simulate('load-use', true)
  const off = simulate('load-use', false)

  it('forwarding on: 1 bubble for the load-use pair', () => {
    expect(on.stalls[1]).toBe(1)
    expect(on.bubbles).toBe(1)
  })

  it('forwarding off: 2 bubbles for the load-use pair', () => {
    expect(off.stalls[1]).toBe(2)
  })

  it('cycle 4: bubble in EX, add stalled in ID, sub stalled in IF, lw in MEM', () => {
    expect(show(on, 4)).toEqual({ IF: 'sub (stall)', ID: 'add (stall)', EX: 'bubble', MEM: 'lw', WB: '—' })
    expect(caption(on, 4)).toBe(
      "Cycle 4: lw's value exists only after MEM, so one bubble enters EX, even with forwarding.",
    )
  })

  it('cycle 5: MEM/WB → EX forward into add, the bubble moves on to MEM', () => {
    expect(show(on, 5)).toEqual({ IF: '—', ID: 'sub', EX: 'add', MEM: 'bubble', WB: 'lw' })
    const ex = on.chambers[5].EX
    expect(ex?.kind === 'instr' && ex.fwd).toEqual([{ reg: 5, from: 'MEM/WB', producer: 0 }])
    expect(caption(on, 5)).toBe('Cycle 5: The loaded value is forwarded from MEM/WB into EX. add runs one cycle late.')
  })

  it('never forwards in the bubble cycle', () => {
    const ex = on.chambers[4].EX
    expect(ex?.kind).toBe('bubble')
    expect(on.events[4].some((e) => e.kind === 'forward')).toBe(false)
  })

  it('matches the style tile cycle table cell for cell (forwarding on)', () => {
    expect(on.cycles).toBe(8)
    expect(rows(on)).toEqual([
      ['IF', 'ID', 'EX', 'MEM', 'WB', '', '', ''],
      ['', 'IF', 'ID', 'ID (stall)', 'EX ← MEM/WB', 'MEM', 'WB', ''],
      ['', '', 'IF', 'IF (stall)', 'ID', 'EX ← EX/MEM', 'MEM', 'WB'],
    ])
  })

  it('forwarding off: add reads x5 in cycle 5 (write, then read) and enters EX at 6', () => {
    expect(rows(off)[1].slice(0, 7)).toEqual(['', 'IF', 'ID', 'ID (stall)', 'ID (stall)', 'EX', 'MEM'])
    expect(off.events[5]).toContainEqual({ kind: 'regfile', consumer: 1, producer: 0, reg: 5 })
    expect(off.events.flat().some((e) => e.kind === 'forward')).toBe(false)
  })
})

describe('dependent ALU (add → sub)', () => {
  it('forwarding on: 0 bubbles, EX/MEM → EX in cycle 4', () => {
    const r = simulate('dependent-alu', true)
    expect(r.bubbles).toBe(0)
    expect(rows(r)).toEqual([
      ['IF', 'ID', 'EX', 'MEM', 'WB', ''],
      ['', 'IF', 'ID', 'EX ← EX/MEM', 'MEM', 'WB'],
    ])
  })

  it('forwarding off: 2 bubbles, sub reads x5 in cycle 5 and enters EX at 6', () => {
    const r = simulate('dependent-alu', false)
    expect(r.bubbles).toBe(2)
    expect(rows(r)[1]).toEqual(['', 'IF', 'ID', 'ID (stall)', 'ID (stall)', 'EX', 'MEM', 'WB'])
  })
})

describe('taken branch', () => {
  for (const fwd of [true, false]) {
    it(`resolves in EX and flushes the 2 wrong-path instructions (forwarding ${fwd ? 'on' : 'off'})`, () => {
      const r = simulate('taken-branch', fwd)
      expect(r.flushed).toEqual([1, 2])
      expect(r.bubbles).toBe(0)
      expect(r.events[4]).toContainEqual({ kind: 'flush', branch: 0, flushed: [1, 2] })
      expect(show(r, 3)).toEqual({ IF: 'or', ID: 'add', EX: 'beq', MEM: '—', WB: '—' })
      expect(show(r, 4)).toEqual({ IF: 'sub', ID: 'or flushed', EX: 'add flushed', MEM: 'beq', WB: '—' })
      expect(rows(r)).toEqual([
        ['IF', 'ID', 'EX', 'MEM', 'WB', '', '', ''],
        ['', 'IF', 'ID', 'flushed', '', '', '', ''],
        ['', '', 'IF', 'flushed', '', '', '', ''],
        ['', '', '', 'IF', 'ID', 'EX', 'MEM', 'WB'],
      ])
      expect(caption(r, 4)).toBe(
        'Cycle 4: beq resolved taken in EX, so the 2 wrong-path instructions behind it are flushed.',
      )
    })
  }
})

describe('model', () => {
  it('starts empty at cycle 0 and captions only meaningful cycles', () => {
    const r = simulate('load-use', true)
    expect(Object.values(r.chambers[0]).every((s) => s === null)).toBe(true)
    expect(caption(r, 2)).toBeNull()
    expect(caption(r, 6)).toBe('Cycle 6: x6 is forwarded from EX/MEM into EX for sub.')
    expect(caption(r, 8)).toBe('Cycle 8: All instructions have written back: 1 bubble.')
  })
})
