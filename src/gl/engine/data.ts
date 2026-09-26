// Seam 1 inputs: bake.json (bundled with this chunk, content-hashed by Vite) and the binaries in
// public/bake/, fetched with ?v=<sha8>. Until bake_agent's PR lands, dev builds read a scratch mock
// from public/__glmock/ (never committed, never shipped); production then has no meta and the
// engine reports a failure, so the Still path stays.
import { DataTexture, HalfFloatType, NearestFilter, NoColorSpace, RGFormat, RedFormat, UnsignedByteType, ClampToEdgeWrapping } from 'three/webgpu'
import type { BakeMeta } from '../../bake/meta'

const base = import.meta.env.BASE_URL

// A glob so the build doesn't fail while bake.json doesn't exist yet.
const bundled = import.meta.glob<{ default: BakeMeta }>('../../bake/bake.json')

export async function loadMeta(): Promise<{ meta: BakeMeta; dir: string }> {
  const load = bundled['../../bake/bake.json']
  if (load) return { meta: (await load()).default, dir: `${base}bake/` }
  if (import.meta.env.DEV) {
    const r = await fetch(`${base}__glmock/bake.json`)
    if (r.ok) return { meta: (await r.json()) as BakeMeta, dir: `${base}__glmock/` }
  }
  throw new Error('no bake.json')
}

async function fetchBin(url: string, bytes: number): Promise<ArrayBuffer> {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${url}: ${r.status}`)
  const b = await r.arrayBuffer()
  if (b.byteLength !== bytes) throw new Error(`${url}: ${b.byteLength} bytes, expected ${bytes}`)
  return b
}

const v = (sha: string) => `?v=${sha.slice(0, 8)}`

/** RG16F slope field, GL order (row 0 = south), nearest, no colour space, no mips. */
export async function loadSlope(meta: BakeMeta, dir: string, n: 512 | 256) {
  const sha = n === 512 ? meta.sha256.slope512 : meta.sha256.slope256
  const buf = await fetchBin(`${dir}slope-${n}.f16${v(sha)}`, n * n * 2 * 2)
  const t = new DataTexture(new Uint16Array(buf), n, n, RGFormat, HalfFloatType)
  return prep(t)
}

/** The residual-calm mask: 512² R8, 255 · wide traces. */
export async function loadTraces(meta: BakeMeta, dir: string) {
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

/** Test path only (contrastTest): 512² masks in canvas order, bit 0 letters · 1 fill · 2 core.
 *  Dev reads the scratch mock's masks; once bake_agent's shared target.ts lands the test builds
 *  them from it, so the masks match the bake exactly. */
export async function loadMasks(dir: string): Promise<Uint8Array> {
  const r = await fetch(`${dir}masks-512.u8`)
  if (!r.ok) throw new Error('no masks for contrastTest')
  return new Uint8Array(await r.arrayBuffer())
}
