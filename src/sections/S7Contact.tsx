// S7-contact: the pad list is the primary control at every size and works at 0% (plain links,
// no JS needed). The atoll is its twin: hover or focus on a row lights its pad, wire and lead.
import { useEffect, useRef, useState } from 'react'
import { contact, dieCaption, links } from '../content/content'
import { Atoll } from '../svg/Atoll'
import { leadPosition } from '../svg/geometry'
import type { AtollTarget } from '../svg/Atoll'
import { MessageForm } from './MessageForm'
import { NewTab } from './parts'

const rows: (AtollTarget & { lead: string })[] = [
  { n: 1, label: links.resume.label, href: links.resume.href, external: true, lead: 'Resume' },
  { n: 2, label: links.email.label, href: links.email.href, external: false, lead: 'Email' },
  { n: 3, label: links.linkedin.label, href: links.linkedin.href, external: true, lead: 'LinkedIn' },
  { n: 4, label: links.github.label, href: links.github.href, external: true, lead: 'GitHub' },
  { n: 5, label: links.reflection.label, href: links.reflection.href, external: true, lead: 'Reflection' },
]

const pad = (n: number) => String(n).padStart(2, '0')
const newTab = { target: '_blank', rel: 'noopener' } as const

function CopyEmail() {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  async function copy() {
    try {
      await navigator.clipboard.writeText(links.email.address)
    } catch {
      return // clipboard blocked: the address stays visible and selectable
    }
    setCopied(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 1400)
  }

  return (
    <>
      <button type="button" className="copy t-nav" onClick={copy} aria-label="Copy email address">
        {copied ? 'Copied' : 'Copy'}
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? 'Email address copied' : ''}
      </span>
    </>
  )
}

export function S7Contact() {
  return (
    <section id="contact" data-section="contact" aria-labelledby="contact-title" className="s7">
      <h2 id="contact-title" tabIndex={-1} className="t-display-m s7-line">
        <em>{contact.heading}</em>
      </h2>

      <div className="s7-list">
        <ol className="padlist">
          {rows.map((r) => (
            <li key={r.n} data-pad={r.n} className={r.n === 1 ? 'pad-row pad-row-primary' : 'pad-row'}>
              <a href={r.href} {...(r.external ? newTab : {})}>
                <span className="pad-chip t-tag" aria-hidden="true">
                  {pad(r.n)}
                </span>
                <span className="pad-label">
                  {r.external ? (
                    <NewTab>{r.label}</NewTab>
                  ) : (
                    <>
                      {r.label} <span className="t-data pad-address">{links.email.address}</span>
                    </>
                  )}
                </span>
              </a>
              {r.n === 2 && <CopyEmail />}
            </li>
          ))}
        </ol>
        <MessageForm summary={contact.formSummary} />
      </div>

      <figure className="s7-stage" aria-hidden="true">
        <div className="s7-atoll">
          <Atoll targets={rows} />
          {rows.map((r) => (
            <a
              key={r.n}
              href={r.href}
              tabIndex={-1}
              data-pad={r.n}
              className="lead t-tag"
              style={leadPosition(r.n)}
              {...(r.external ? newTab : {})}
            >
              <span className="lead-n">{pad(r.n)}</span>
              <span className="lead-name"> {r.lead}</span>
            </a>
          ))}
        </div>
      </figure>
      <p className="die-caption s7-caption">{dieCaption}</p>
    </section>
  )
}
