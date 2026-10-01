// Footer: name · Iowa State · Back to top · Still · Keys, then "How the light works". The die
// caption lives in S7 just above (R-P1-11), so it is not repeated here.
// "How the light works" states only what is on screen: the verbatim plan copy while the renderer
// draws live, and the Still variant otherwise, including after a freeze or a failure (R-P2-17),
// when has3D stays true but the page shows a still.
import { ThreeDControl } from '../chrome/parts'
import { footer, identity } from '../content/content'
import { useGlState } from '../state/gl'
import { useMotion } from '../state/motion'
import { openKeys } from '../state/ui'

const newTab = { target: '_blank', rel: 'noopener' } as const

export function Footer() {
  const { stillChosen, reducedMotion, setStill, has3D, off3D } = useMotion()
  const gl = useGlState()
  const { yue, middle, ferraro } = footer.howLight
  const live = has3D && gl !== 'frozen' && gl !== 'failed'
  const { before, after } = live ? footer.howLight : footer.howLightStill
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
          <button type="button" aria-pressed={stillChosen || reducedMotion} onClick={() => setStill(!stillChosen)}>
            Still
          </button>
        </li>
        {off3D && (
          <li>
            <ThreeDControl />
          </li>
        )}
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
