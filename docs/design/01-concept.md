# 01 — Concepts

Owner: creative-director. Status: **FROZEN 2026-09-23. The client chose Concept B, Caustic Lithography.** Section IDs below are frozen; only the creative-director changes them, and every teammate is told when that happens.
Idea bank: [`01b-innovation.md`](01b-innovation.md) (cited as `#n`). Unchosen concepts A and C: [`01-concept-archive.md`](01-concept-archive.md).

**Site-wide rules**
- **Surface Interrupt (#5), the fast path.** A pinned, plainly labelled `Resume · Contact` control is visible from the first frame at every
  scroll position. Pressing it (or `R`) *pre-empts* the scene like an interrupt: the scene freezes and dims, a one-screen summary
  slides up (name, school, the four projects in one line each, resume PDF, email, LinkedIn, GitHub), and `Esc` returns to
  the exact scroll position and camera. The label stays plain English; the ISR behaviour is the idea.
- Name, role and the resume link are HTML at first paint. No preloader percentage and no "scroll to begin" screen.
- All copy is DOM text. Every project claim matches `content.md`. RISC-V: his partner led the RTL, and Akash did the design review, hazard
  debugging and documentation. Senior design is always marked **in progress**. Every live simulation is labelled "running in your browser".
- `[SLOT: …]` marks personal ocean details and photos. Every concept looks finished with the slots empty.
- **Copy spine (#6):** use words that are true in both worlds: *bubble, flush, drain, stall, channel, current,
  well, island, buffer, drift, noise, wave(form)*. Candidate site title: **"Sea of Gates"**, a real ASIC term (gate-array
  architecture). It is flagged for the client because it names a design style, not his work.


---

## Chosen concept: Caustic Lithography
*(reframes the client's "descend + bioluminescence" direction from going down to bringing into focus)*


**The idea in one sentence.** Sunlight through moving water prints caustic light on the sand, and lithography prints a chip
with light through a mask. Here the water's surface is *engineered*, so as the sea stills, the same refraction physically focuses the light
into Akash's chip, and the chip is an atoll whose reef of I/O pads is how you reach him.

**Central metaphor.** **Caustics are lithography, and the die is an atoll.**
- *Light:* a chip designer's deliverable *is* the mask data (GDSII → photomask), so he designs the patterns that light prints.
  The hero uses **engineered caustics (#1)**, a refracting surface solved offline (Yue et al. 2014; Ferraro's "Magic Windows")
  so that real refraction, not a crossfade, forms the layout. An engineer who asks "how?" gets a good answer.
- *Place:* the focused layout is a die seen from above, shaped as an **atoll (#8)**. The core is the lagoon holding the project blocks,
  the pad ring is the reef, and **the I/O pads are the contact links**, since a pad ring really is where a chip talks to the world.
- *Look:* real layout language (Manhattan routing, true metal-layer colours, fill), not PCB clip-art (ref: Tiny Tapeout GDS viewer).

**Emotional arc.** *Start:* shimmer, a restless and beautiful light on sand that means nothing yet. *Turn:* the water stills,
the light focuses, and the chaos was a design waiting for discipline. *End:* a lit reef of pads, one of which is you
reaching him. The feeling is quiet pride and an open door.

**Signature moment 1: the focus (hero).** Caustics dance on wet sand. The name, role and `Resume · Contact` are already there
as DOM text. On the first scroll the sea's surface relaxes toward the engineered heightfield, and the light **focuses** into routed
layout that spells **AKASH GOJURU** as top-metal silicon art, then pulls back to reveal that the lettering sits on a whole die. Scrolling up
melts it back into shimmer. It is one continuous shot with no cut, and it is a reward, never a gate.
While the scene loads, the loader is a real decoded **ADV_IND** advertising packet (#4) whose AdvData carries `Akash Gojuru`. The
hero line must fit the packet's 31-byte AdvData limit, which is a copy constraint.

**Signature moment 2: the reef lights (contact).** The camera rises to the whole atoll. Each I/O pad on the reef is labelled
plainly (Resume, Email, LinkedIn, GitHub, Reflection). Hovering a pad lights its bond wire out to the open sea. The line reads:
*"Every chip talks to the world through its pads. These are how you reach me."* (C-17: "mine" never refers to the silicon) The resume also stays in the pinned bar, because the die is
never the only route.

**Projects mapped: each block on the die has its own verb, not the same trick four times.**
| Block | Project | The verb (pokeable, and optional; the text reads without it) |
|---|---|---|
| Radio block | BLE Link Layer (senior design, **in progress**) | **Hop (#3).** 40 lanes drawn as a spectrogram: 3 advertising and 37 data. A pulse hops lanes by the real CSA#1 rule, `(last + hop) mod 37`, with a remap for unused channels. Whale song drifts across some lanes as interference; the visitor marks a lane bad and watches the map remap live. |
| CPU block | RISC-V 5-stage | **Bubble Lock (#2).** IF–WB as five chambers of a water lock. Forwarding toggle; a load-use bubble that survives; a branch that flushes. A DOM pipeline table sits next to it. Caption: "My partner led the RTL. I reviewed the design, debugged hazards like these, and wrote the docs." |
| Memory block | WiSARD | **Tide Pool (#13).** Draw a shape in wet sand; the tide binarises it; bit-tuples light up as RAM addresses; a class wins. Teach a new class from one example. No accuracy numbers are claimed. |
| Off-die, the open sea past the reef | CyBot | **Ping (#12).** CyBot is a board-level system, not a chip block, so it lives honestly *outside* the reef, linked to a pad by a UART line. Its obstacle course appears only as returning echoes (d = v·t/2). The motion is scroll-driven, not a fourth toy. |
Budget rule (#feasibility): one hero effect, three pokeable simulations and one fast path. CyBot stays a staged sequence.
`[SLOT: ocean-story]` lives in S2-about as the "why the ocean" line, written by Akash, not us.

**Why it is not generic.** Caustics are the most overused underwater effect, and here the cliché becomes the *instrument*, with the
optics actually true. The atoll makes contact semantically exact. Every project is a real mechanism you can operate,
not a description of one. There is no dive, no city and no depth meter.

**Risk.** (1) Engineered caustics mean an offline solve and a caustic pass per frame. The phone gets a half-res buffer; no-WebGL and
reduced-motion get the final focused frame as an image. This is the one medium-cost effect and gets the whole GPU budget. (2) The metaphor
is subtle and needs one strong line of copy ("Light through water. Light through a mask."). (3) Shallow bright water is less
mysterious than the deep, so the drama must come from light and focus. (4) Three live simulations are real engineering work, each
with a DOM twin, so the build cost is mostly in logic, not art.

### Frozen beat sheet
```
S1-hero | wonder | "the light on the sand is drawing something" | user job: orient | signature: yes
S2-about | recognition | light through water, light through a mask: who, school, skills, the die map | user job: recognise | signature: no
S3-linklayer | curiosity | radio block: hop around the whale song | user job: understand | signature: no
S4-riscv | focus | CPU block: bubbles, forwarding, flush | user job: understand | signature: no
S5-wisard | play | memory block: teach the tide pool | user job: understand | signature: no
S6-cybot | ease | past the reef: finding the way by echo | user job: understand | signature: no
S7-contact | resolve | the reef's pads light: this chip talks to the world through them | user job: act | signature: yes
```
Beat notes:
- **S1-hero** includes the ADV_IND loader: it runs only while assets load, with the name, role and `Resume · Contact` already in the DOM beside it. It is part of S1, not a separate beat.
- **S2-about** carries the one copy line that makes the metaphor land. Display: *"Light through water. Light through a mask."* Sub-line, plain voice: "Sunlight through waves draws patterns on the sand. Lithography draws a chip the same way, with light through a mask. The pattern is the designer's work, and it's the work I'm training for." Then the about text from content.md, then `[SLOT: ocean-story]` and `[SLOT: photo-akash]`. It is also the die overview, where the lagoon blocks act as a map that jumps to S3–S6.
- **Frozen copy (after C-17, C-18); the same words in every file and proof:**
  - *Role line* (S1 plate + Surface Interrupt): "Computer Engineering, Iowa State. Heading into ASIC design; seeking hardware and chip-design internships."
  - *Availability* (S1 plate + Surface Interrupt): `[SLOT: grad-term]`, e.g. "Graduating <term>". It must be asked of Akash and never inferred from the senior-design dates. With the slot empty, the line is omitted, never guessed.
  - *Die caption* (S2, beside the die, body size, never hover-only): "An illustrative die. The blocks are projects I worked on; it is not a fabricated chip."
  - *S7 line:* "Every chip talks to the world through its pads. These are how you reach me."
  - *"How the light works" footer*, with a 4th sentence appended: "The die itself is illustrative, not a chip that was fabricated."
- **S3–S5** are the three pokeable simulations. Each reads completely as text if never touched, and each has a DOM twin (channel list, pipeline cycle table, grid).
- **S6-cybot** is a staged scroll sequence, not a fourth toy. It sits off-die and is linked by a UART line.
- The Surface Interrupt (the pinned `Resume · Contact` control plus summary) is global UI, not a section.

### Guardrails for the team
1. **The idea survives every decision.** The sea is engineered so its caustic light focuses into Akash's chip, and the chip is an atoll whose I/O pads are how you reach him. If a proposal can't be described in that sentence, cut it.
2. **Two signature moments only:** the focus (S1) and the reef pads lighting (S7). Nothing else competes with them for spectacle.
3. **Budget:** one medium-cost GPU effect (caustics) on screen at a time, three pokeable simulations (S3–S5), and one fast path. There is no fog, god-ray, bubble or particle kit, and every other effect is cheap or cut.
4. **Refraction is real.** The hero layout is formed by an engineered heightfield (Yue 2014 / Ferraro) through the caustic pass, never by a crossfade or morph. No-WebGL and reduced motion get the final focused frame as a still.
5. **Mechanisms are real and labelled "running in your browser":** CSA#1 is `(last + hop) mod 37` with a remap over 37 data and 3 advertising channels; ADV_IND is a true legacy PDU whose AdvData name fits 31 bytes; Bubble Lock shows that a load-use bubble survives forwarding and that a branch flushes; the WiSARD sim claims no accuracy numbers.
6. **The pinned `Resume · Contact` control** is plainly labelled and visible at every scroll position from first paint (`R` is a bonus). It pre-empts the scene, shows the one-screen summary, and `Esc` returns to the same spot. The resume is never reachable only through the die.
7. **Honest content.** Everything comes from content.md: his partner led the RISC-V RTL (Akash did the review, hazard debugging and docs), and the senior design is always marked "in progress". Personal ocean details and photos are `[SLOT: …]`, and the site looks finished with them empty. Never invent facts.
8. **Real layout language** (Manhattan routing, metal-layer colours, fill), not PCB-green or Tron lines. No city or skyline motif. All copy is DOM text.

---

## Recommendation (accepted by the client)
**B, Caustic Lithography.** It has the only fusion that is physically true *and* specific to chip design (light shaped into a pattern
by a medium, and the designer's deliverable is that pattern). Its hero is the one image a juror would retell. The atoll makes
contact semantically exact rather than bolted on. It has already absorbed the best of C (the ADV_IND loader and live CSA#1 Hop) and
the best of A (the pokeable pipeline, now Bubble Lock). A remains the safest; C is the most personal but the least ocean.

---

## Challenge log
Challenger: innovation-designer (message of 2026-09-23). Every point was answered, and the changes are already applied above.

| # | Point | Answer |
|---|---|---|
| 1 | A is generic: dive + black + bioluminescence is stock; renaming the meter doesn't escape neal.fun. | **Partly accepted.** I added the Beer–Lambert palette with the far-red CTA, the two true gauges (#19), the pokeable signature, and an honest "the future" ending. **Rejected in part:** A stays on the menu because it is the client's own direction and the client should see it done well. Its familiarity is stated plainly in its Risk. |
| 2 | A's stack is wrong: memory/bits isn't below RTL; projects were placed by convenience. | **Accepted.** I re-ordered it to the true flow `SYSTEM → ARCH → MICROARCH → RTL → NETLIST → LAYOUT → SILICON`. WiSARD moved to ARCHITECTURE (an algorithm chosen for hardware) and the Link Layer to RTL (Verilog). The seafloor is now the future, not a project. |
| 3 | The siphonophore conflates stall and forwarding. | **Accepted.** It now shows both cases: dependent ALU ops (no bubble with forwarding) and load-use (one bubble even with forwarding), plus a branch flush, with a DOM cycle table. |
| 4 | "Caustics straighten into 90° traces" is a shader crossfade, fake optics. | **Accepted.** The hero now uses engineered caustics: a heightfield solved offline (Yue 2014 / Ferraro), so real refraction forms the layout. No-WebGL gets the final frame as an image. |
| 5 | A layer per project repeats one trick four times; CyBot isn't a chip layer. | **Accepted.** Layers became blocks on an atoll die, each with its own verb (Hop, Bubble Lock, Tide Pool). CyBot moved *off-die*, past the reef, linked by UART, as a board-level system with a staged echo sequence rather than a fourth toy. |
| 6 | "Send it to fab" is cute-wrong; the die-as-resume must not be the only resume. | **Accepted.** "Send to fab" is cut. Contact is now the reef's I/O pads with plain labels, and the resume is always in the pinned bar and the Surface Interrupt as well. |
| 7 | C's ocean is atmosphere: make "radio dies in seawater" load-bearing or cut it. | **Accepted.** It is now the central premise of C (seawater absorbs RF, so the site translates the protocol into light), and the remaining weakness is stated in Risk (5). |
| 8 | C's handshake gated on first scroll breaks the 30-second test. | **Accepted.** The three hero lines are DOM at first paint; the handshake is a reward. The loader is a real ADV_IND within the 31-byte limit. |
| 9 | "That's the part I'm building" must say in progress. | **Accepted.** Every mention of the senior design, in every concept, is marked "in progress". |
| 10 | A pinned header isn't an idea; use Surface Interrupt. | **Accepted, with one condition.** The ISR (#5) is now the shared fast path. The control stays **visible and plainly labelled** (`Resume · Contact`), because recruiters won't discover a keyboard shortcut; `R` is a bonus, not the route. |
| — | Bolder offers: Bubble Lock (A), atoll floorplan (B), whale-song interference with live remap (C). | **All three accepted** and placed where offered, and B also takes Bubble Lock and Hop. |

## Revisions
Answers to [`05-critique.md`](05-critique.md) findings addressed to the creative-director. The only revision round; section IDs are unchanged.

- C-17 — accepted: added the plain die caption in S2 ("An illustrative die. The blocks are projects I worked on; it is not a fabricated chip.", which says "worked on" rather than "my projects" because the RISC-V RTL was his partner's). Appended the same fact to the "How the light works" footer. Changed the S7 line to "…These are how you reach me." so "mine" never claims the silicon. Owners of 02-ux, 04-art and 03-motion have been told to swap the copy.
- C-18 — accepted: froze one role line, "Computer Engineering, Iowa State. Heading into ASIC design; seeking hardware and chip-design internships.", for the S1 plate and the Surface Interrupt in every file and proof. Added `[SLOT: grad-term]` to both; it is a question for Akash, never inferred, and the line is omitted while empty.

