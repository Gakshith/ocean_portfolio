// S2-about: who, school, skills, and the die map as the project index.
import { about, dieCaption, identity, projects } from '../content/content'
import { DieMap } from '../svg/DieMap'
import { PhotoSlot } from './parts'

const [line1, line2] = about.display.split('. ').map((s, i, a) => (i < a.length - 1 ? `${s}.` : s))

export function S2About() {
  return (
    <section id="about" data-section="about" aria-labelledby="about-title" className="s2 ground">
      <div className="s2-text">
        <h2 id="about-title" tabIndex={-1} className="t-display-l s2-display">
          <span>{line1}</span> <span>{line2}</span>
        </h2>
        <p className="t-lede s2-lede">{about.lede}</p>
        <p className="measure">{identity.about}</p>
        {identity.oceanStory && <p className="measure">{identity.oceanStory}</p>}
        <dl className="facts">
          {identity.facts.map((f) => (
            <div key={f.term} className="fact">
              <dt className="t-small">{f.term}</dt>
              <dd>{f.values.join(' · ')}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="s2-die">
        <div className="diemap-frame">
          <DieMap />
        </div>
        <p className="die-caption">{dieCaption}</p>
        <h3 className="t-display-m s2-die-h">{about.dieHeading}</h3>
        <ul className="die-rows">
          {projects.map((p) => (
            <li key={p.key} data-k={p.section}>
              <a href={`#${p.section}`}>
                <span className="t-tag die-row-block">{p.block}</span>{' '}
                <span className="die-row-title">{p.title}</span>
                <span className="arrow" aria-hidden="true">
                  ↓
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="s2-photo">
        <PhotoSlot media={identity.photo} ratio="4 / 5" />
        {identity.oceanPhoto && <PhotoSlot media={identity.oceanPhoto} ratio="3 / 2" />}
      </div>
    </section>
  )
}
