// S3–S5: a project drawn on its block. Sections own the text around the sim; the sim (sims_agent)
// owns the rail, surface, twins and live region. The text reads completely without the sim.
import type { ReactNode } from 'react'
import type { Project } from '../content/content'
import { Chips, MediaSlot } from './parts'

export interface Next {
  href: string
  label: string
}

export function ProjectSection({
  project: p,
  variant,
  next,
  children,
}: {
  project: Project
  variant: 's3' | 's4' | 's5'
  next: Next
  children: ReactNode
}) {
  const id = p.section
  return (
    <section id={id} data-section={id} aria-labelledby={`${id}-title`} className={`proj ${variant} ground`}>
      <div className="proj-head">
        <p className="t-tag eyebrow">{p.block} block</p>
        <h2 id={`${id}-title`} tabIndex={-1} className="t-display-l">
          {p.title}
        </h2>
        {p.status && <p className="t-data proj-status">{p.status}</p>}
        {p.role && <p className="proj-role measure">{p.role}</p>}
      </div>

      <div className="proj-body">
        {p.body.map((para) => (
          <p key={para} className="measure">
            {para}
          </p>
        ))}
        {p.honesty && (
          <p className="proj-honesty measure">
            <em>{p.honesty}</em>
          </p>
        )}
        <Chips items={p.stack} label={`${p.title}: tools`} />
      </div>

      {/* The sim draws its own block surface, layer rule and die-ID (contract §7): no frame here. */}
      <div className="sim-mount">{children}</div>
      {p.dataLine && <p className="t-data data-line">{p.dataLine}</p>}

      <MediaSlot media={p.media} />

      <p className="proj-next t-nav">
        <a href={next.href}>
          {next.label}
          <span aria-hidden="true"> ↓</span>
        </a>
        <a href="#about">
          Back to die map<span aria-hidden="true"> ↑</span>
        </a>
      </p>
    </section>
  )
}
