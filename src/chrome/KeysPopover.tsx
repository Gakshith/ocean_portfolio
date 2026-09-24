// The Keys popover (`?`): lists the global keys and switches R off (WCAG 2.1.4).
// Non-modal: Esc, ✕ or a click outside closes it and focus returns to the opener.
import { useEffect, useRef } from 'react'
import { closeOverlay, setRKey, useUi } from '../state/ui'

export function KeysPopover() {
  const ui = useUi()
  const open = ui.overlay === 'keys'
  const box = useRef<HTMLDivElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!open) return
    heading.current?.focus({ preventScroll: true })
    const onDown = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) closeOverlay(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  if (!open) return null
  return (
    <div ref={box} className="c-keys" role="dialog" aria-modal="false" aria-labelledby="chrome-keys-title">
      <h2 id="chrome-keys-title" className="c-keys__title" tabIndex={-1} ref={heading}>
        Keys
      </h2>
      <dl className="c-keys__list">
        <div>
          <dt>
            <kbd className="c-kbd">R</kbd>
          </dt>
          <dd>Summary</dd>
        </div>
        <div>
          <dt>
            <kbd className="c-kbd">?</kbd>
          </dt>
          <dd>Keys</dd>
        </div>
        <div>
          <dt>
            <kbd className="c-kbd">Esc</kbd>
          </dt>
          <dd>Back</dd>
        </div>
      </dl>
      <label className="c-keys__switch">
        <input type="checkbox" role="switch" checked={ui.rKey} onChange={(e) => setRKey(e.target.checked)} />
        <span>
          <kbd className="c-kbd">R</kbd> opens the summary
        </span>
      </label>
      <button type="button" className="c-btn c-keys__x" aria-label="Close keys" onClick={() => closeOverlay()}>
        <span aria-hidden="true">✕</span>
      </button>
    </div>
  )
}
