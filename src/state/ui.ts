// Overlays: the Surface Interrupt, the Keys popover and the phone section sheet.
// Everything with a side effect outside React (history, inert, scroll, the pause bus)
// happens here, synchronously, so the pause lands in the same frame as the click.
import { useSyncExternalStore } from 'react'
import { jumpTo } from './jump'
import { motionStore } from './motion'
import { getNav } from './nav'
import { restoreContext, saveContext, setPauseReason } from './pause'
import type { SectionId } from './sections'

export type Overlay = 'interrupt' | 'keys' | 'sheet'

export interface UiState {
  overlay: Overlay | null
  /** 'closing' keeps the Interrupt panel mounted for its 200ms exit. */
  phase: 'open' | 'closing'
  /** R opens the Interrupt. Switchable in the Keys popover (WCAG 2.1.4). */
  rKey: boolean
  /** Section the Interrupt was opened from, for the flavour line. */
  savedAt: SectionId | null
}

const R_KEY = 'ocean:rkey'
const CLOSE_MS = 200
const ssr: UiState = { overlay: null, phase: 'open', rKey: true, savedAt: null }
let state: UiState = ssr
let hydrated = false
const listeners = new Set<() => void>()

function set(patch: Partial<UiState>) {
  state = { ...state, ...patch }
  for (const fn of listeners) fn()
}

function hydrate() {
  if (hydrated || typeof window === 'undefined') return
  hydrated = true
  // The Interrupt closes via history.back(). With 'auto' restoration the browser lands on the
  // entry's #hash anchor after our scrollTo(savedY), so we own scroll restoration instead.
  try {
    history.scrollRestoration = 'manual'
  } catch {
    // not supported: the close still restores savedY
  }
  try {
    if (window.localStorage.getItem(R_KEY) === '0') state = { ...state, rKey: false }
  } catch {
    // storage blocked: keep the default
  }
}

let opener: HTMLElement | null = null
let savedY = 0
let pushed = false
let pendingJump: SectionId | null = null
let inerted: Element[] = []
let closeTimer: ReturnType<typeof setTimeout> | undefined

/** The portal target for overlays. Everything else in <body> goes inert under the Interrupt. */
export function overlayLayer(): HTMLElement {
  let layer = document.getElementById('chrome-layer')
  if (!layer) {
    layer = document.createElement('div')
    layer.id = 'chrome-layer'
    document.body.append(layer)
  }
  return layer
}

function setInert(on: boolean) {
  if (on) {
    const layer = overlayLayer()
    inerted = [...document.body.children].filter(
      (el) => el !== layer && el.tagName !== 'SCRIPT' && !el.hasAttribute('inert'),
    )
    for (const el of inerted) el.setAttribute('inert', '')
  } else {
    for (const el of inerted) el.removeAttribute('inert')
    inerted = []
  }
}

const active = () => (document.activeElement instanceof HTMLElement ? document.activeElement : null)

function focusSafely(el: HTMLElement | null) {
  if (el && el.isConnected) el.focus({ preventScroll: true })
}

export function openInterrupt(from?: HTMLElement | null): void {
  if (typeof window === 'undefined') return
  if (state.overlay === 'interrupt' && state.phase === 'open') return
  clearTimeout(closeTimer)
  // Replacing Keys or the sheet: focus is inside the overlay that is about to unmount,
  // so keep that overlay's opener as the place to return to.
  const replacing = state.overlay !== null && state.overlay !== 'interrupt'
  if (replacing) set({ overlay: null })
  opener = from ?? (replacing ? opener : active())
  savedY = window.scrollY
  setPauseReason('interrupt', true)
  saveContext()
  try {
    history.pushState({ oceanInterrupt: true }, '')
    pushed = true
  } catch {
    pushed = false
  }
  setInert(true)
  document.documentElement.style.overflow = 'hidden'
  document.documentElement.dataset.interrupt = ''
  set({ overlay: 'interrupt', phase: 'open', savedAt: getNav().current })
}

/** Close the Interrupt. With `then`, jump there instead of returning to the saved spot. */
export function closeInterrupt(then?: SectionId): void {
  if (state.overlay !== 'interrupt' || state.phase !== 'open') return
  pendingJump = then ?? null
  // Pop our own history entry; popstate finishes the close, so ✕, Esc and Back share one path.
  if (pushed && history.state?.oceanInterrupt) history.back()
  else finishInterrupt()
}

function finishInterrupt() {
  if (state.overlay !== 'interrupt' || state.phase !== 'open') return
  pushed = false
  setInert(false)
  document.documentElement.style.overflow = ''
  delete document.documentElement.dataset.interrupt
  const target = pendingJump
  pendingJump = null
  const calm = motionStore.get().calm
  set({ phase: 'closing' })
  if (target) {
    jumpTo(target)
  } else {
    window.scrollTo({ top: savedY, behavior: 'instant' })
    restoreContext()
    focusSafely(opener)
  }
  opener = null
  setPauseReason('interrupt', false)
  closeTimer = setTimeout(() => set({ overlay: null, phase: 'open' }), calm ? 0 : CLOSE_MS)
}

export function openKeys(from?: HTMLElement | null): void {
  if (typeof window === 'undefined' || state.overlay === 'interrupt') return
  opener = from ?? (state.overlay === 'sheet' ? opener : active())
  set({ overlay: 'keys' })
}

export function openSheet(from?: HTMLElement | null): void {
  if (typeof window === 'undefined' || state.overlay === 'interrupt') return
  opener = from ?? null
  set({ overlay: 'sheet' })
}

/**
 * Close whatever is open. Focus returns to the opener unless `returnFocus` is false
 * (a link inside the overlay is about to move focus itself).
 */
export function closeOverlay(returnFocus = true): void {
  if (!state.overlay) return
  if (state.overlay === 'interrupt') return closeInterrupt()
  set({ overlay: null })
  if (returnFocus) focusSafely(opener)
  opener = null
}

export function setRKey(on: boolean): void {
  try {
    window.localStorage.setItem(R_KEY, on ? '1' : '0')
  } catch {
    // storage blocked: applies for this visit only
  }
  set({ rKey: on })
}

/** Browser Back while the Interrupt is open closes it. */
export function handlePopState(): void {
  if (state.overlay === 'interrupt' && state.phase === 'open') finishInterrupt()
}

export const uiStore = {
  get: (): UiState => {
    hydrate()
    return state
  },
  subscribe: (fn: () => void): (() => void) => {
    hydrate()
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  },
}

const getServer = () => ssr

export function useUi(): UiState {
  return useSyncExternalStore(uiStore.subscribe, uiStore.get, getServer)
}
