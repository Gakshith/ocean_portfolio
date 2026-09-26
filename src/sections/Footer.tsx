// Footer: name · Iowa State · Back to top · Still · Keys. The die caption lives in S7 just above
// (R-P1-11), so it is not repeated here.
// "How the light works" is held back in phase 1 (lead ruling 1): the Still site shows no
// refraction yet. Its copy waits in content.ts (footer.howLight).
import { identity } from '../content/content'
import { useMotion } from '../state/motion'
import { openKeys } from '../state/ui'

export function Footer() {
  const { stillChosen, setStill } = useMotion()
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
    </footer>
  )
}
