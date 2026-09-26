// S1-hero, Still path: the ink plate (name, role, grad-term slot, 4-line project index) over the
// focused-die still. The plate never animates; there is no CTA in it (the pill is the CTA).
import { useEffect, useRef } from 'react'
import { hero, identity, projects } from '../content/content'
import { stills } from '../bake/stills'

const base = import.meta.env.BASE_URL
const { s1 } = stills
const srcSet = s1.srcset.map(([w, p]) => `${base}${p} ${w}w`).join(', ')

/** The baked focused frame (step 5). It is painted into a canvas after hydration, so it is never an
 *  LCP candidate and can't out-paint the plate text (C-21); the fetch still runs at high priority.
 *  Without JS the <noscript> image shows it. Decorative: the sr-only line below describes it. */
function HeroStill() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current
    if (!c || typeof createImageBitmap !== 'function' || typeof fetch !== 'function') return
    const need = c.clientWidth * Math.min(window.devicePixelRatio || 1, 2)
    const pick = s1.srcset.find(([w]) => w >= need) ?? s1.srcset[s1.srcset.length - 1]
    let live = true
    // Decoded off the main thread (an <img> drawn into a canvas decodes AVIF on it: ~700 ms of
    // blocking time on a throttled phone), then handed to the canvas without a copy.
    fetch(base + pick[1], { priority: 'high' })
      .then((r) => (r.ok ? r.blob() : Promise.reject(r.status)))
      .then((b) => createImageBitmap(b))
      .then((bmp) => {
        const g = live ? c.getContext('bitmaprenderer') : null
        if (!g) return bmp.close()
        c.width = bmp.width
        c.height = bmp.height
        g.transferFromImageBitmap(bmp)
        c.dataset.ready = ''
      })
      .catch(() => {})
    return () => {
      live = false
    }
  }, [])
  return (
    <>
      <canvas ref={ref} className="hero-still" width={16} height={16} aria-hidden="true" />
      <noscript>
        <img className="hero-still" src={base + s1.src} srcSet={srcSet} sizes="(max-width: 767px) 32svh, 50vw" width={s1.w} height={s1.h} alt="" />
      </noscript>
    </>
  )
}

export function S1Hero() {
  return (
    <section id="top" data-section="top" aria-labelledby="top-title" className="s1">
      <div className="plate" data-gl-avoid>
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
        <div data-adv-slot aria-hidden="true" />
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
