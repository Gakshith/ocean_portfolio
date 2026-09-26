// Public surface of the sims slice (contract §7). Each sim is 100% of its column and
// handles its own phone layout; sections mount them with the section h2 id.
import './shared/sims.css'

export type { SimProps } from './types'
export { Hop } from './hop/Hop'
export { BubbleLock } from './pipeline/BubbleLock'
export { TidePool } from './wisard/TidePool'
export { CybotStill } from './cybot/CybotStill'

