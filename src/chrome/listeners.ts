// Global listeners for the chrome: in-page jumps, R / ? / Esc, Back, hash changes, and
// section tracking. Installed once by <Chrome/> after hydration.
import { useEffect } from 'react'
import { jumpTo } from '../state/jump'
import { isSectionId, trackSections } from '../state/nav'
import { closeInterrupt, closeOverlay, handlePopState, openInterrupt, openKeys, uiStore } from '../state/ui'

const TEXT_INPUT = /^(text|search|email|url|tel|password|number|date|time|datetime-local|month|week)$/

/** R and ? are single-key shortcuts, so they stand down wherever keys mean something else. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.closest('[data-no-shortcuts]')) return true
  if (target.isContentEditable || target.getAttribute('contenteditable') === 'true') return true
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true
  return target instanceof HTMLInputElement && TEXT_INPUT.test(target.type)
}

function onClick(e: MouseEvent) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  const a = e.target instanceof Element ? e.target.closest('a[href^="#"]') : null
  if (!a || a.hasAttribute('data-interrupt')) return
  const id = decodeURIComponent(a.getAttribute('href')!.slice(1))
  if (!isSectionId(id)) return
  e.preventDefault()
  const { overlay } = uiStore.get()
  if (overlay === 'interrupt') return closeInterrupt(id)
  if (overlay) closeOverlay(false)
  jumpTo(id)
}

function onKeyDown(e: KeyboardEvent) {
  if (e.defaultPrevented || e.isComposing) return
  const { overlay, rKey } = uiStore.get()
  if (e.key === 'Escape') {
    if (overlay) {
      e.preventDefault()
      closeOverlay()
    }
    return
  }
  if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return
  if (overlay === 'interrupt') return
  if ((e.key === 'r' || e.key === 'R') && rKey) {
    e.preventDefault()
    openInterrupt()
  } else if (e.key === '?') {
    e.preventDefault()
    if (overlay === 'keys') closeOverlay()
    else openKeys()
  }
}

function onHashChange() {
  const id = decodeURIComponent(location.hash.slice(1))
  if (isSectionId(id)) jumpTo(id)
}

export function useGlobalListeners() {
  useEffect(() => {
    const stopTracking = trackSections(() => uiStore.get().overlay !== 'interrupt')
    document.addEventListener('click', onClick)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('popstate', handlePopState)
    window.addEventListener('hashchange', onHashChange)
    return () => {
      stopTracking()
      document.removeEventListener('click', onClick)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('hashchange', onHashChange)
    }
  }, [])
}
