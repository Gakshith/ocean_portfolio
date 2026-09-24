// S2 die map (Still path): the floorplan in plan view. Blocks are links to their sections,
// twinned with the "On this die" rows (twinning is CSS :has() on data-k, so it needs no JS).
// The SVG is aria-hidden and its links are out of the tab order; the DOM rows are the real
// controls. The name stays in top metal at 12%, all three layers at 35%.
import { blocks, lagoon, uartPad } from './floorplan'
import { DensityFill, PadRing, RectList, SealRing } from './DieParts'
import { nameOnDie } from './glyphs'

const name = nameOnDie(50, 50, 66)
const TAG: Record<string, string> = { Radio: 'RADIO · LL', CPU: 'CPU · 5-STAGE', Memory: 'MEM · WISARD' }

export function DieMap() {
  return (
    <svg className="diemap" viewBox="-3 -3 118 106" aria-hidden="true" focusable="false">
      <rect className="die-core" x="0" y="0" width="100" height="100" />
      <DensityFill id="diemap-fill" pitch={3} size={0.9} />
      <rect className="die-lagoon" x={lagoon.x} y={lagoon.y} width={lagoon.w} height={lagoon.h} />
      {blocks.map((b) => (
        <a key={b.section} href={`#${b.section}`} tabIndex={-1} data-k={b.section} className="diemap-block">
          <rect className={`block-bg`} x={b.x} y={b.y} width={b.w} height={b.h} />
          <rect className={`block-layer layer-${b.layer}`} x={b.x} y={b.y} width={b.w} height={b.h} />
          <rect className={`block-edge edge-${b.layer}`} x={b.x} y={b.y} width={b.w} height={b.h} />
          <text className="die-label" x={b.x + 1.6} y={b.y + 3.8}>
            {TAG[b.label]}
          </text>
        </a>
      ))}
      <RectList rects={name} className="diemap-name" />
      <text className="die-label die-label-dim" x={lagoon.x + 1.6} y={lagoon.y + lagoon.h - 2}>
        LAGOON
      </text>
      <SealRing />
      <PadRing />
      {/* UART pad on the SE reef, bonded off-die to CyBot */}
      <a href="#cybot" tabIndex={-1} data-k="cybot" className="diemap-block diemap-uart">
        <path className="diemap-wire" d={`M${uartPad.x + 1.5} ${uartPad.y}H103V94H112`} />
        <rect className="block-bg" x="100" y="90" width="15" height="10" />
        <rect className="block-edge edge-uart" x="100" y="90" width="15" height="10" />
        <text className="die-label" x="101.4" y="96.2">
          CYBOT
        </text>
      </a>
    </svg>
  )
}
