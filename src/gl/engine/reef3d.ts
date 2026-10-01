// SM-2, the reef lights: the 60-pad ring as aluminium plates, the five contact pads' sea outline
// and glow, and their bond wires with the hover packet. Three draws over the frozen floor, all in
// the floor's frame (windowMask) and only once the top metal is in (U.metal). Every value comes
// from reefState() / packet() (src/gl/ringwave.ts), so the 3D and the DOM chips can't drift.
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, InstancedBufferAttribute, InstancedMesh, Matrix4, Mesh, MeshBasicNodeMaterial, NormalBlending, PlaneGeometry, Quaternion, Vector3 } from 'three/webgpu'
import { Fn, abs, attribute, float, fwidth, instancedBufferAttribute, max, min, mix, smoothstep, step, uniformArray, uv, vec3, exp } from 'three/tsl'
import type { Reef } from '../reef'
import { windowMask, type Uniforms } from './shaders'

// oxlint-disable-next-line typescript/no-explicit-any
type N = any

const SEA = new Color('#3D9DF2')
const AL = new Color('#C3C9CC')
const LIGHT = new Color('#E6F4FF')
/** Die unit (1/100 of the die) in world p: strokes are sized like the Still atoll's. */
const DU = 0.017969

const iba = (a: InstancedBufferAttribute): N => instancedBufferAttribute(a)
const rgb = (c: Color): N => vec3(c.r, c.g, c.b)

/** One overlay material: unlit, blended over the floor, never depth-tested (it's all on y = 0). */
function overlay(colorNode: N, opacityNode: N, additive = false) {
  const m = new MeshBasicNodeMaterial()
  m.transparent = true
  m.blending = additive ? AdditiveBlending : NormalBlending
  m.depthTest = false
  m.depthWrite = false
  m.colorNode = colorNode
  m.opacityNode = opacityNode
  return m
}

export function createReef3D(reef: Reef, U: Uniforms) {
  const vis: N = windowMask(U).mul(U.metal)
  const flat = new PlaneGeometry(1, 1).rotateX(-Math.PI / 2)
  const m4 = new Matrix4()
  const q0 = new Quaternion()
  const place = (mesh: InstancedMesh, i: number, x: number, y: number, s: number) => mesh.setMatrixAt(i, m4.compose(new Vector3(x, 0, -y), q0, new Vector3(s, 1, s)))

  // ---------- pads: aluminium plates, light per pad (0.32 → 1 → 0.55), contacts toward sea ----------
  const n = reef.pads.length
  const aLight = new InstancedBufferAttribute(new Float32Array(n), 1)
  const aSea = new InstancedBufferAttribute(new Float32Array(n), 1)
  // the crest of the wave: light above the 0.55 rest runs round the ring as a cool-white comet
  const crest: N = max(iba(aLight).sub(0.55), 0).div(0.45)
  const pads = new InstancedMesh(flat, overlay(mix(mix(rgb(AL), rgb(LIGHT), crest.mul(0.6)), rgb(SEA), iba(aSea)), iba(aLight).mul(vis)), n)
  reef.pads.forEach((p, i) => place(pads, i, p.x, p.y, p.size))
  const padSize = reef.pads[0].size
  const H = padSize * 5
  const halo: N = Fn(() => {
    const lp = uv().sub(0.5).mul(H)
    const b = max(max(abs(lp.x), abs(lp.y)).sub(padSize / 2), 0)
    return exp(b.negate().div(0.9 * DU)).mul(crest).mul(0.85)
  })()
  const halos = new InstancedMesh(flat, overlay(rgb(LIGHT), halo.mul(vis), true), n)
  reef.pads.forEach((p, i) => place(halos, i, p.x, p.y, H))

  // ---------- contacts: the sea outline (Still: stroke 0.5 du) and the lit glow (16 px ≈ 2.5 du) ----------
  const size = reef.contacts[0].pad.size
  const S = size * 4
  const aOut = new InstancedBufferAttribute(new Float32Array(5), 1)
  const aOn = new InstancedBufferAttribute(new Float32Array(5), 1)
  const ring: N = Fn(() => {
    const lp = uv().sub(0.5).mul(S)
    const b = max(abs(lp.x), abs(lp.y)).sub(size / 2)
    const fw = fwidth(b)
    const stroke = float(1).sub(smoothstep(float(0.25 * DU).sub(fw), float(0.25 * DU).add(fw), abs(b)))
    const glow = exp(max(b, 0).negate().div(1.1 * DU)).mul(step(float(0), b)).mul(0.35)
    return max(stroke.mul(iba(aOut)), glow.mul(iba(aOn)))
  })()
  const contacts = new InstancedMesh(flat, overlay(rgb(SEA), ring.mul(vis)), 5)
  reef.contacts.forEach((c, k) => place(contacts, k, c.pad.x, c.pad.y, S))

  // ---------- bond wires: one mesh, arc length per vertex; draw-out and packet per wire ----------
  const w = 0.35 * DU
  const pos: number[] = []
  const as: number[] = []
  const ak: number[] = []
  const idx: number[] = []
  reef.contacts.forEach((c, k) => {
    let s0 = 0
    const pts = c.wire.pts
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1]
      const b = pts[i]
      const len = Math.hypot(b.x - a.x, b.y - a.y)
      const dx = (b.x - a.x) / len
      const dy = (b.y - a.y) / len
      // extend each segment by half a width at both ends so the corners close
      const ax = a.x - (dx * w) / 2
      const ay = a.y - (dy * w) / 2
      const bx = b.x + (dx * w) / 2
      const by = b.y + (dy * w) / 2
      const nx = (-dy * w) / 2
      const ny = (dx * w) / 2
      const v = pos.length / 3
      for (const [x, y, s] of [
        [ax + nx, ay + ny, s0],
        [ax - nx, ay - ny, s0],
        [bx + nx, by + ny, s0 + len],
        [bx - nx, by - ny, s0 + len],
      ]) {
        pos.push(x, 0, -y)
        as.push(s / c.wire.len)
        ak.push(k)
      }
      idx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2)
      s0 += len
    }
  })
  const wg = new BufferGeometry()
  wg.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3))
  wg.setAttribute('aS', new BufferAttribute(new Float32Array(as), 1))
  wg.setAttribute('aK', new BufferAttribute(new Float32Array(ak), 1))
  wg.setIndex(idx)
  const drawn: N = uniformArray([0, 0, 0, 0, 0], 'float')
  const on: N = uniformArray([0, 0, 0, 0, 0], 'float')
  const head: N = uniformArray([0, 0, 0, 0, 0], 'float')
  const pkt: N = uniformArray([0, 0, 0, 0, 0], 'float')
  const wireColor: N = Fn(() => {
    const k = attribute('aK', 'float').toInt()
    const s = attribute('aS', 'float')
    const base = mix(rgb(AL), rgb(SEA), on.element(k))
    // the packet: a short bright head running pad → lead, light at its core
    const h = head.element(k)
    const p = smoothstep(h.sub(0.16), h, s).mul(step(s, h)).mul(pkt.element(k))
    return mix(base, rgb(LIGHT), p.mul(0.85))
  })()
  const wireAlpha: N = Fn(() => {
    const k = attribute('aK', 'float').toInt()
    const s = attribute('aS', 'float')
    const h = head.element(k)
    const p = smoothstep(h.sub(0.16), h, s).mul(step(s, h)).mul(pkt.element(k))
    const base = float(0.6).add(on.element(k).mul(0.4)).mul(step(s, drawn.element(k)))
    return min(max(base, p), 1).mul(vis)
  })()
  const wires = new Mesh(wg, overlay(wireColor, wireAlpha))

  for (const o of [halos, pads, contacts, wires]) {
    o.frustumCulled = false
    o.renderOrder = 2
  }
  const objects = [halos, pads, contacts, wires] as const

  return {
    objects,
    /** Write one frame of state: pad light (ring order), per-contact outline / wire / twin / packet. */
    update(padLight: Float32Array, outline: number[], wire: number[], twin: Float32Array, packets: ({ head: number; opacity: number } | null)[]) {
      for (let i = 0; i < n; i++) {
        const c = reef.pads[i].contact
        aLight.array[i] = c ? Math.max(padLight[i], twin[c - 1]) : padLight[i]
        aSea.array[i] = c ? twin[c - 1] : 0
      }
      aLight.needsUpdate = aSea.needsUpdate = true
      for (let k = 0; k < 5; k++) {
        aOut.array[k] = outline[k]
        aOn.array[k] = twin[k]
        drawn.array[k] = wire[k] >= 1 ? 1.01 : wire[k]
        on.array[k] = twin[k]
        // a hover packet, else the draw-out front carries the light down to the lead
        const drawing = wire[k] > 0 && wire[k] < 1
        head.array[k] = packets[k]?.head ?? (drawing ? wire[k] : 0)
        pkt.array[k] = packets[k]?.opacity ?? (drawing ? 1 : 0)
      }
      aOut.needsUpdate = aOn.needsUpdate = true
    },
    dispose() {
      flat.dispose()
      wg.dispose()
      for (const o of objects) (o.material as MeshBasicNodeMaterial).dispose()
    },
  }
}

export type Reef3D = ReturnType<typeof createReef3D>
