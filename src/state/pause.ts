// STUB (lead, freeze commit). chrome_agent owns and replaces this file; keep these exports.
export type PauseReason = 'interrupt' | 'hidden'

export const pauseBus = {
  isPaused: (): boolean => false,
  subscribe: (_fn: (paused: boolean, reasons: Set<PauseReason>) => void): (() => void) => () => {},
}

export function usePaused(): boolean {
  return false
}

/** Phase 2 camera slot; a no-op in phase 1. */
export function registerContextSaver(_saver: { save: () => void; restore: () => void }): () => void {
  return () => {}
}
