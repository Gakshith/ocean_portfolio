// Test helper: a controllable prefers-reduced-motion media query for jsdom.
export function mockReducedMotion(initial: boolean) {
  let matches = initial
  const listeners = new Set<(e: { matches: boolean }) => void>()
  window.matchMedia = ((query: string) => ({
    get matches() {
      return matches
    },
    media: query,
    addEventListener: (_: string, fn: (e: { matches: boolean }) => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: (e: { matches: boolean }) => void) => listeners.delete(fn),
  })) as unknown as typeof window.matchMedia
  return {
    set(next: boolean) {
      matches = next
      for (const fn of listeners) fn({ matches })
    },
  }
}
