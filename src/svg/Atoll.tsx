// S7 atoll (Still path): the south half of the die in plan view (C-10). The five contact pads
// are lit (the Still rest state) and bonded out to DOM lead chips. Pads, wires and leads are
// twinned with the pad-list rows through data-pad and CSS :has(); they are links out of the tab
// order inside an aria-hidden figure, so the DOM list stays the one set of real controls.
import { blocks, pads } from './floorplan'
import { DensityFill, PadRing, RectList, SealRing } from './DieParts'
import { ATOLL_VIEW, LEAD_Y, leadX, padRect } from './geometry'
import { nameOnDie } from './glyphs'

export interface AtollTarget {
  n: number
  label: string
  href: string
  external: boolean
}

const name = nameOnDie(50, 50, 66)
const contacts = pads.filter((p) => p.contact).sort((a, b) => a.contact! - b.contact!)

export function Atoll({ targets }: { targets: readonly AtollTarget[] }) {
  return (
    <svg
      className="atoll"
      viewBox={`${ATOLL_VIEW.x} ${ATOLL_VIEW.y} ${ATOLL_VIEW.w} ${ATOLL_VIEW.h}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <rect className="die-core" x="0" y="0" width="100" height="100" />
      <DensityFill id="atoll-fill" />
      {blocks.map((b) => (
        <rect key={b.section} className={`block-layer layer-${b.layer}`} x={b.x} y={b.y} width={b.w} height={b.h} />
      ))}
      <RectList rects={name} className="atoll-name" />
      <SealRing />
      <PadRing skipContact />
      {contacts.map((p) => {
        const t = targets[p.contact! - 1]
        const lx = leadX(p.contact!)
        const ext = t.external ? { target: '_blank', rel: 'noopener' } : {}
        return (
          <a key={t.n} href={t.href} tabIndex={-1} data-pad={t.n} className="atoll-pad" {...ext}>
            <path className="atoll-wire" d={`M${p.x} ${p.y + 1.5}V100L${lx} ${LEAD_Y - 6}V${LEAD_Y - 1.5}`} />
            <rect className="atoll-hit" x={p.x - 3} y={p.y - 3} width="6" height="6" />
            <rect className="pad-contact" {...padRect(p)} />
          </a>
        )
      })}
    </svg>
  )
}
