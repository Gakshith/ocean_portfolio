// STUB (lead, freeze commit). sections_agent owns and replaces this file; keep these exports.
import { identity } from '../content/content'
import { BubbleLock, CybotStill, Hop, TidePool } from '../sims'

export function Sections() {
  return (
    <>
      <section id="top" data-section="top" aria-labelledby="top-title">
        <h1 id="top-title" tabIndex={-1}>{identity.name}</h1>
      </section>
      <section id="about" data-section="about" aria-labelledby="about-title">
        <h2 id="about-title" tabIndex={-1}>Light through water. Light through a mask.</h2>
      </section>
      <section id="link-layer" data-section="link-layer" aria-labelledby="link-layer-title">
        <h2 id="link-layer-title" tabIndex={-1}>BLE Link Layer</h2>
        <Hop headingId="link-layer-title" />
      </section>
      <section id="risc-v" data-section="risc-v" aria-labelledby="risc-v-title">
        <h2 id="risc-v-title" tabIndex={-1}>RISC-V 5-stage pipelined processor</h2>
        <BubbleLock headingId="risc-v-title" />
      </section>
      <section id="wisard" data-section="wisard" aria-labelledby="wisard-title">
        <h2 id="wisard-title" tabIndex={-1}>WiSARD weightless neural network</h2>
        <TidePool headingId="wisard-title" />
      </section>
      <section id="cybot" data-section="cybot" aria-labelledby="cybot-title">
        <h2 id="cybot-title" tabIndex={-1}>CyBot autonomous robot (CPRE 2880)</h2>
        <CybotStill headingId="cybot-title" />
      </section>
      <section id="contact" data-section="contact" aria-labelledby="contact-title">
        <h2 id="contact-title" tabIndex={-1}>Every chip talks to the world through its pads. These are how you reach me.</h2>
      </section>
    </>
  )
}

export function Footer() {
  return <footer />
}
