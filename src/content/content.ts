// All site copy. Facts come only from docs/content.md; fixed lines are the plan's frozen copy
// (docs/design/06-final-plan.md). Nothing here adds a fact about Akash. Slots he has not
// supplied are `null` and render nothing (or the UNEXPOSED frame for his photo).
import type { SectionId } from '../state/sections'

export type Slot<T> = T | null

export interface Link {
  label: string
  href: string
}

export interface Media {
  src: string
  alt: string
  caption: string
}

export interface Project {
  key: 'linklayer' | 'riscv' | 'wisard' | 'cybot'
  section: SectionId
  /** The S1 plate index line, verbatim. */
  index: string
  /** Block name on the die (the eyebrow). */
  block: string
  title: string
  /** Status line under the h2 (S3). */
  status: Slot<string>
  /** Role line directly under the h2 at body size (S4, R-02). */
  role: Slot<string>
  body: readonly string[]
  stack: readonly string[]
  /** Mono data line: the model's assumptions, labelled as a teaching model. */
  dataLine: Slot<string>
  /** Bold honesty line (S5). */
  honesty: Slot<string>
  media: Slot<Media>
}

const base = import.meta.env.BASE_URL

export const identity: {
  name: string
  role: string
  gradTerm: Slot<string>
  oceanStory: Slot<string>
  about: string
  school: string
  facts: readonly { term: string; values: readonly string[] }[]
  photo: Slot<Media>
  oceanPhoto: Slot<Media>
} = {
  name: 'Akash Gojuru',
  role: 'Computer Engineering, Iowa State. Heading into ASIC design; seeking hardware and chip-design internships.',
  gradTerm: null,
  oceanStory: null,
  about:
    'Passionate about digital hardware design, embedded systems and computer vision. I build projects and solve real-world problems through system design, and I’m seeking hardware engineering and chip design internships.',
  school: 'Iowa State University',
  facts: [
    { term: 'Education', values: ['B.S. Computer Engineering, Iowa State University'] },
    { term: 'Skills', values: ['VHDL', 'Verilog', 'C++', 'Java', 'C', 'Python'] },
    { term: 'Experience', values: ['Tech Support Assistant, Iowa State University (CELT)'] },
    { term: 'Recognition', values: ['Dean’s List', 'ChipForge Club member'] },
  ],
  photo: null,
  oceanPhoto: null,
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
  {
    key: 'linklayer',
    section: 'link-layer',
    index: 'BLE Link Layer — senior design, in progress',
    block: 'Radio',
    title: 'BLE Link Layer',
    status: 'Senior design · in progress · Jan–Dec 2026 · advisor Dr. Henry Duwe',
    role: null,
    body: [
      'The senior design project is an open-source Bluetooth Low Energy microcontroller. My part is the digital Link Layer: advertising, scanning, connection handling, PDU decode and generation, state machines, and CSA#1 channel selection.',
    ],
    stack: ['Python', 'C', 'Verilog'],
    dataLine: 'CSA#1 per the BLE Core spec · a teaching model running in your browser, not my silicon',
    honesty: null,
    media: null,
  },
  {
    key: 'riscv',
    section: 'risc-v',
    index: 'RISC-V 5-stage pipeline — hazard debug, review, docs',
    block: 'CPU',
    title: 'RISC-V 5-stage pipelined processor',
    status: null,
    role: 'Two-person team. My partner led the RTL. I reviewed the design, debugged hazards like these, and wrote the docs.',
    body: [
      'A full 5-stage CPU: pipeline registers, forwarding, hazard detection and branch logic.',
      'Tested with RARS assembly and QuestaSim waveforms, with modularity improved through VHDL component organisation.',
    ],
    stack: ['VHDL', 'SystemVerilog', 'QuestaSim', 'RARS'],
    dataLine:
      'Textbook 5-stage · branch resolves in EX · register file writes, then reads · a teaching model, not our RTL',
    honesty: null,
    media: null,
  },
  {
    key: 'wisard',
    section: 'wisard',
    index: 'WiSARD — RAM-based classifier',
    block: 'Memory',
    title: 'WiSARD weightless neural network',
    status: null,
    role: null,
    body: [
      'A RAM-based classifier: inputs become binary vectors, and the vectors become memory addresses. I explored the trade-off between memory and accuracy for edge devices.',
    ],
    stack: [],
    dataLine: null,
    honesty: 'No accuracy numbers. Try it on your own drawings.',
    media: null,
  },
  {
    key: 'cybot',
    section: 'cybot',
    index: 'CyBot — autonomous robot',
    block: 'Off-die',
    title: 'CyBot autonomous robot (CPRE 2880)',
    status: null,
    role: null,
    body: [
      'Semester-long, three-person team. The robot navigates an obstacle course autonomously from sensor data only: bump, IR and PING distance.',
    ],
    stack: ['C', 'Microcontroller', 'Timers', 'Interrupts', 'UART', 'Analog/digital peripherals'],
    dataLine: null,
    honesty: null,
    media: null,
  },
]

export const dieCaption =
  'An illustrative die. The blocks are projects I worked on; it is not a fabricated chip.'

export const hero = {
  /** Visually hidden description of the focused still (the image is aria-hidden). */
  imageDescription:
    'Illustration: sunlight through still water focuses into the letters AKASH GOJURU, routed as top metal on an illustrative die.',
  scrollCue: 'Scroll',
} as const

export const about = {
  display: 'Light through water. Light through a mask.',
  lede: 'Sunlight through waves draws patterns on the sand. Lithography draws a chip the same way, with light through a mask. The pattern is the designer’s work, and it’s the work I’m training for.',
  dieHeading: 'On this die',
} as const

export const cybot = {
  /** Why CyBot is not a block on the die. */
  offDie:
    'CyBot is a board-level system, not a block on the die, so it sits past the reef, linked by a UART line from the die’s UART pad.',
  /** How the PING sensor was aimed. Unknown until Akash confirms; no servo-sweep claim. */
  sensingDetail: null as Slot<string>,
} as const

export const contact = {
  heading: 'Every chip talks to the world through its pads. These are how you reach me.',
  formSummary: 'Write a message',
} as const

export const footer = {
  howLightHeading: 'How the light works',
  /** Verbatim from the plan; the two references are linked where they are named. NOT rendered in
   *  phase 1 (lead ruling 1): the Still site shows no refraction, so this waits for the step 5
   *  bake and a truthful Still variant. */
  howLight: {
    before:
      'The water in the opening scene is a surface solved in advance so that its refraction focuses sunlight into the layout, using the goal-based caustics method (',
    yue: { label: 'Yue et al., 2014', href: 'https://doi.org/10.1145/2580946' },
    middle: '; explained in ',
    ferraro: { label: 'Matt Ferraro’s “Magic Windows”', href: 'https://mattferraro.dev/posts/caustics-engineering' },
    after:
      '). Your browser refracts light through that surface every frame; nothing is cross-faded. Lithography does the same job with a mask and optics: shape the light, and the pattern prints. The die itself is illustrative, not a chip that was fabricated.',
  },
} as const
