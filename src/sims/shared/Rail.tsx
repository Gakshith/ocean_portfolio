import type { ReactNode } from 'react'
import { dieCaption } from '../../content/content'

/** The DOM control rail every sim carries: name · running in your browser · actions · die caption. */
export function Rail({ name, children }: { name: string; children?: ReactNode }) {
  return (
    <div className="sim-rail">
      <p className="sim-rail__name">
        <span>{name}</span> <span aria-hidden="true">·</span> <em>running in your browser</em>
      </p>
      {children ? <div className="sim-rail__actions">{children}</div> : null}
      <p className="sim-rail__caption">{dieCaption}</p>
    </div>
  )
}

/** Visually hidden polite live region. */
export function Live({ text }: { text: string }) {
  return (
    <div className="sim-sr" aria-live="polite" aria-atomic="true">
      {text}
    </div>
  )
}
