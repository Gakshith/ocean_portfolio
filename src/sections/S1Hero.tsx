// S1-hero, Still path: the ink plate (name, role, grad-term slot, 4-line project index) over the
// focused-die still. The plate never animates; there is no CTA in it (the pill is the CTA).
import { useEffect, useLayoutEffect, useRef } from 'react'
import { hero, identity, projects } from '../content/content'
import { stills } from '../bake/stills'
import { pinCompensation, stickyBlockers } from '../scroll/pin'
import { invalidateLayout } from '../scroll/scroll'
import { syncScroller } from '../state/jump'
import { useMotion } from '../state/motion'

// useLayoutEffect warns during SSR; the prerender never runs effects anyway.
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

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
      .catch((e) => {
        // The still is decorative: the page stays whole without it.
        if (import.meta.env.DEV) console.warn(e)
      })
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

/** The S1 pin (R-P2-12): the track is always rendered (SSR too) so toggling never remounts S1;
 *  while load3D it gets the pin length and S1 sticks through it. The scroll is compensated in the
 *  same frame the pin mounts or unmounts, and focus never moves. */
function usePin() {
  const { load3D } = useMotion()
  const track = useRef<HTMLDivElement>(null)
  const section = useRef<HTMLElement>(null)
  const last = useRef({ pinned: false, pinLen: 0 })
  useIsoLayoutEffect(() => {
    const t = track.current
    const s = section.current
    if (!t || !s) return
    const pinLen = Math.max(0, t.offsetHeight - s.offsetHeight)
    const was = last.current
    if (was.pinned !== load3D) {
      const len = load3D ? pinLen : was.pinLen
      const s1Bottom = t.offsetTop + s.offsetHeight
      const y = window.scrollY
      const next = pinCompensation(y, len, s1Bottom, load3D)
      if (next !== y) window.scrollTo({ top: next, behavior: 'instant' })
      invalidateLayout()
      syncScroller()
      if (load3D && import.meta.env.DEV) {
        const bad = stickyBlockers(s)
        if (bad.length) console.warn('S1 pin: an ancestor clips overflow, so sticky will not stick', bad)
      }
    }
    last.current = { pinned: load3D, pinLen }
  }, [load3D])
  return { track, section, pinned: load3D }
}

export function S1Hero() {
  const { track, section, pinned } = usePin()
  return (
    <div ref={track} className={pinned ? 's1-track s1-track--pin' : 's1-track'}>
      <section ref={section} id="top" data-section="top" aria-labelledby="top-title" className="s1">
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
    </div>
  )
}
