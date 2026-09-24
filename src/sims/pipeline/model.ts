// Bubble Lock: a textbook 5-stage RISC-V pipeline as one pure model. It drives the chambers,
// the cycle table and the captions, so they can never disagree.
// Assumptions (stated on the stage): branch resolves in EX; the register file writes in the
// first half of a cycle and reads in the second; forwarding is EX/MEM → EX and MEM/WB → EX.

export const STAGES = ['IF', 'ID', 'EX', 'MEM', 'WB'] as const
export type Stage = (typeof STAGES)[number]
export type FwdSource = 'EX/MEM' | 'MEM/WB'

export interface Instr {
  text: string
  /** Short token for 62px phone chambers. */
  short: string
  op: 'alu' | 'load' | 'branch'
  rd?: number
  rs: number[]
  /** Taken branch target (program index). */
  target?: number
}

export type ScenarioId = 'load-use' | 'dependent-alu' | 'taken-branch'

export const SCENARIOS: Record<ScenarioId, { label: string; program: Instr[] }> = {
  'load-use': {
    label: 'Load-use',
    program: [
      { text: 'lw x5,0(x1)', short: 'lw', op: 'load', rd: 5, rs: [1] },
      { text: 'add x6,x5,x2', short: 'add', op: 'alu', rd: 6, rs: [5, 2] },
      { text: 'sub x7,x6,x3', short: 'sub', op: 'alu', rd: 7, rs: [6, 3] },
    ],
  },
  'dependent-alu': {
    label: 'Dependent ALU',
    program: [
      { text: 'add x5,x1,x2', short: 'add', op: 'alu', rd: 5, rs: [1, 2] },
      { text: 'sub x6,x5,x3', short: 'sub', op: 'alu', rd: 6, rs: [5, 3] },
    ],
  },
  'taken-branch': {
    label: 'Taken branch',
    program: [
      { text: 'beq x1,x2,L1', short: 'beq', op: 'branch', rs: [1, 2], target: 3 },
      { text: 'add x5,x3,x4', short: 'add', op: 'alu', rd: 5, rs: [3, 4] },
      { text: 'or x6,x3,x4', short: 'or', op: 'alu', rd: 6, rs: [3, 4] },
      { text: 'L1: sub x7,x1,x2', short: 'sub', op: 'alu', rd: 7, rs: [1, 2] },
    ],
  },
}

export const SCENARIO_IDS = Object.keys(SCENARIOS) as ScenarioId[]

export type Slot =
  | { kind: 'instr'; i: number; held: boolean; fwd: { reg: number; from: FwdSource; producer: number }[] }
  | { kind: 'flushed'; i: number }
  | { kind: 'bubble' }
  | null

export type Chambers = Record<Stage, Slot>

export type PipeEvent =
  | { kind: 'bubble'; consumer: number; producer: number; reg: number; cause: 'load-use' | 'no-forwarding' }
  | { kind: 'forward'; consumer: number; producer: number; reg: number; from: FwdSource; late: boolean }
  | { kind: 'regfile'; consumer: number; producer: number; reg: number }
  | { kind: 'flush'; branch: number; flushed: number[] }
  | { kind: 'done'; bubbles: number; flushed: number }

export interface Cell {
  stage: Stage | 'flushed'
  stall: boolean
  fwd: FwdSource[]
}

export interface PipeRun {
  scenario: ScenarioId
  forwarding: boolean
  program: Instr[]
  /** Index 0 is cycle 0 (empty, before the first fetch). */
  chambers: Chambers[]
  events: PipeEvent[][]
  /** table[instr][cycle - 1]. */
  table: (Cell | null)[][]
  cycles: number
  /** Bubbles injected into EX by hazard stalls (not counting flushes). */
  bubbles: number
  /** Stall cycles per consumer instruction. */
  stalls: number[]
  flushed: number[]
}

const EMPTY: Chambers = { IF: null, ID: null, EX: null, MEM: null, WB: null }

const writes = (p: Instr[], s: Slot, reg: number) =>
  s?.kind === 'instr' && p[s.i].rd === reg && reg !== 0

export function simulate(scenario: ScenarioId, forwarding: boolean): PipeRun {
  const program = SCENARIOS[scenario].program
  const chambers: Chambers[] = [EMPTY]
  const events: PipeEvent[][] = [[]]
  const stalls = program.map(() => 0)
  const flushed: number[] = []
  let bubbles = 0
  let pc = 0
  const retired = new Set<number>()

  for (let c = 1; c < 64; c++) {
    const prev = chambers[c - 1]
    const ev: PipeEvent[] = []

    // Hazard detection on the instruction that was in ID last cycle.
    let stall = false
    const id = prev.ID
    if (id?.kind === 'instr') {
      for (const reg of program[id.i].rs) {
        const ex = prev.EX
        const mem = prev.MEM
        if (forwarding) {
          if (writes(program, ex, reg) && ex?.kind === 'instr' && program[ex.i].op === 'load') {
            stall = true
            ev.push({ kind: 'bubble', consumer: id.i, producer: ex.i, reg, cause: 'load-use' })
            break
          }
        } else {
          const p = writes(program, ex, reg) ? ex : writes(program, mem, reg) ? mem : null
          if (p?.kind === 'instr') {
            stall = true
            ev.push({ kind: 'bubble', consumer: id.i, producer: p.i, reg, cause: 'no-forwarding' })
            break
          }
        }
      }
    }

    // A taken branch in EX last cycle flushes the two younger instructions at this edge.
    const ex = prev.EX
    const taken = ex?.kind === 'instr' && program[ex.i].op === 'branch'

    const flushedNow = (s: Slot): Slot => (s?.kind === 'instr' ? { kind: 'flushed', i: s.i } : null)
    // Flushed instructions travel on as bubbles; everything else moves one stage.
    const drift = (s: Slot): Slot =>
      s?.kind === 'instr' ? { ...s, held: false, fwd: [] } : s?.kind === 'flushed' ? { kind: 'bubble' } : s

    const next: Chambers = {
      WB: drift(prev.MEM),
      MEM: drift(prev.EX),
      EX: taken ? flushedNow(prev.ID) : stall ? { kind: 'bubble' } : drift(prev.ID),
      ID: taken ? flushedNow(prev.IF) : stall ? held(prev.ID) : drift(prev.IF),
      IF: stall ? held(prev.IF) : null,
    }
    if (taken && ex?.kind === 'instr') {
      const gone = [prev.ID, prev.IF].filter((s) => s?.kind === 'instr').map((s) => (s as { i: number }).i)
      flushed.push(...gone)
      ev.push({ kind: 'flush', branch: ex.i, flushed: gone })
      pc = program[ex.i].target ?? pc
    }
    if (stall) {
      bubbles++
      if (id?.kind === 'instr') stalls[id.i]++
    }
    if (!stall && pc < program.length) next.IF = { kind: 'instr', i: pc++, held: false, fwd: [] }

    // Operand sourcing for the instruction now entering EX.
    const nx = next.EX
    if (nx?.kind === 'instr') {
      const late = stalls[nx.i] > 0
      for (const reg of program[nx.i].rs) {
        if (!forwarding) break
        if (writes(program, next.MEM, reg)) {
          const producer = (next.MEM as { i: number }).i
          nx.fwd.push({ reg, from: 'EX/MEM', producer })
          ev.push({ kind: 'forward', consumer: nx.i, producer, reg, from: 'EX/MEM', late })
        } else if (writes(program, next.WB, reg)) {
          const producer = (next.WB as { i: number }).i
          nx.fwd.push({ reg, from: 'MEM/WB', producer })
          ev.push({ kind: 'forward', consumer: nx.i, producer, reg, from: 'MEM/WB', late })
        }
      }
    }
    // Without forwarding, a stalled consumer reads the register file in the cycle its producer writes back.
    const nid = next.ID
    if (!forwarding && nid?.kind === 'instr' && nid.held) {
      for (const reg of program[nid.i].rs) {
        if (writes(program, next.WB, reg)) {
          ev.push({ kind: 'regfile', consumer: nid.i, producer: (next.WB as { i: number }).i, reg })
        }
      }
    }

    if (next.WB?.kind === 'instr') retired.add(next.WB.i)
    chambers.push(next)
    const live = program.length - flushed.length
    if (retired.size === live) {
      ev.push({ kind: 'done', bubbles, flushed: flushed.length })
      events.push(ev)
      break
    }
    events.push(ev)
  }

  const cycles = chambers.length - 1
  const table = program.map((_, i) =>
    Array.from({ length: cycles }, (_, k): Cell | null => {
      const ch = chambers[k + 1]
      for (const stage of STAGES) {
        const s = ch[stage]
        if (s?.kind === 'instr' && s.i === i)
          return { stage, stall: s.held, fwd: s.fwd.map((f) => f.from) }
        if (s?.kind === 'flushed' && s.i === i) return { stage: 'flushed', stall: false, fwd: [] }
      }
      return null
    }),
  )

  return { scenario, forwarding, program, chambers, events, table, cycles, bubbles, stalls, flushed }
}

function held(s: Slot): Slot {
  return s?.kind === 'instr' ? { ...s, held: true, fwd: [] } : s
}

/** "ID (stall)", "EX ← MEM/WB", "flushed": the cycle table's cell text. */
export function cellText(c: Cell | null): string {
  if (!c) return ''
  if (c.stage === 'flushed') return 'flushed'
  if (c.stall) return `${c.stage} (stall)`
  if (c.fwd.length) return `${c.stage} ← ${c.fwd.join(', ')}`
  return c.stage
}

const x = (r: number) => `x${r}`

/** One sentence per meaningful event in this cycle, or null when nothing notable happened. */
export function caption(run: PipeRun, cycle: number): string | null {
  const p = run.program
  const name = (i: number) => p[i].short
  const parts = (run.events[cycle] ?? []).map((e) => {
    switch (e.kind) {
      case 'bubble':
        return e.cause === 'load-use'
          ? `${name(e.producer)}'s value exists only after MEM, so one bubble enters EX, even with forwarding.`
          : `No forwarding: ${name(e.consumer)} waits in ID for ${x(e.reg)} from ${name(e.producer)}, so a bubble enters EX.`
      case 'forward':
        return e.from === 'MEM/WB' && p[e.producer].op === 'load'
          ? `The loaded value is forwarded from MEM/WB into EX. ${name(e.consumer)} runs one cycle late.`
          : `${x(e.reg)} is forwarded from ${e.from} into EX for ${name(e.consumer)}${e.late ? ', one cycle late' : ''}.`
      case 'regfile':
        return `${name(e.producer)} writes ${x(e.reg)} in the first half of the cycle; ${name(e.consumer)} reads it in the second half.`
      case 'flush':
        return `${name(e.branch)} resolved taken in EX, so the ${e.flushed.length} wrong-path instructions behind it are flushed.`
      case 'done':
        return `All instructions have written back: ${e.bubbles} ${e.bubbles === 1 ? 'bubble' : 'bubbles'}${e.flushed ? `, ${e.flushed} flushed` : ''}.`
    }
  })
  return parts.length ? `Cycle ${cycle}: ${parts.join(' ')}` : null
}
