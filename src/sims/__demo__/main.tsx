// Dev-only harness for the sims (not exported, not in the build). Mirrors how sections mount them.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../../styles/tokens.css'
import '@fontsource-variable/newsreader/opsz.css'
import '@fontsource-variable/newsreader/opsz-italic.css'
import '@fontsource-variable/martian-mono/standard.css'
import { BubbleLock, CybotStill, Hop, TidePool } from '..'
import './demo.css'

const params = new URLSearchParams(location.search)
const only = params.get('sim')
if (params.has('calm')) document.documentElement.dataset.calm = 'true'

const SIMS = [
  { id: 'link-layer', h2: 'BLE Link Layer', C: Hop },
  { id: 'risc-v', h2: 'RISC-V 5-stage pipelined processor', C: BubbleLock },
  { id: 'wisard', h2: 'WiSARD weightless neural network', C: TidePool },
  { id: 'cybot', h2: 'CyBot autonomous robot (CPRE 2880)', C: CybotStill },
]

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main className="demo">
      {SIMS.filter((s) => !only || s.id === only).map(({ id, h2, C }) => (
        <section key={id} id={id} aria-labelledby={`${id}-title`}>
          <h2 id={`${id}-title`}>{h2}</h2>
          <C headingId={`${id}-title`} />
        </section>
      ))}
    </main>
  </StrictMode>,
)
