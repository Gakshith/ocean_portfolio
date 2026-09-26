// SM-1 choreography: everything in the hero is a pure function of the S1 pin progress P
// (plan S1 "Motion", 03-motion SM-1 timing table). No three.js here, so it unit-tests cheaply.

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
/** Progress of x through [a, b], clamped. */
export const range = (x: number, a: number, b: number) => clamp01((x - a) / (b - a))
/** GSAP power3.inOut. */
export const ease3 = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
/** GSAP power2.inOut. */
export const ease2 = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2)
export const smooth = (x: number) => x * x * (3 - 2 * x)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export const TILT = (28 * Math.PI) / 180

/** The focus the scroll asks for: 0 → 1 over P 0.05 → 0.45, power3.inOut. */
export const focusTarget = (P: number) => ease3(range(P, 0.05, 0.45))

/** Camera part of the choreography: tilt follows the focus, the rise runs over P 0.55 → 1. */
export function s1Camera(P: number) {
  const f = focusTarget(P)
  return { tilt: TILT * (1 - f), rise: ease3(range(P, 0.55, 1)) }
}

export interface S1Light {
  /** Lagoon surface: lerp(swell, engineered slope). */
  eng: number
  /** Swell amplitude inside the reef, (1−f)^1.6. */
  lagoon: number
  /** Swell amplitude of the open sea, (1−f)^0.7 × stop(P). */
  sea: number
  /** 3% residual swell (masked off the traces in the shader), gone by P 0.9. */
  resid: number
  /** Time speed factor for the swell (0 once the sea has stopped). */
  speed: number
  ambient: number
  exposure: number
  bloom: number
  /** Metal-layer tint amount, 0 → 1 (the shader scales it to 35%). */
  metal: number
  /** True while any water moves: the caustic passes must run this frame. */
  moving: boolean
}

/** Light part: P drives the timing, fShown is the focus actually shown (it eases in if the
 *  surface lands mid-scroll). */
export function s1Light(P: number, fShown: number): S1Light {
  const f = fShown
  const stop = 1 - smooth(range(P, 0.9, 1))
  const lagoon = Math.pow(1 - f, 1.6)
  const sea = Math.pow(1 - f, 0.7) * stop
  const resid = 0.03 * f * (1 - range(P, 0.7, 0.9))
  const moving = lagoon > 1e-4 || sea > 1e-4 || resid > 1e-4
  return {
    eng: f,
    lagoon,
    sea,
    resid,
    speed: moving ? (0.35 + 0.65 * (1 - f)) * Math.max(stop, 1e-4) : 0,
    ambient: lerp(0.35, 0.02, f),
    exposure: lerp(1.6, 0.42, smooth(f)),
    bloom: f,
    metal: range(P, 0.72, 1),
    moving,
  }
}

/** Ease the shown focus toward its target: ~250ms (k = 10/s), never a snap. */
export const easeFocus = (shown: number, target: number, dtSec: number) =>
  shown + (target - shown) * Math.min(1, dtSec * 10)

/** Phone cut 4 (R-P2-10): true once the last 2s of focus frames averaged under 45 fps. Feed it
 *  frame intervals (ms) only while the water moves in S1; reset() when it stops. */
export class FpsCut {
  private win: number[] = []
  private sum = 0
  private readonly minFps: number
  private readonly windowMs: number
  constructor(minFps = 45, windowMs = 2000) {
    this.minFps = minFps
    this.windowMs = windowMs
  }
  push(dtMs: number): boolean {
    this.win.push(dtMs)
    this.sum += dtMs
    while (this.win.length > 1 && this.sum - this.win[0] >= this.windowMs) this.sum -= this.win.shift()!
    return this.sum >= this.windowMs * 0.95 && (this.win.length / this.sum) * 1000 < this.minFps
  }
  reset() {
    this.win = []
    this.sum = 0
  }
}
