// Footer: name · Iowa State · Back to top · Still · Keys, then "How the light works". The die
// caption lives in S7 just above (R-P1-11), so it is not repeated here.
// "How the light works" states only what ships: the verbatim plan copy while the 3D renderer is
// live, and the Still variant (lead, Q4) otherwise.
import { footer, identity } from '../content/content'
import { useMotion } from '../state/motion'
import { openKeys } from '../state/ui'

const newTab = { target: '_blank', rel: 'noopener' } as const

export function Footer() {
  const { stillChosen, setStill, has3D } = useMotion()
  const { yue, middle, ferraro } = footer.howLight
  const { before, after } = has3D ? footer.howLight : footer.howLightStill
  return (
    <footer className="site-footer">
      <p className="footer-id">
        {identity.name} <span aria-hidden="true">·</span> <span className="footer-school">Iowa State</span>
      </p>
      <ul className="footer-links t-nav">
        <li>
          <a href="#top">
            Back to top<span aria-hidden="true"> ↑</span>
          </a>
        </li>
        <li>
          <button type="button" aria-pressed={stillChosen} onClick={() => setStill(!stillChosen)}>
            Still
          </button>
        </li>
        <li>
          <button type="button" onClick={() => openKeys()}>
            Keys
          </button>
        </li>
      </ul>
      <details className="how-light">
        <summary className="t-nav">{footer.howLightHeading}</summary>
        <p className="t-small">
          {before}
          <a href={yue.href} {...newTab}>
            {yue.label}
          </a>
          {middle}
          <a href={ferraro.href} {...newTab}>
            {ferraro.label}
          </a>
          {after}
        </p>
      </details>
    </footer>
  )
}
