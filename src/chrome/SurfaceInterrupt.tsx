// The Surface Interrupt: the global fast path. Plan "Global UI" + 02-ux "Surface Interrupt".
// History, inert, scroll and pause live in state/ui.ts; this renders the panel and traps focus.
import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { identity, links, projects } from '../content/content'
import { SECTIONS } from '../state/sections'
import { closeInterrupt, overlayLayer, useUi } from '../state/ui'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'

function trapTab(e: KeyboardEvent<HTMLDivElement>) {
  if (e.key !== 'Tab') return
  const items = [...e.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE)]
  if (!items.length) return
  const first = items[0]
  const last = items[items.length - 1]
  const active = document.activeElement
  const outside = !items.includes(active as HTMLElement)
  if (e.shiftKey && (active === first || outside)) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && (active === last || (outside && active !== e.currentTarget.querySelector('h2')))) {
    e.preventDefault()
    first.focus()
  }
}

function CopyEmail() {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle')
  const copy = async () => {
    let ok = false
    try {
      await navigator.clipboard.writeText(links.email.address)
      ok = true
    } catch {
      ok = false
    }
    setStatus(ok ? 'copied' : 'failed')
    window.setTimeout(() => setStatus('idle'), 1400)
  }
  return (
    <>
      <button type="button" className="c-btn c-copy" onClick={copy} aria-label="Copy email address">
        {status === 'copied' ? 'Copied' : 'Copy'}
      </button>
      <span className="c-sr" role="status">
        {status === 'copied' ? 'Email address copied' : status === 'failed' ? 'Copy failed. Select the address instead.' : ''}
      </span>
    </>
  )
}

export function SurfaceInterrupt() {
  const ui = useUi()
  const heading = useRef<HTMLHeadingElement>(null)
  const open = ui.overlay === 'interrupt'

  useLayoutEffect(() => {
    if (open && ui.phase === 'open') heading.current?.focus({ preventScroll: true })
  }, [open, ui.phase])

  if (!open) return null
  const at = SECTIONS.find((s) => s.id === ui.savedAt) ?? SECTIONS[0]

  return createPortal(
    <div className="c-irq" data-phase={ui.phase}>
      <div className="c-irq__scrim" aria-hidden="true" onClick={() => closeInterrupt()} />
      <div className="c-irq__panel" role="dialog" aria-modal="true" aria-labelledby="chrome-irq-title" onKeyDown={trapTab}>
        <p className="c-irq__ctx" aria-hidden="true">
          context saved @ S{at.n} · {at.nav}
        </p>
        <h2 id="chrome-irq-title" className="c-irq__name" tabIndex={-1} ref={heading}>
          {identity.name}
        </h2>
        <p className="c-irq__role">{identity.role}</p>
        {identity.gradTerm && <p className="c-irq__role">{identity.gradTerm}</p>}

        <a className="c-btn c-btn--sea c-irq__resume" href={links.resume.href} target="_blank" rel="noopener">
          Open resume (PDF) <span aria-hidden="true">↗</span>
          <span className="c-sr"> opens in a new tab</span>
        </a>

        <div className="c-irq__email">
          <a className="c-irq__address" href={links.email.href}>
            <span className="c-sr">Email </span>
            {links.email.address}
          </a>
          <CopyEmail />
        </div>
        <div className="c-irq__links">
          <a className="c-btn" href={links.linkedin.href} target="_blank" rel="noopener">
            {links.linkedin.label} <span aria-hidden="true">↗</span>
          </a>
          <a className="c-btn" href={links.github.href} target="_blank" rel="noopener">
            {links.github.label} <span aria-hidden="true">↗</span>
          </a>
        </div>

        <h3 className="c-irq__h3">Projects</h3>
        <ul className="c-irq__projects">
          {projects.map((p) => (
            <li key={p.key}>
              <a href={`#${p.section}`}>{p.index}</a>
            </li>
          ))}
        </ul>

        <button type="button" className="c-btn c-irq__back" onClick={() => closeInterrupt()}>
          Back to where you were
          <kbd className="c-kbd c-desk">Esc</kbd>
        </button>
        <button type="button" className="c-btn c-irq__x" aria-label="Close" onClick={() => closeInterrupt()}>
          <span aria-hidden="true">✕</span>
        </button>
      </div>
    </div>,
    overlayLayer(),
  )
}
