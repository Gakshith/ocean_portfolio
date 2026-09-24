// STUB (lead, freeze commit). chrome_agent owns and replaces this file; keep these exports.
import type { SectionId } from './sections'

export function jumpTo(_id: SectionId): void {}
export function onJump(_fn: (id: SectionId) => void): () => void {
  return () => {}
}
