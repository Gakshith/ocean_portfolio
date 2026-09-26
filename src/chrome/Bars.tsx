// The top bar (every width), the desktop die-map minimap and Still toggle,
// and the phone bottom bar with its section sheet.
import { useEffect, useRef } from 'react'
import { identity } from '../content/content'
import { useNav } from '../state/nav'
import { SECTIONS } from '../state/sections'
import { closeOverlay, openSheet, useUi } from '../state/ui'
import { Floorplan } from './Floorplan'
import { ContactTrigger, ResumeLink, SectionLinks, StillToggle } from './parts'

export function TopBar() {
  const { current } = useNav()
  const here = SECTIONS.find((s) => s.id === current)
  return (
    <header className="c-bar">
      <a className="c-wordmark" href="#top">
        {identity.name}
      </a>
      <p className="c-where">
        {here && here.id !== 'top' && (
          <>
            <span aria-hidden="true">/ </span>
            <span className="c-sr">Now reading: </span>
            {here.nav}
          </>
        )}
      </p>
      <nav className="c-pill" aria-label="Resume and contact">
        <ResumeLink className="c-pill__resume" />
        <ContactTrigger className="c-pill__contact" />
      </nav>
    </header>
  )
}

export function DieMap() {
  const { current, visited } = useNav()
  return (
    <nav className="c-diemap" aria-label="Sections">
      <Floorplan className="c-diemap__plan" current={current} visited={visited} />
      <SectionLinks className="c-diemap__links" current={current} />
    </nav>
  )
}

export function DeskStill() {
  return <StillToggle className="c-btn c-still c-still--desk" />
}

export function BottomBar() {
  const { current, visited } = useNav()
  const ui = useUi()
  const open = ui.overlay === 'sheet'
  const here = SECTIONS.find((s) => s.id === current) ?? SECTIONS[0]
  const chip = useRef<HTMLButtonElement>(null)
  const sheet = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (!sheet.current?.contains(t) && !chip.current?.contains(t)) closeOverlay(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  return (
    <div className="c-phone">
      <div id="chrome-sheet" className="c-sheet" ref={sheet} hidden={!open}>
        <nav className="c-sheet__nav" aria-label="Sections">
          <Floorplan className="c-sheet__plan" current={current} visited={visited} />
          <SectionLinks className="c-sheet__links" current={current} />
        </nav>
        <StillToggle className="c-btn c-still c-still--row" />
      </div>
      <div className="c-bbar">
        <button
          ref={chip}
          type="button"
          className="c-bbar__chip"
          aria-expanded={open}
          aria-controls="chrome-sheet"
          aria-label={`Sections, ${here.n} of ${SECTIONS.length}, ${here.nav}`}
          onClick={() => (open ? closeOverlay() : openSheet(chip.current))}
        >
          <span aria-hidden="true">≡</span>
          <span className="c-bbar__n" aria-hidden="true">
            {here.n}/{SECTIONS.length}
          </span>
          <span className="c-bbar__label" aria-hidden="true">
            {here.nav}
          </span>
          <span aria-hidden="true">{open ? '▾' : '▴'}</span>
        </button>
        <ResumeLink className="c-bbar__resume" />
        <ContactTrigger className="c-bbar__contact" />
      </div>
    </div>
  )
}
