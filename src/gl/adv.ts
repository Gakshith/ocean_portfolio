// ADV_IND loader content: a real legacy BLE advertising PDU (Core Spec Vol 6 Part B §2.3.1.1).
// Header 0x40 0x17 (ADV_IND, TxAdd = 1 random, ChSel 0, length 23), an illustrative random static
// AdvA, AdvData = Flags (02 01 06) + Complete Local Name (0D 09 "Akash Gojuru"), CRC-24 with the
// advertising init 0x555555. Lines print on real loading milestones, never on a timer.

const NAME = 'Akash Gojuru'
/** Illustrative random static address (top two bits 11), little-endian as sent on air. */
const ADV_A = [0x3a, 0x1f, 0x62, 0x0b, 0x9d, 0xc7]

/** BLE CRC-24: polynomial x²⁴+x¹⁰+x⁹+x⁶+x⁴+x³+x+1, LSB first, init 0x555555. */
export function crc24(bytes: readonly number[], init = 0x555555): number {
  let st = 0
  for (let i = 0; i < 24; i++) if (init & (1 << i)) st |= 1 << (23 - i)
  for (const b of bytes) {
    let cur = b
    for (let j = 0; j < 8; j++) {
      const nb = (st ^ cur) & 1
      cur >>= 1
      st >>= 1
      if (nb) {
        st |= 1 << 23
        st ^= 0x5a6000
      }
    }
  }
  let out = 0
  for (let i = 0; i < 24; i++) if (st & (1 << i)) out |= 1 << (23 - i)
  return out
}

const nameBytes = [...NAME].map((c) => c.charCodeAt(0))
export const advData = [0x02, 0x01, 0x06, nameBytes.length + 1, 0x09, ...nameBytes]
export const header = [0x40, ADV_A.length + advData.length]
export const pdu = [...header, ...ADV_A, ...advData]
export const crc = crc24(pdu)

const hex = (a: readonly number[]) => a.map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')

/** Desktop: one line per milestone (1..5). */
export const ADV_LINES = [
  'ADV_IND  ch 37 · 38 · 39',
  `hdr ${hex(header)}  type=ADV_IND TxAdd=1 len=${header[1]}`,
  `AdvA ${[...ADV_A]
    .reverse()
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join(':')}  (illustrative random static)`,
  `AdvData ${hex(advData.slice(0, 3))} | ${hex(advData.slice(3))}`,
  `  Complete Local Name "${NAME}"  ${advData.length}/31 bytes · CRC ${crc.toString(16).toUpperCase().padStart(6, '0')}`,
] as const

/** Phone: a single line that advances in place. */
export const ADV_PHONE = [
  'ADV_IND ch37/38/39 · scanning',
  `ADV_IND hdr ${hex(header)} · TxAdd=1`,
  'ADV_IND AdvA (illustrative random static)',
  'ADV_IND AdvData Flags · Name',
  `ADV_IND "${NAME}" ${advData.length}/31 B`,
] as const

export const connectLine = (ms: number) => `CONNECT_IND · surface ready (${ms} ms)`
export const CONNECT_SHORT = `CONNECT_IND · "${NAME}"`
export const GAVE_UP = 'Showing the still version.'
