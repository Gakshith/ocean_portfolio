# 01b — Innovation

Owner: innovation-designer. Input: [`../vision.md`](../vision.md), [`../content.md`](../content.md), [`00-brief.md`](00-brief.md).
Researched 2026-09-22/23. This is an idea bank, not the design. Nothing here adds a fact about Akash. Any project
claim follows content.md exactly: on RISC-V he did review, hazard debugging and docs, and his partner led the RTL. Senior design is **in progress**.

The test every idea had to pass: **it is true in the ocean, it is true on silicon, and it proves something Akash
actually did.** An idea that only looks like one of them is decoration and was cut.

---

## Research

### Award and studio references
| Ref | Lesson (one line) |
|---|---|
| [Igloo Inc (abeto), Awwwards Site of the Year + Dev SOTY 2024](https://www.awwwards.com/sites/igloo-inc), [tech notes](https://www.webgpu.com/showcase/igloo-inc-procedural-crystals/) | Procedural growth *inside a container* + shader-driven UI text = one material world that scales. Lesson: generate the world from an algorithm, don't model it. |
| [Bruno Simon folio (TSL, WebGPU with auto fallback)](https://bruno-simon.com/) | TSL makes WebGPU/WebGL one codebase. Also: the drive-around game genre is now *his*, so don't copy it. |
| [Samsy Gen-02 (SOTD + Dev, Oct 2025)](https://www.webgpu.com/showcase/gen-02-portfolio-an-immersive-world/) | "Rooms" portfolios are now a genre. Room navigation alone won't earn distinction. |
| [Lusion (SOTM Apr 2026, Oryzo)](https://www.utsubo.com/blog/best-threejs-websites-2026) | Sell *one* object with weight and camera depth. Restraint beats effect count. |
| [Utsubo: best Three.js sites 2026](https://www.utsubo.com/blog/best-threejs-websites-2026) | Throughline: the winners commit to one concept and spend the whole budget on it. |
| [2026 juror list (By-Kin, Iventions, Minh Pham)](https://www.hontran.dev/blog/best-award-winning-websites-2026) | Jurors mark down animation divorced from purpose and mid-range-device jank. Atmosphere beats spectacle. |
| [Active Theory portfolio](https://www.webgpu.com/showcase/active-theory-portfolio/) | Performance-budget every scene for mid-range phones; that *is* the dev score. |
| [Metabole: immersive examples 2026](https://metabole.studio/en/blog/immersive-website-examples) | Cut to 3–5 scenes; semantic HTML before WebGL; mobile-first, not retrofitted. |
| [Codrops: "More than a portfolio" (Apr 2026)](https://tympanus.net/codrops/2026/04/28/more-than-a-portfolio-building-a-scroll-driven-3d-world-with-something-to-say/) | The 3D world only lands when it carries the owner's actual values. Ask "is it worth sharing?", not "is it good enough?". |
| [Codrops: Garden Anomaly, WebGPU+TSL (Aug 2026)](https://tympanus.net/codrops/2026/08/06/garden-anomaly-a-tiny-webgpu-and-tsl-experiment/) | Small, tactile physics toys that you *poke* are what people share, more than big fly-throughs. |

### Ocean / fluid / light tech
| Ref | Lesson |
|---|---|
| [Codrops: WebGPU fluids (MLS-MPM, WaterBall)](https://tympanus.net/codrops/2025/02/26/webgpu-fluid-simulations-high-performance-real-time-rendering/) | Real fluid sims now run on integrated GPUs, but a fluid *toy* is a genre too. Use sim only where it means something. |
| [WebGPU port of Evan Wallace's WebGL Water](https://www.webgpu.com/showcase/webgpu-water-simulation-porting-webgl-history/) | Caustics from a 256² heightfield, with intensity from screen-space derivatives. Cheap enough for our hero. |
| [Tidewater FFT ocean kit (2026)](https://ilikekillnerds.com/2026/05/21/i-built-tidewater-threejs-ocean-kit/), [Web Ocean 3D](https://web-ocean-3d.vercel.app/) | A beautiful FFT ocean with caustics is now **a kit**. A pretty ocean is table stakes, not a differentiator. |
| [Matt Ferraro: Magic Windows (engineered caustics)](https://mattferraro.dev/posts/caustics-engineering) (math from Yue et al. 2014, *Poisson-based continuous surface generation for goal-based caustics*) | You can **design** a refracting surface so its caustic forms a chosen image. This is the key to an honest "light focuses into the chip" moment. |
| [earth.nullschool.net](https://earth.nullschool.net/about) | Honest data rendered as flow particles is hypnotic *because it is real*. Real data > decorative particles. |

### Sonic / scientific visualisation
| Ref | Lesson |
|---|---|
| [Pattern Radio: Whale Songs (Google × NOAA)](https://experiments.withgoogle.com/patternradio) | A spectrogram you can zoom from one call to months is a legible, beautiful interface for the ocean. It gives us the visual grammar for a channel/frequency map. |
| [Bartosz Ciechanowski explainers](https://ciechanow.ski/) | "Poke the mechanism and watch it respond" earns expert trust better than any cinematic. The model for project sections. |
| [neal.fun: The Deep Sea](https://neal.fun/deep-sea/) | Owns "scroll = descend with a depth meter". Anything similar reads as derivative. |

### Chip-domain references (real visual and behavioural language)
| Ref | Lesson |
|---|---|
| [Visual6502](http://www.visual6502.org/) | A real chip simulated transistor by transistor in a browser is still one of the most shared hardware pages ever. **Live, true simulation beats illustration.** |
| [Tiny Tapeout GDS viewer](https://gds-viewer.tinytapeout.com/) / [Explorer](https://gds-explorer.tinytapeout.com/) | Real layout in three.js via glTF: Manhattan metal, true layer stack. That is the look chip engineers trust, not PCB-green. |
| [BLE channel selection (MathWorks)](https://www.mathworks.com/help/bluetooth/ug/bluetooth-le-channel-selection-algorithms.html) | CSA#1 is a few lines of integer math: hop mod 37, and remap if the channel is marked unused. It can run live and cheaply. |

---

## Overdone — avoid

1. **Glassmorphism / "liquid glass" cards.** Apple's 2025 Liquid Glass revived them and made them a default ([Creative Boom: 10 trends creatives are over in 2026](https://www.creativeboom.com/insight/10-trends-creatives-are-so-over-in-2026/)).
2. **Particle-sphere / particle-morph heroes** (logo → cloud → next section). Igloo made it famous, and everyone else made it a genre.
3. **Generic "dive underwater" scroll**: blue fog, god-rays, drifting motes, rising bubbles, jellyfish as the default glowing mascot, and a depth meter. neal.fun owns it.
4. **A pretty FFT ocean as the concept.** Kits ship it now (Tidewater, Water Pro). It is a surface, not an idea.
5. **Caustics as a texture overlay.** Used as decoration it is the most-seen underwater effect.
6. **Cursor blobs, cursor followers, magnetic buttons, RGB-split hover distortion.**
7. **Bento grids, horizontal-scroll project galleries, split-letter reveal on every heading.**
8. **Preloader percentage counter (0→100) and "scroll to begin" heroes.**
9. **PCB-green traces, Tron glow lines, Matrix code rain, typing-terminal hero** as "hardware".
10. **Sci-fi HUD overlays** (ROV cam, corner brackets, fake telemetry numbers). Fake numbers also break our honesty rule.
11. **Walk/drive-around game portfolios and "rooms".** Bruno and Samsy own them, and they fail the 30-second test.
12. **Audio-reactive visualisers** and the **tech-bro gradient / mesh blobs**.
13. **Motion for its own sake**: jurors now mark it down explicitly.

What still surprises in 2026: **live, correct simulations you can poke** (Visual6502, Ciechanowski); **one physically-true
optical trick** instead of many effects; **real data as the texture** (nullschool, Pattern Radio); **algorithms that grow
the world** (Igloo); and **UI and world built from one material**.

---

## Idea bank

Cost is on a mid-range phone: **cheap** (<1 ms/frame or 2D/DOM), **medium** (one full-screen pass or a small sim), **expensive** (multi-pass or large sim; needs a baked fallback).

### 1. Caustic Lithography (engineered caustics)
- **User does/sees:** Sunlit caustics dance on wet sand. As they scroll, the water's surface relaxes toward a precomputed *designed* heightfield, and the same refraction math now focuses the light into a Manhattan-routed layout of his name and die. Scroll back and it melts to shimmer.
- **Why new:** Everyone crossfades caustics into a logo. Here the image is formed by **real refraction through an engineered surface** (Ferraro / Yue 2014), which is literally what a photomask plus optics does. It is physically honest, so an engineer can ask "how?" and the answer is good.
- **Proves:** The chip designer's deliverable is mask data; he designs patterns for light to print. It also demonstrates optics and maths literacy in the build itself.
- **Cost:** medium (256² heightfield + caustic pass). Phone: half-res caustic buffer. No-WebGL: a 3-frame image sequence or short video.

### 2. Bubble Lock (pipeline hazards as a canal lock)
- **User does/sees:** The five stages IF·ID·EX·MEM·WB are five chambers of a water lock. Instructions float through one chamber per clock (tide pulse). The visitor drags a dependent instruction (`add x5,x1,x2` → `sub x6,x5,x3`) in behind another. With **forwarding off**, a literal **bubble** (a real pipeline term, a NOP) rises in the chamber and everything behind waits. When they toggle forwarding on, a back-current carries the value from EX/MEM to EX and the bubble vanishes. A **load-use** pair still costs one bubble even with forwarding, which is correct and is the detail engineers look for. A taken branch **flushes** (also a real term) the wrong-path instructions as a wave through IF/ID.
- **Why new:** Pipeline diagrams are static textbook tables. Here the pipeline's own vocabulary (bubble, flush, drain, stall) is literally water, so the metaphor is not painted on; it was already in the ISA textbook.
- **Proves:** RISC-V 5-stage, specifically **hazard detection, forwarding and branch logic**, which is the part he debugged. Caption: "My partner led the RTL. I reviewed the design, debugged hazards like these, and wrote the docs."
- **Cost:** cheap to medium (instanced 2D/3D, tiny JS pipeline model). A DOM pipeline table (cycle × stage) is the accessible and no-WebGL version *and* the thing engineers read.

### 3. Hop (CSA#1 around whale song)
- **User does/sees:** A Pattern-Radio-style spectrogram band, 2402–2480 MHz, drawn as 40 horizontal lanes of water (3 advertising, 37 data). A connection pulse hops lane to lane using **real CSA#1**: `unmapped = (last + hop) mod 37`, and if that channel is unused, `used[unmapped mod numUsed]`. Whale song (or a "Wi-Fi reef") drifts across some lanes as interference. The visitor taps a lane to mark it bad and watches the channel map remap around it live. A slider sets hopIncrement (5–16).
- **Why new:** No portfolio has ever let you *operate the author's current algorithm* inside the ocean's own acoustic space. The fusion is the physics: both whales and BLE share a crowded medium and must avoid collisions.
- **Proves:** Senior design Link Layer: CSA#1 channel selection and connection handling. Label it "in progress; the algorithm per the BLE Core spec, running in your browser", not a claim about his silicon.
- **Cost:** cheap (integer math + 2D canvas/instanced quads).

### 4. Advertising Preloader (ADV_IND decode)
- **User does/sees:** There is no percentage counter. While the 3D loads, three pulses fire on channels 37/38/39 and a PDU decoder types out a *real* legacy ADV_IND: header, AdvA, then AdvData with AD type `0x09 Complete Local Name` = `Akash Gojuru`. The HTML name/role/resume are already visible beside it. When the assets are ready, the log reads `CONNECT_IND` and the world opens.
- **Why new:** A loader that is a true protocol trace of his own subsystem. The **31-byte AdvData limit** becomes a copywriting constraint: the hero line must fit in the packet.
- **Proves:** Link Layer advertising and PDU decode/generation.
- **Cost:** cheap (DOM text).

### 5. Surface Interrupt (ISR fast path)
- **User does/sees:** From any depth, a pinned `IRQ` control ("Resume · Contact", key `R`) **pre-empts** the film: the scene freezes and dims, a line reads `context saved @ <section>`, and a one-screen **scan dump** slides up with name, school, the 4 projects in one line each, resume PDF, email, LinkedIn and GitHub. `Esc` = `RETI`: the scene resumes at the exact scroll position and camera state.
- **Why new:** The 30-second recruiter path is usually a boring sticky header. Here it is an **interrupt service routine**, correct in behaviour (preempt, save context, serve, return) and the fastest route on the site.
- **Proves:** CyBot (timers, **interrupts**, UART), embedded thinking. It also fixes the vision's hard constraint by design.
- **Cost:** cheap (DOM + pause render loop).

### 6. Every Word Is True Twice (the shared lexicon)
- **User does/sees:** The copy is written only in words that are real in both worlds: *bubble, flush, drain, ripple (carry), well (n-well), island (power island), channel, current, sink/source, buffer, drift, leakage, wave (waveform), noise, float, and **sea of gates*** (a real 1980s ASIC architecture). On hover or tap, a word turns over like a tide-flipped shell and shows its hardware definition in one line.
- **Why new:** Fusion done in **language**, which no shader can fake. It answers the vision's "one world, not a theme" at the level of meaning. "Sea of Gates" could be the site title.
- **Proves:** Vocabulary precision; the brief says a chip engineer must find zero wrong terms, and this *invites* them to check.
- **Cost:** cheap.

### 7. Lee's Wave (route a wire to Akash)
- **User does/sees:** The contact section is a seafloor routing grid with rocks and coral as blockages. When they press "Contact", **Lee's maze-routing algorithm** (a real EDA router, and literally a BFS *wavefront*) ripples out from the visitor's pin as concentric water rings, reaches Akash's pad, then back-traces the shortest path and lays a glowing metal wire. The email/form opens in about 600 ms, and a skip button is always there.
- **Why new:** The oldest routing algorithm in EDA *is* a wave propagation, so the ripple is the algorithm, not an effect.
- **Proves:** Place-and-route literacy, ASIC-flow awareness. (A general skill, not a claimed project; label it as such.)
- **Cost:** cheap (64×64 BFS on CPU, rendered as a texture).

### 8. Atoll Floorplan (the die is an island; I/O pads are contact)
- **User does/sees:** The overview/site map is a die seen from above, shaped as an **atoll**: the pad ring is the reef, the core is the lagoon holding the projects, and the **I/O pads on the ring are the contact links** (email, LinkedIn, GitHub, resume). Bond wires run out to the "package" as mooring lines.
- **Why new:** A pad ring really is a ring around a core, and it is literally where a chip talks to the world, so contact = I/O is semantically exact.
- **Proves:** Floorplanning basics; ASIC direction.
- **Cost:** cheap to medium (one lit plane plus instanced pads). The no-WebGL version is an SVG.

### 9. Beer–Lambert Palette + the Stoplight Red channel
- **User does/sees:** The colour system obeys water absorption: as the world gets deeper, reds go first, then oranges and yellows, until only blue-green remains. The **one exception** is the CTA, which glows far-red at every depth. That is a real trick of the stoplight loosejaw (*Malacosteus*), which makes red light that its prey cannot see: a **private channel**.
- **Why new:** The design tokens are physics, not mood. The CTA colour carries a meaning, and art direction gets a rule instead of a vibe.
- **Proves:** Systems thinking (it is a design-system idea, not a project).
- **Cost:** cheap (a uniform on post-processing plus CSS variables driven by scroll).

### 10. Toggle Coverage (plankton that remembers)
- **User does/sees:** Dinoflagellates flash when water is sheared (true). Scroll and cursor shear light them up. Each section is a "net", and the footer shows a live **toggle-coverage report** of the *visitor's own* visit: "You toggled 5/7 nets. Uncovered: Senior Design, WiSARD." Each uncovered item is a link.
- **Why new:** A verification metric (toggle coverage) turned into honest wayfinding. The number is real, measured on the visitor, and never a fabricated claim.
- **Proves:** Verification mindset (QuestaSim testing on RISC-V).
- **Cost:** cheap (the counter) to medium (the plankton field; instanced points).

### 11. Clock-Gated Ocean
- **User does/sees:** The deep ocean is dark by default and the render loop **stops** when nothing changes (render-on-demand). A small honest meter shows `clk gated · 0 frames last 2 s`. Motion wakes it, and bioluminescence is the only light spent.
- **Why new:** A performance technique shown as meaning: low-power design (clock gating) matched with how deep-sea animals ration light. The live numbers come from the visitor's own device.
- **Proves:** Low-power/ASIC mindset; battery-kind build.
- **Cost:** cheap, and it *saves* cost.

### 12. Ping (CyBot echo navigation)
- **User does/sees:** In a dark section they hold to emit a ping. Rings expand, and echoes return from objects (project cards), with distance computed as `d = v·t/2`. A readout contrasts the CyBot's PING in air (~343 m/s) with the ocean (~1,480 m/s). The robot's obstacle course appears as echoes, never as a clean map.
- **Why new:** Sonar in the ocean and ultrasonic ranging on a robot are **the same physics**, so the fusion is exact.
- **Proves:** CyBot: PING distance sensing, timers (time-of-flight), navigation from sensor data only. Confirm with Akash before adding any detail beyond content.md, such as a servo sweep.
- **Cost:** cheap to medium. The content must also be readable without pinging.

### 13. Tide Pool WiSARD (a live, one-shot RAM classifier)
- **User does/sees:** They draw a shape in wet sand. The tide thresholds it into a binary grid (the binarisation step); bit-tuples light up as RAM addresses; the discriminators (one per class: *wave, fish, shell*) count hits and the winner glows. They can teach a new class with **one example**, because training in WiSARD is just writing 1s into RAM with no backprop.
- **Why new:** An actual weightless neural net running in the page; the "tide pool" gives an honest visual for memory-as-learning. No accuracy numbers are claimed.
- **Proves:** WiSARD: binary vectors, hashing/addressing, and the memory-versus-accuracy trade-off (a slider for tuple size shows RAM size against how well it separates classes, *on the visitor's own drawings*).
- **Cost:** cheap (the JS classifier runs in microseconds; a 2D canvas).

### 14. Kelp H-Tree (clock tree under current)
- **User does/sees:** A kelp forest grown as an **H-tree**, with one root and equal-length branches to every leaf flop. The clock edge rises as a pulse from the holdfast. The visitor drags a current, the kelp sways unevenly, and leaves light at different times (**skew**). Buffers are inserted (like float bladders on kelp) to rebalance.
- **Why new:** Clock tree synthesis made visible and physical. Kelp *does* grow with gas bladders, so the buffer is not forced.
- **Proves:** ASIC-flow awareness (CTS). A general skill, not a project claim.
- **Cost:** medium (skinned instanced strands).

### 15. Thermocline CDC (crossing between worlds)
- **User does/sees:** Between the personal-ocean slot sections and the engineering sections lies a thermocline, a boundary between two water masses with different "clocks". Content crossing it wobbles (internal waves, **metastability**) and then settles after two ticks (a **2-flop synchronizer**).
- **Why new:** The transition between his two identities is a correct clock-domain-crossing diagram, not a fade.
- **Proves:** Digital design depth (CDC is a classic interview topic).
- **Cost:** cheap (a shader wobble on the section edge).

### 16. Tide Viewer (the scrollbar is a waveform viewer)
- **User does/sees:** A thin persistent QuestaSim-style strip at the bottom: signals `clk`, `section`, `stall`, `hop`, each a trace. Scroll position is the cursor line, and clicking a transition jumps there. The ocean swell's period *is* `clk` (the moon is the oscillator). If Akash supplies a real VCD from his coursework, it drives the swell.
- **Why new:** Navigation as a waveform viewer is exactly what a hardware person uses daily; the tide is literally a periodic signal.
- **Proves:** Tested with QuestaSim waveforms (RISC-V).
- **Cost:** cheap (2D canvas). `[SLOT: project-media-riscv-vcd]` for real data, and it must be labelled illustrative otherwise.

### 17. Submarine Cable UART (the contact form sends light)
- **User does/sees:** When they press Send, the message is serialised into UART frames (start bit, 8 data bits, stop bit) as light pulses that race down a submarine cable on the seafloor to Akash's pad.
- **Why new:** Almost all intercontinental internet traffic runs through undersea cables. The ocean really does carry data, so the send is a true image of it.
- **Proves:** CyBot UART.
- **Cost:** cheap (under 1 s, skippable, and the form posts immediately regardless).

### 18. Link Layer State Nav
- **User does/sees:** The site's modes follow the LL state machine: *Standby* (idle), *Advertising* (hero), *Scanning* (browsing projects), *Initiating* (contact open), *Connection* (sent). A tiny state indicator shows the transitions.
- **Why new:** Global UI state = his FSM.
- **Proves:** Senior design state machines.
- **Cost:** cheap. Risk of jargon; pair with plain labels.

### 19. Two Gauges (metres and nanometres)
- **User does/sees:** Two honest scale bars: water depth in metres, and the feature scale being shown (package in mm → cell in µm → transistor in nm), in the spirit of *Powers of Ten* but with correct units.
- **Why new:** It replaces a fake depth meter with two true measurements.
- **Proves:** Abstraction/scale literacy.
- **Cost:** cheap.

### 20. Marine Snow SEU (easter egg)
- **User does/sees:** Marine snow drifts down; rarely, a particle strikes a register on screen and flips a bit (a **single-event upset**), and a tiny ECC badge corrects it.
- **Why new:** A true reliability phenomenon rendered as a true ocean phenomenon.
- **Proves:** Nothing from content.md; it is a delight detail only. Keep it tiny or cut it.
- **Cost:** cheap.

---

## Top 5

The ideas I would fight for, and why together they make one site:

1. **Caustic Lithography (engineered caustics)** — the hero. Light through designed water *physically* focuses into his layout and name. It is the one image a juror remembers, and it is optically true. (It converges with concept B; the non-negotiable is that it is a real designed refraction, not a crossfade.)
2. **Bubble Lock** — the RISC-V section as a pokeable pipeline where *bubble*, *flush* and *stall* are literal water. Toggle forwarding, see the load-use bubble survive. It proves exactly what he debugged.
3. **Hop (CSA#1 around whale song) + Advertising Preloader** — his senior-design algorithm, running live in the ocean's acoustic space. The loader is a real ADV_IND carrying his name.
4. **Surface Interrupt** — the recruiter fast path as a correct ISR: pre-empt, save context, one-screen scan dump (resume, email, LinkedIn), `RETI` to the exact spot. It passes the 30-second test *and* proves embedded thinking.
5. **Every Word Is True Twice** — the copy spine: bubble, flush, drain, ripple, well, island, channel, current, **Sea of Gates**. It makes the fusion load-bearing in the language, and it costs almost nothing.

Close runners-up: Lee's Wave (contact), Atoll Floorplan (I/O pads = contact), Beer–Lambert palette with the far-red CTA,
Tide Pool WiSARD.

---

## Feasibility notes

- **One codebase:** Three.js WebGPU renderer, WebGL2 fallback, all shaders in TSL (proven in production by IVRESS and Bruno Simon).
- **Engineered caustics:** Solve the heightfield offline (Poisson / optimal-transport method per Yue 2014 and Ferraro) for 2–3 targets (name, die, maybe resume glyph) and bake each to a 256² float or 16-bit texture (~130 KB each). At runtime, lerp from procedural waves to the designed heightfield by scroll, then run the standard refract-and-derivative caustic pass (Evan Wallace method). Phone: half-res buffer, 30 Hz update. No-WebGL / reduced motion: the final focused frame as an image, with a short video for motion-OK low-GPU devices.
- **Live sims (Bubble Lock, Hop, WiSARD, Lee, ISR):** All are tiny integer/boolean JS models, deterministic and unit-testable. The visual layer is instanced quads. Each ships a DOM/SVG twin (pipeline table, channel list, grid), which is also the accessible version and what engineers read.
- **Frame budget (phone, 16 ms):** 1 medium pass (caustics *or* plankton, never both on screen) + cheap 2D. Render on demand (idea 11) whenever idle.
- **Honesty guards:** Every live sim is labelled "running in your browser". Nothing implies his silicon works or that he wrote the RISC-V RTL, and senior design is always marked "in progress". Coverage and frame numbers are measured on the visitor's device. The real VCD and waveforms are `[SLOT]`s.
- **30-second test:** Name, role, resume and contact are HTML from the first paint. The Surface Interrupt is the pinned, keyboard-reachable path, and nothing on the primary route is gated behind a sim; every interaction is optional depth.
- **Audio** (whale song, pings): off by default and user-initiated, per the brief.
- **Risk:** Too many toys. The final plan should keep **1 hero effect + 3 pokeable sims + 1 fast path**. Everything else is copy or a cheap detail, or it is cut.
