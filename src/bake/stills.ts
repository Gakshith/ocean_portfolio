// The DOM's slice of the bake (written by `npm run bake` as stills.json): S1's focused frame and
// S6's SE-reef backdrop. Paths are relative to import.meta.env.BASE_URL.
import raw from './stills.json'

export interface DomStills {
  s1: { src: string; srcset: [number, string][]; w: number; h: number }
  s6: { src: string; srcset: [number, string][]; w: number; h: number; pad: { x: number; y: number } }
}

export const stills = raw as DomStills
