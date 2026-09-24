import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { useMotion } from '../../state/motion'
import { usePaused } from '../../state/pause'

/** True while at least `threshold` of the element is on screen. False on the server. */
export function useInView(ref: RefObject<Element | null>, threshold = 0.3): boolean {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setInView(e.intersectionRatio >= threshold), {
      threshold: [0, threshold],
    })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, threshold])
  return inView
}

/**
 * The shared gate for anything that moves on its own:
 * autoplay = !calm && !paused && inView && !userPaused (contract §2, §3).
 */
export function useSimGate(ref: RefObject<Element | null>, userPaused = false) {
  const { calm } = useMotion()
  const paused = usePaused()
  const inView = useInView(ref)
  return { calm, paused, inView, running: !calm && !paused && inView && !userPaused }
}

/** setInterval that only runs while `active`; the latest callback is always used. */
export function useInterval(fn: () => void, ms: number, active: boolean) {
  const saved = useRef(fn)
  useEffect(() => {
    saved.current = fn
  })
  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => saved.current(), ms)
    return () => window.clearInterval(id)
  }, [ms, active])
}

/**
 * A polite live region's text. Setting the same sentence twice still re-announces it
 * (the region is cleared for one frame first).
 */
export function useAnnouncer() {
  const [text, setText] = useState('')
  const frame = useRef(0)
  const announce = useCallback((t: string) => {
    setText('')
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => setText(t))
  }, [])
  useEffect(() => () => cancelAnimationFrame(frame.current), [])
  return [text, announce] as const
}

/** Roving tabindex over a flat list laid out as a CSS grid; up/down use the rendered column count. */
export function gridKeyTarget(e: React.KeyboardEvent, index: number, count: number, cols: number): number | null {
  switch (e.key) {
    case 'ArrowRight':
      return Math.min(count - 1, index + 1)
    case 'ArrowLeft':
      return Math.max(0, index - 1)
    case 'ArrowDown':
      return index + cols < count ? index + cols : index
    case 'ArrowUp':
      return index - cols >= 0 ? index - cols : index
    case 'Home':
      return 0
    case 'End':
      return count - 1
    default:
      return null
  }
}

/** Number of columns a CSS grid container currently renders. */
export function renderedColumns(el: HTMLElement | null, fallback: number): number {
  if (!el) return fallback
  const cols = getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length
  return cols || fallback
}
