// The die floorplan as a small SVG: the minimap face and the phone sheet's map.
// Current block filled with its layer colour, visited at 45%, the rest outline only.
import { blocks, DIE, uartPad } from '../svg/floorplan'
import type { SectionId } from '../state/sections'

const PADS_PER_SIDE = 12
const PAD = 3
const CONTACT_PADS = 5

function padRing() {
  const pads: { x: number; y: number; contact: boolean }[] = []
  const step = DIE.w / (PADS_PER_SIDE + 1)
  const first = Math.round((PADS_PER_SIDE - CONTACT_PADS) / 2)
  for (let i = 1; i <= PADS_PER_SIDE; i++) {
    const t = i * step - PAD / 2
    pads.push({ x: t, y: 1, contact: false })
    pads.push({ x: t, y: DIE.h - 1 - PAD, contact: i > first && i <= first + CONTACT_PADS })
    pads.push({ x: 1, y: t, contact: false })
    pads.push({ x: DIE.w - 1 - PAD, y: t, contact: false })
  }
  return pads
}
const PADS = padRing()

export function Floorplan({
  current,
  visited,
  className,
}: {
  current: SectionId | null
  visited: ReadonlySet<SectionId>
  className?: string
}) {
  const offDie = current === 'cybot'
  return (
    <svg
      className={className}
      viewBox={`-4 -4 ${DIE.w + 14} ${DIE.h + 14}`}
      aria-hidden="true"
      focusable="false"
      data-current={current ?? undefined}
    >
      <rect className="c-fp-die" x="0" y="0" width={DIE.w} height={DIE.h} data-lit={current === 'about' || current === 'top' || undefined} />
      <rect className="c-fp-seal" x="5" y="5" width={DIE.w - 10} height={DIE.h - 10} />
      {blocks.map((b) => (
        <rect
          key={b.section}
          className="c-fp-block"
          x={b.x}
          y={b.y}
          width={b.w}
          height={b.h}
          style={{ ['--layer' as string]: `var(--${b.layer})` }}
          data-state={b.section === current ? 'current' : visited.has(b.section) ? 'visited' : undefined}
        />
      ))}
      {PADS.map((p, i) => (
        <rect
          key={i}
          className="c-fp-pad"
          x={p.x}
          y={p.y}
          width={PAD}
          height={PAD}
          data-lit={(p.contact && current === 'contact') || undefined}
        />
      ))}
      <rect className="c-fp-pad" x={uartPad.x - PAD / 2} y={uartPad.y - PAD / 2} width={PAD} height={PAD} data-lit={offDie || undefined} />
      <path className="c-fp-wire" d={`M${uartPad.x} ${uartPad.y}H${DIE.w + 5}V${DIE.h + 4}`} data-lit={offDie || undefined} />
      <rect className="c-fp-bot" x={DIE.w + 2} y={DIE.h + 1} width="6" height="6" data-lit={offDie || undefined} />
    </svg>
  )
}
