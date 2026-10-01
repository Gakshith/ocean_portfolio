// Seam 1 inputs: bake.json (bundled with this chunk, so Vite content-hashes it) and the binaries
// in public/bake/, fetched with ?v=<sha8>.
import { DataTexture, HalfFloatType, NearestFilter, NoColorSpace, RGFormat, RedFormat, UnsignedByteType, ClampToEdgeWrapping } from 'three/webgpu'
import bake from '../../bake/bake.json'
import type { BakeMeta } from '../../bake/meta'

const base = import.meta.env.BASE_URL
export const meta = bake as unknown as BakeMeta
const dir = `${base}bake/`

async function fetchBin(url: string, bytes: number): Promise<ArrayBuffer> {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${url}: ${r.status}`)
  const b = await r.arrayBuffer()
  if (b.byteLength !== bytes) throw new Error(`${url}: ${b.byteLength} bytes, expected ${bytes}`)
  return b
}

const v = (sha: string) => `?v=${sha.slice(0, 8)}`

/** RG16F slope field, GL order (row 0 = south), nearest, no colour space, no mips. */
export async function loadSlope(n: 512 | 256) {
  const sha = n === 512 ? meta.sha256.slope512 : meta.sha256.slope256
  const buf = await fetchBin(`${dir}slope-${n}.f16${v(sha)}`, n * n * 2 * 2)
  const t = new DataTexture(new Uint16Array(buf), n, n, RGFormat, HalfFloatType)
  return prep(t)
}

/** The residual-calm mask: 512² R8, 255 · wide traces. */
export async function loadTraces() {
  const buf = await fetchBin(`${dir}traces-512.u8${v(meta.sha256.traces)}`, 512 * 512)
  const t = new DataTexture(new Uint8Array(buf), 512, 512, RedFormat, UnsignedByteType)
  return prep(t)
}

function prep(t: DataTexture) {
  t.colorSpace = NoColorSpace
  t.minFilter = t.magFilter = NearestFilter
  t.wrapS = t.wrapT = ClampToEdgeWrapping
  t.generateMipmaps = false
  t.flipY = false
  t.premultiplyAlpha = false
  t.unpackAlignment = 1
  t.needsUpdate = true
  return t
}

/** Test path only (contrastTest): 512² masks in canvas order, bit 0 letters · 1 fill · 2 core,
 *  built by bake_agent's own target builder, so they are exactly the bake's masks. */
export async function loadMasks(): Promise<Uint8Array> {
  const [{ makeTarget }, glyphs, fp] = await Promise.all([import('../../bake/target'), import('../../content/glyphs.json'), import('../../svg/floorplan')])
  const t = makeTarget(glyphs.default, fp, 512)
  const m = new Uint8Array(512 * 512)
  for (let i = 0; i < m.length; i++) m[i] = (t.letters[i] ? 1 : 0) | (t.fill[i] ? 2 : 0) | (t.core[i] ? 4 : 0)
  return m
}
