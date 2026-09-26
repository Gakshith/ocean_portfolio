// S6-cybot: off-die, past the reef. The one sticky split: text scrolls, the stage (sims_agent's
// static SVG in phase 1) holds on the right. Text is never keyed to scrub position.
import { cybot, projects } from '../content/content'
import { CybotStill } from '../sims'
import { Chips, MediaSlot } from './parts'

const p = projects.find((x) => x.key === 'cybot')!

export function S6Cybot() {
  return (
    <section id="cybot" data-section="cybot" aria-labelledby="cybot-title" className="s6">
      <div className="s6-text">
        <p className="t-tag eyebrow">Off-die · UART</p>
        <h2 id="cybot-title" tabIndex={-1} className="t-display-l">
          {p.title}
        </h2>
        {p.body.map((para) => (
          <p key={para} className="measure">
            {para}
          </p>
        ))}
        <p className="measure s6-offdie">{cybot.offDie}</p>
        {cybot.sensingDetail && <p className="measure">{cybot.sensingDetail}</p>}
        <Chips items={p.stack} label={`${p.title}: tools`} />
        <MediaSlot media={p.media} />
        <p className="proj-next t-nav">
          <a href="#contact">
            Next: Contact<span aria-hidden="true"> ↓</span>
          </a>
          <a href="#about">
            Back to die map<span aria-hidden="true"> ↑</span>
          </a>
        </p>
      </div>
      <div className="s6-stage">
        <CybotStill headingId="cybot-title" />
      </div>
    </section>
  )
}
