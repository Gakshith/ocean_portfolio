// STUB (lead, freeze commit). sections_agent owns and replaces this file; keep these exports.
// Copy only from docs/content.md and the plan's frozen lines.
import type { SectionId } from '../state/sections'

export type Slot<T> = T | null

export interface Link {
  label: string
  href: string
}

export interface Project {
  key: 'linklayer' | 'riscv' | 'wisard' | 'cybot'
  section: SectionId
  /** The S1 plate index line, verbatim. */
  index: string
}

const base = import.meta.env.BASE_URL

export const identity: { name: string; role: string; gradTerm: Slot<string> } = {
  name: 'Akash Gojuru',
  role: 'Computer Engineering, Iowa State. Heading into ASIC design; seeking hardware and chip-design internships.',
  gradTerm: null,
}

export const links: {
  resume: Link
  reflection: Link
  email: Link & { address: string }
  linkedin: Link
  github: Link
} = {
  resume: { label: 'Resume (PDF)', href: `${base}Akash_Gojuru_Resume.pdf` },
  reflection: { label: 'Reflection (PDF)', href: `${base}Akash_Gojuru_Reflection.pdf` },
  email: { label: 'Email', href: 'mailto:gojuru18@iastate.edu', address: 'gojuru18@iastate.edu' },
  linkedin: { label: 'LinkedIn', href: 'https://www.linkedin.com/in/akash-gojuru' },
  github: { label: 'GitHub', href: 'https://github.com/Gakshith' },
}

export const projects: readonly Project[] = [
  { key: 'linklayer', section: 'link-layer', index: 'BLE Link Layer — senior design, in progress' },
  { key: 'riscv', section: 'risc-v', index: 'RISC-V 5-stage pipeline — hazard debug, review, docs' },
  { key: 'wisard', section: 'wisard', index: 'WiSARD — RAM-based classifier' },
  { key: 'cybot', section: 'cybot', index: 'CyBot — autonomous robot' },
]

export const dieCaption =
  'An illustrative die. The blocks are projects I worked on; it is not a fabricated chip.'
