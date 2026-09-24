// S1-hero, Still path: the ink plate (name, role, grad-term slot, 4-line project index) over the
// focused-die still. The plate never animates; there is no CTA in it (the pill is the CTA).
import { hero, identity, projects } from '../content/content'
import { HeroStill } from '../svg/HeroStill'

export function S1Hero() {
  return (
    <section id="top" data-section="top" aria-labelledby="top-title" className="s1">
      <div className="plate">
        <h1 id="top-title" tabIndex={-1} className="t-display-xl plate-name">
          {identity.name}
        </h1>
        <p className="t-lede plate-role">{identity.role}</p>
        {identity.gradTerm && <p className="t-small plate-grad">{identity.gradTerm}</p>}
        <ul className="plate-index" aria-label="Projects">
          {projects.map((p) => (
            <li key={p.key}>
              <a href={`#${p.section}`} className="t-data">
                {p.index}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="s1-stage">
        <HeroStill />
        <p className="sr-only">{hero.imageDescription}</p>
      </div>
      <p className="scroll-cue t-small" aria-hidden="true">
        {hero.scrollCue}
      </p>
    </section>
  )
}
