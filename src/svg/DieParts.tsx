// Shared die geometry drawn as SVG, in die units (floorplan.ts). Colours come from CSS classes
// (sections.css), never attributes, so every fill is a token.
import { core, DIE, pads, seal } from './floorplan'
import { padRect, round as f } from './geometry'
import type { Rect } from './glyphs'

export function RectList({ rects, className }: { rects: readonly Rect[]; className?: string }) {
  return (
    <g className={className}>
      {rects.map(([x, y, w, h], i) => (
        <rect key={i} x={f(x)} y={f(y)} width={f(w)} height={f(h)} />
      ))}
    </g>
  )
}

/** Double seal ring at the die edge. */
export function SealRing() {
  return (
    <g className="die-seal">
      <rect x={seal.outer} y={seal.outer} width={DIE.w - 2 * seal.outer} height={DIE.h - 2 * seal.outer} />
      <rect x={seal.inner} y={seal.inner} width={DIE.w - 2 * seal.inner} height={DIE.h - 2 * seal.inner} />
    </g>
  )
}

/** Dummy density fill over the core: small squares on a fixed pitch (a pattern, one node). */
export function DensityFill({ id, pitch = 2.4, size = 0.8 }: { id: string; pitch?: number; size?: number }) {
  return (
    <>
      <defs>
        <pattern id={id} width={pitch} height={pitch} patternUnits="userSpaceOnUse">
          <rect className="die-fill-cell" width={size} height={size} />
        </pattern>
      </defs>
      <rect x={core.x} y={core.y} width={core.w} height={core.h} fill={`url(#${id})`} />
    </>
  )
}

/** The 60-pad reef. Contact pads get their own class so each view can colour them. */
export function PadRing({ skipContact = false }: { skipContact?: boolean }) {
  return (
    <g className="die-pads">
      {pads.map((p) =>
        skipContact && p.contact ? null : (
          <rect
            key={`${p.side}${p.i}`}
            {...padRect(p)}
            className={p.contact ? 'pad-contact' : p.uart ? 'pad-uart' : undefined}
          />
        ),
      )}
    </g>
  )
}
