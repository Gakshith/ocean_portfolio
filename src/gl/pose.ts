// The renderer's camera constants and the P = 0 opening frame at the 1440×900 reference, as plain
// numbers: no three.js, no window, so the Node bake can import them (the poster is rendered from
// this pose, so the 400ms canvas fade over it doesn't jump). gl.test.ts asserts the fitted
// framing at 1440×900 reproduces OPENING_POSE, so a framing change fails there, not in the poster.

/** Vertical field of view, degrees. */
export const FOV_DEG = 35
export const NEAR = 0.05
export const FAR = 80
/** three's camera.up: screen-up is north (world p.y = −z). */
export const UP = [0, 0, -1] as const
/** Camera pitch away from straight down at P = 0, degrees (the camera sits south of its target). */
export const OPENING_TILT_DEG = 28

/** The fitted P = 0 pose at 1440×900 (desktop plate, "right of plate" free region). */
export const OPENING_POSE = (() => {
  const vw = 1440
  const vh = 900
  const dist = 3.2254756781167093 // the letters re-fit at 6% after the seal clears the plate
  const cx = 1055.615739875926 // 29.3 px right of the region centre: the seal ring clears the plate by 32 px
  const cy = 478
  const t = (OPENING_TILT_DEG * Math.PI) / 180
  return {
    viewport: { w: vw, h: vh },
    /** Look target, three world coordinates. */
    target: [0, 0, 0] as const,
    dist,
    /** three world coordinates: (tx, dist·cos tilt, −ty + dist·sin tilt). */
    position: [0, dist * Math.cos(t), dist * Math.sin(t)] as const,
    /** Where the target lands on screen, px. */
    screen: { x: cx, y: cy },
    /** camera.setViewOffset(fullW, fullH, x, y, w, h). */
    viewOffset: [vw, vh, -(cx - vw / 2), -(cy - vh / 2), vw, vh] as const,
  }
})()
