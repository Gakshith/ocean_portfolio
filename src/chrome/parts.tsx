// Small shared pieces: the Resume link, the Contact trigger, section links, and the two motion
// controls (R-P2-13): Still, and Turn on 3D.
import type { MouseEvent } from 'react'
import { links } from '../content/content'
import { OVERRIDABLE, turnOn3D, useMotion, type Off3D } from '../state/motion'
import { SECTIONS, type SectionId } from '../state/sections'
import { openInterrupt } from '../state/ui'

/** A real link: opens the PDF in a new tab with JS off. */
export function ResumeLink({ className }: { className?: string }) {
  return (
    <a className={className} href={links.resume.href} target="_blank" rel="noopener">
      Resume <span aria-hidden="true">↗</span>
      <span className="c-sr"> (PDF, opens in a new tab)</span>
    </a>
  )
}

/** With JS it opens the Surface Interrupt; without JS it is a plain link to the S7 pad list. */
export function ContactTrigger({ className }: { className?: string }) {
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    openInterrupt(e.currentTarget)
  }
  return (
    <a className={className} href="#contact" aria-haspopup="dialog" data-interrupt="" onClick={onClick}>
      Contact
    </a>
  )
}

export function SectionLinks({ current, className }: { current: SectionId | null; className?: string }) {
  return (
    <ol className={className}>
      {SECTIONS.map((s) => (
        <li key={s.id}>
          <a href={`#${s.id}`} aria-current={s.id === current ? 'location' : undefined}>
            <span className="c-n" aria-hidden="true">
              {String(s.n).padStart(2, '0')}
            </span>
            <span className="c-name">{s.nav}</span>
            {s.eyebrow && <span className="c-eyebrow">{s.eyebrow}</span>}
          </a>
        </li>
      ))}
    </ol>
  )
}

/** The motion switch: pressed while motion is stopped (the user's Still, or reduced motion). */
export function StillToggle({ className }: { className?: string }) {
  const { stillChosen, reducedMotion, setStill } = useMotion()
  const on = stillChosen || reducedMotion
  return (
    <button type="button" className={className} aria-pressed={on} onClick={() => setStill(!stillChosen)}>
      Still
      <span className="c-state" aria-hidden="true">
        {on ? 'on' : 'off'}
      </span>
    </button>
  )
}

const WHY_OFF: Record<Exclude<Off3D, null>, string> = {
  'default-off': 'not on by default yet',
  'device-memory': 'low device memory',
  'save-data': 'data saver',
  'still-chosen': 'you chose Still',
  'reduced-motion': 'reduced motion',
  'no-gpu': 'not supported here',
}

/** "Turn on 3D", shown only while 3D is off for a reason the visitor can override; otherwise the
 *  same place carries a plain line saying why (reduced motion, no WebGPU/WebGL2). Nothing while 3D is on. */
export function ThreeDControl({ className }: { className?: string }) {
  const { off3D } = useMotion()
  if (!off3D) return null
  const why = WHY_OFF[off3D]
  if (!OVERRIDABLE.has(off3D))
    return (
      <p className={`${className ?? ''} c-3d c-3d--line`}>
        3D off <span aria-hidden="true">·</span> {why}
      </p>
    )
  return (
    <button type="button" className={`${className ?? ''} c-3d`} onClick={() => turnOn3D()}>
      Turn on 3D
      <span className="c-state">
        <span aria-hidden="true">off · </span>
        <span className="c-sr">3D is off: </span>
        {why}
      </span>
    </button>
  )
}
