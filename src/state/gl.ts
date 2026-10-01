// The 3D chunk's lifecycle as it reports it on <html data-gl> (live · frozen · failed; absent
// before it starts). A tiny store over a MutationObserver, so the DOM can stay honest about what
// is on screen: after a phone freeze (R-P2-10) has3D stays true, yet the page shows a still.
import { useSyncExternalStore } from 'react'

export type GlState = 'live' | 'frozen' | 'failed' | null

const read = (): GlState => {
  const v = document.documentElement.dataset.gl
  return v === 'live' || v === 'frozen' || v === 'failed' ? v : null
}

function subscribe(fn: () => void): () => void {
  const mo = new MutationObserver(fn)
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-gl'] })
  return () => mo.disconnect()
}

export function useGlState(): GlState {
  return useSyncExternalStore(subscribe, read, () => null)
}
