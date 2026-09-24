// Lays out the canonical glyph set (src/content/glyphs.json, extracted verbatim from 04-art)
// into rectangles. Units are tracks; the word block's origin is its top-left corner.
import GS from '../content/glyphs.json'

export type Rect = readonly [x: number, y: number, w: number, h: number]

type Glyph = { r: number[][]; v: number[][] }
const glyphs = GS.glyphs as Record<string, Glyph>
const [GW, GH] = GS.grid

/** Strokes plus vias (2×2 squares centred on the listed points, clamped inside the glyph). */
export function glyphRects(ch: string): Rect[] {
  const g = glyphs[ch]
  const out: Rect[] = g.r.map(([x, y, w, h]) => [x, y, w, h] as const)
  for (const [x, y] of g.v) {
    const vx = Math.min(Math.max(x - GS.via / 2, 0), GW - GS.via)
    const vy = Math.min(Math.max(y - GS.via / 2, 0), GH - GS.via)
    out.push([vx, vy, GS.via, GS.via])
  }
  return out
}

const lineWidth = (word: string) => word.length * GW + (word.length - 1) * GS.letterGap

/** Both lines, each centred on the wider one. */
export function wordLayout(lines: readonly string[] = GS.lines) {
  const W = Math.max(...lines.map(lineWidth))
  const rects: Rect[] = []
  lines.forEach((word, li) => {
    const x0 = (W - lineWidth(word)) / 2
    const y0 = li * (GH + GS.lineGap)
    ;[...word].forEach((ch, i) => {
      for (const [x, y, w, h] of glyphRects(ch)) rects.push([x + x0 + i * (GW + GS.letterGap), y + y0, w, h])
    })
  })
  return { rects, W, H: lines.length * GH + (lines.length - 1) * GS.lineGap }
}

/** The name placed on the die: centred on the core, `width` die units wide. */
export function nameOnDie(cx: number, cy: number, width: number) {
  const { rects, W, H } = wordLayout()
  const u = width / W
  const ox = cx - (W * u) / 2
  const oy = cy - (H * u) / 2
  return rects.map(([x, y, w, h]) => [ox + x * u, oy + y * u, w * u, h * u] as Rect)
}
