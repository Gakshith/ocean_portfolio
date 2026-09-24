// Small shared pieces: scribe lanes, slot frames, stack chips, external-link marker.
import type { ReactNode } from 'react'
import type { Media } from '../content/content'

/** Section break in photomask grammar (plan, Global UI): keys, die-ID, ticks. Never interactive. */
export function Scribe({ dieId }: { dieId: string }) {
  return (
    <div className="scribe" aria-hidden="true">
      <svg className="scribe-key" viewBox="0 0 14 14" width="14" height="14" focusable="false">
        <rect x=".5" y=".5" width="13" height="13" />
        <rect x="4.5" y="4.5" width="5" height="5" />
      </svg>
      <span className="scribe-id t-data">{dieId}</span>
      <span className="scribe-ticks" />
      <svg className="scribe-key" viewBox="0 0 14 14" width="14" height="14" focusable="false">
        <path d="M7 0V14M0 7H14" />
      </svg>
    </div>
  )
}

/** An empty photo slot: dummy fill, four L-fiducials and one word. Decorative. */
export function Unexposed({ ratio }: { ratio: '4 / 5' | '3 / 2' }) {
  return (
    <div className="frame unexposed" style={{ aspectRatio: ratio }} aria-hidden="true">
      <Fiducials />
      <span className="unexposed-word t-tag">Unexposed</span>
    </div>
  )
}

function Fiducials() {
  return (
    <>
      <i className="fid fid-tl" />
      <i className="fid fid-tr" />
      <i className="fid fid-bl" />
      <i className="fid fid-br" />
    </>
  )
}

/** A photo slot: the photo when supplied, otherwise the unexposed frame. */
export function PhotoSlot({ media, ratio }: { media: Media | null; ratio: '4 / 5' | '3 / 2' }) {
  if (!media) return <Unexposed ratio={ratio} />
  return (
    <figure className="frame photo" style={{ aspectRatio: ratio }}>
      <img src={media.src} alt={media.alt} loading="lazy" decoding="async" />
      {media.caption && <figcaption className="t-small">{media.caption}</figcaption>}
    </figure>
  )
}

/** Project media in an inspection frame, shown unretouched. Renders nothing while empty. */
export function MediaSlot({ media }: { media: Media | null }) {
  if (!media) return null
  return (
    <figure className="inspect">
      <div className="frame">
        <Fiducials />
        <img src={media.src} alt={media.alt} loading="lazy" decoding="async" />
      </div>
      <figcaption className="t-small">{media.caption || 'from the project'}</figcaption>
    </figure>
  )
}

export function Chips({ items, label }: { items: readonly string[]; label: string }) {
  if (items.length === 0) return null
  return (
    <ul className="chips" aria-label={label}>
      {items.map((c) => (
        <li key={c} className="chip t-tag">
          {c}
        </li>
      ))}
    </ul>
  )
}

/** ↗ for links that open a new tab, with the words for screen readers. */
export function NewTab({ children }: { children?: ReactNode }) {
  return (
    <>
      {children}
      <span className="arrow" aria-hidden="true">
        {' ↗'}
      </span>
      <span className="sr-only"> (opens in a new tab)</span>
    </>
  )
}
