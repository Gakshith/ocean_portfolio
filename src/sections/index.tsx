// The Still site, S1–S7, in the DOM (build order step 3). App mounts <Sections/> inside <main>
// and <Footer/> after it. Scribe lanes separate the sections.
import '../styles/fonts.css'
import '../styles/base.css'
import '../styles/sections.css'
import { projects } from '../content/content'
import { BubbleLock, Hop, TidePool } from '../sims'
import { Scribe } from './parts'
import { ProjectSection } from './ProjectSection'
import { S1Hero } from './S1Hero'
import { S2About } from './S2About'
import { S6Cybot } from './S6Cybot'
import { S7Contact } from './S7Contact'

export { Footer } from './Footer'

const [linklayer, riscv, wisard] = projects

export function Sections() {
  return (
    <>
      <S1Hero />
      <Scribe dieId="AG-S2 · ABOUT" />
      <S2About />
      <Scribe dieId="AG-S3 · LINK LAYER" />
      <ProjectSection project={linklayer} variant="s3" next={{ href: '#risc-v', label: 'Next block: RISC-V' }}>
        <Hop headingId="link-layer-title" />
      </ProjectSection>
      <Scribe dieId="AG-S4 · RISC-V" />
      <ProjectSection project={riscv} variant="s4" next={{ href: '#wisard', label: 'Next block: WiSARD' }}>
        <BubbleLock headingId="risc-v-title" />
      </ProjectSection>
      <Scribe dieId="AG-S5 · WISARD" />
      <ProjectSection project={wisard} variant="s5" next={{ href: '#cybot', label: 'Next: CyBot, off-die' }}>
        <TidePool headingId="wisard-title" />
      </ProjectSection>
      <Scribe dieId="AG-S6 · CYBOT · OFF-DIE" />
      <S6Cybot />
      <Scribe dieId="AG-S7 · PADS" />
      <S7Contact />
    </>
  )
}
