// Injects the server-rendered app into dist/index.html so the Still site is real HTML
// with JS off. Runs after `vite build` and `vite build --ssr src/entry-server.tsx`.
import { readFile, rm, writeFile } from 'node:fs/promises'

const htmlPath = new URL('../dist/index.html', import.meta.url)
const ssrDir = new URL('../dist-ssr/', import.meta.url)

const { render } = await import(new URL('entry-server.js', ssrDir).href)
const html = await readFile(htmlPath, 'utf8')
if (!html.includes('<!--app-html-->')) throw new Error('prerender: <!--app-html--> marker missing')

await writeFile(htmlPath, html.replace('<!--app-html-->', render()))
await rm(ssrDir, { recursive: true, force: true })
console.log('prerender: dist/index.html written')
