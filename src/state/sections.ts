// STUB (lead, freeze commit). chrome_agent owns and replaces this file; keep these exports.
export const SECTIONS = [
  { id: 'top', n: 1, beat: 'S1-hero', nav: 'Top', eyebrow: null },
  { id: 'about', n: 2, beat: 'S2-about', nav: 'About', eyebrow: null },
  { id: 'link-layer', n: 3, beat: 'S3-linklayer', nav: 'Link Layer', eyebrow: 'Radio' },
  { id: 'risc-v', n: 4, beat: 'S4-riscv', nav: 'RISC-V', eyebrow: 'CPU' },
  { id: 'wisard', n: 5, beat: 'S5-wisard', nav: 'WiSARD', eyebrow: 'Memory' },
  { id: 'cybot', n: 6, beat: 'S6-cybot', nav: 'CyBot', eyebrow: 'Off-die' },
  { id: 'contact', n: 7, beat: 'S7-contact', nav: 'Contact', eyebrow: null },
] as const

export type SectionId = (typeof SECTIONS)[number]['id']
