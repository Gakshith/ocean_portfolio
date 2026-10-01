// The S1 pin (R-P2-12): React-owned CSS sticky. While load3D, the track around S1 is 100svh plus
// the pin length (120lvh ≥ 768 / 100lvh < 768: large-viewport units, so a phone's URL bar
// collapsing never changes it) and S1 sticks at the top through it.
//
// Mounting or unmounting the pin changes the page height above everything below S1, so the scroll
// position is compensated in the same frame (a layout effect, before paint): nothing visibly jumps.

/**
 * The scroll position that keeps the same content in view.
 * @param y       scroll position before the change
 * @param pinLen  the pin's length in px (the one being added or removed)
 * @param s1Bottom where S1 ends without the pin (document px)
 * @param mounting true = the pin is being added
 */
export function pinCompensation(y: number, pinLen: number, s1Bottom: number, mounting: boolean): number {
  if (pinLen <= 0 || y <= 0) return Math.max(0, y)
  if (mounting) return y < s1Bottom ? y : y + pinLen // still reading S1: it simply becomes the pin
  return y <= pinLen ? 0 : y - pinLen // inside the pin: S1 is what was on screen, so show S1
}

/** Every ancestor of .s1 must leave overflow visible (or clip, which is not a scroll container),
 *  or position: sticky dies silently. Returns the offenders. */
export function stickyBlockers(el: Element): Element[] {
  const bad: Element[] = []
  for (let a = el.parentElement; a; a = a.parentElement) {
    const cs = getComputedStyle(a)
    for (const o of [cs.overflowX, cs.overflowY]) if (o && o !== 'visible' && o !== 'clip') bad.push(a)
  }
  return [...new Set(bad)]
}
