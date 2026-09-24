// Drawing frames for the spectrogram: the desktop band and the 343×220 phone surface.
export interface Frame {
  w: number
  h: number
  gutter: number
  cols: number
  /** Expected CSS px per unit before the real size is measured (SSR, first paint). */
  nominalScale: number
  compact: boolean
}

export const WIDE: Frame = { w: 1000, h: 360, gutter: 92, cols: 30, nominalScale: 1.26, compact: false }
export const NARROW: Frame = { w: 343, h: 220, gutter: 40, cols: 12, nominalScale: 1, compact: true }
