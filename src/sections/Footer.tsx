// Footer: name · Iowa State · Back to top · Still · Keys, plus the die caption (C-17).
// "How the light works" is held back in phase 1 (lead ruling 1): the Still site shows no
// refraction yet. Its copy waits in content.ts (footer.howLight).
import { dieCaption, identity } from '../content/content'
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
      <p className="die-caption footer-caption">{dieCaption}</p>
    </footer>
  )
}
