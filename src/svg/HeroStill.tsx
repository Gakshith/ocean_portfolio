// S1 still (build order step 3): an SVG drawing of the focused die, standing in for the baked
// AVIF until step 5. Target luminance per the plan: traces 1.0 · pads 0.35 · seal 0.30 ·
// straps 0.20 · fill 0.20 · core 0.02. Decorative; the DOM plate carries the meaning.
import { blocks, core } from './floorplan'
import { DensityFill, PadRing, RectList, SealRing } from './DieParts'
import { nameOnDie } from './glyphs'

const NAME_W = 66
const name = nameOnDie(50, 50, NAME_W)
const xs = name.map(([x, , w]) => [x, x + w]).flat()
const ys = name.map(([, y, , h]) => [y, y + h]).flat()
const keepOut = { x: Math.min(...xs) - 2.5, y: Math.min(...ys) - 2.5, w: 0, h: 0 }
keepOut.w = Math.max(...xs) + 2.5 - keepOut.x
keepOut.h = Math.max(...ys) + 2.5 - keepOut.y

export function HeroStill() {
  return (
    <svg className="hero-still" viewBox="-4 -4 108 108" aria-hidden="true" focusable="false">
      <defs>
        <filter id="hero-bloom" x="-10%" y="-20%" width="120%" height="140%">
          <feGaussianBlur stdDeviation="0.9" />
        </filter>
      </defs>
      <rect className="die-core" x="0" y="0" width="100" height="100" />
      <DensityFill id="hero-fill" />
      {/* straps: the core's power ring and two rails */}
      <g className="die-strap">
        <rect x={core.x} y={core.y} width={core.w} height="1.2" />
        <rect x={core.x} y={core.y + core.h - 1.2} width={core.w} height="1.2" />
        <rect x={core.x} y={core.y} width="1.2" height={core.h} />
        <rect x={core.x + core.w - 1.2} y={core.y} width="1.2" height={core.h} />
      </g>
      <g className="die-blocks">
        {blocks.map((b) => (
          <rect key={b.section} className={`layer-${b.layer}`} x={b.x} y={b.y} width={b.w} height={b.h} />
        ))}
      </g>
      <rect className="die-core" x={keepOut.x} y={keepOut.y} width={keepOut.w} height={keepOut.h} />
      <SealRing />
      <PadRing />
      <g filter="url(#hero-bloom)">
        <RectList rects={name} className="hero-name-bloom" />
      </g>
      <RectList rects={name} className="hero-name" />
    </svg>
  )
}
