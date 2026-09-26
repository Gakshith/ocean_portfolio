// Small shared pieces: the Resume link, the Contact trigger, section links, the Still toggle.
import type { MouseEvent } from 'react'
import { links } from '../content/content'
import { useMotion } from '../state/motion'
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

export function StillToggle({ className }: { className?: string }) {
  const { stillChosen, setStill } = useMotion()
  return (
    <button type="button" className={className} aria-pressed={stillChosen} onClick={() => setStill(!stillChosen)}>
      Still
      <span className="c-state" aria-hidden="true">
        {stillChosen ? 'on' : 'off'}
      </span>
    </button>
  )
}
