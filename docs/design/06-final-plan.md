# 06 — Final plan

Owner: creative-director. Status: **final draft for client approval (gate G2)**, 2026-09-23.
Merged from [`01-concept.md`](01-concept.md) (frozen), [`02-ux.md`](02-ux.md), [`03-motion.md`](03-motion.md), [`04-art.md`](04-art.md) after one critique round ([`05-critique.md`](05-critique.md): 22 findings, all accepted) and the client direction CLIENT-01.
Where the source files still disagreed, this file decides (see **Decisions log → R-xx**), using the fixed order **brief > usability & accessibility > performance > story > looks**. If a teammate file and this file differ, **this file wins**.
All copy comes from [`../content.md`](../content.md). Nothing here adds a fact about Akash. `[SLOT: …]` marks content only he can supply.

---

## Concept

**Caustic Lithography.** Sunlight through moving water prints caustic light on sand, and lithography prints a chip with light through a mask. On this site the water's surface is *engineered*: as the sea goes still, real refraction (not a crossfade) focuses the light into routed top-metal lettering that spells AKASH GOJURU on a die. That die is an atoll. Its lagoon holds his projects as blocks (radio, CPU, memory), a UART line runs off the reef to his robot in the open sea, and the pads on the reef are how you reach him. The visual logic is a **sun print**: a sunlit plate at the start, an exposed plate by the end of the hero, and the plate keeps darkening down the page. There is one accent, sea blue, and it marks only things you can act on. Three real mechanisms run live in the browser: CSA#1 channel hopping, a 5-stage pipeline with a load-use bubble, and a WiSARD RAM classifier. Each is labelled as a teaching model, not his silicon. A recruiter gets name, role, the four projects and the resume in the first viewport, before any of the film.

---

## Beat sheet

Frozen. IDs never change.
```
S1-hero | wonder | "the light on the sand is drawing something" | user job: orient | signature: yes
S2-about | recognition | light through water, light through a mask: who, school, skills, the die map | user job: recognise | signature: no
S3-linklayer | curiosity | radio block: hop around the whale song | user job: understand | signature: no
S4-riscv | focus | CPU block: bubbles, forwarding, flush | user job: understand | signature: no
S5-wisard | play | memory block: teach the tide pool | user job: understand | signature: no
S6-cybot | ease | past the reef: finding the way by echo | user job: understand | signature: no
S7-contact | resolve | the reef's pads light: this chip talks to the world through them | user job: act | signature: yes
```
The Surface Interrupt (the global fast path) is UI, not a beat.

**Guardrails (they held through revision):** one idea; two signature moments (S1, S7); one medium GPU effect; refraction and every mechanism real; the `Resume · Contact` fast path always visible; honest content with marked slots; real layout language; all copy in the DOM.

---

## Per-section spec

Layout and structure come from 02-ux, visuals from 04-art, and motion from 03-motion, merged below. Grid: 12 columns, 24px gutters, margin `clamp(16px, 4.4vw, 64px)`. Breakpoints: phone < 768, tablet 768–1099, desktop ≥ 1100. `P` is progress through a pin or scrub.

### Global UI (every section)
- **Desktop and tablet:** a 56px top bar on a flat scrim `rgba(14,19,18,.86)` (no blur, no glass). It holds the wordmark "Akash Gojuru" (Newsreader 20/500, links to #top), then a "where am I" label (`Akash Gojuru / Link Layer`), then a split pill at the right:
  - **`Resume ↗`** is a real `<a href="RESUME_IBM_1.pdf">`, opens in a new tab, works without JS, and has a `--sea` fill with `--ink` text.
  - **`Contact`** is `--floor-1` with `--light` text and opens the Surface Interrupt.
  - Both targets are ≥ 44×44. A 96px die-map minimap sits bottom-left and expands on hover or focus to a 260px panel with 7 links. The Still toggle is bottom-right.
- **Phone:** there is no top pill (C-16). A bottom bar of 56px plus the safe area holds `[≡ n/7 <section> ▴] [Resume ↗] [Contact]` at 144 / 88 / 96px with 8px gaps. The chip opens a bottom sheet with the floorplan and 7 links. `scrollWidth === innerWidth` at 375.
- **Nothing in the chrome ever hides, fades or moves.** Only the Surface Interrupt covers it, on purpose.
- **Surface Interrupt** (pill Contact or key `R`; `R` is ignored while typing or on the Tide Pool pad, and can be turned off under `?`):
  - It pre-empts in the same frame: the render loop, Lenis and the sims pause.
  - It saves `{scrollY, camera pose, sim states}`. The mono line `context saved @ S4 · RISC-V` is flavour only.
  - It sets `inert` on everything outside and traps focus. `pushState`, so Back closes it. The canvas dims (`brightness(.32) saturate(.5)`, 240ms).
  - The sheet rises in 240ms `--e-out`, with focus on its h2. It is a 720px panel on desktop and full screen on phone.
  - Contents: name · the frozen role line · `[SLOT: grad-term]` · **Open resume (PDF) ↗**, the only `--sea` fill · Email + [Copy] · LinkedIn ↗ · GitHub ↗ (`--floor-2`, `--line-strong` border) · h3 Projects, 4 rows that jump · a 44px ✕ · "Back to where you were".
  - Esc, ✕, the back button and browser Back all return in 200ms to the exact scroll position and camera pose, with focus back on the opener. Under reduced motion it opens and closes instantly.
- **Jumps** (die map, index rows, Interrupt project rows): the scroll is set instantly to the target's dwell start, and the camera flies a direct path (straight in plan plus a 15% height arc, ≤ 900ms, power2.inOut). The DOM cross-fades (120 out / 200 in), entrances in skipped sections are marked done, and focus goes to the target h2. Reduced motion or Still: an instant cut. On hash load the camera starts at that stop, and the lagoon RT is rendered once, deterministically.
- **Scroll model:** native scroll only (Lenis `lerp 0.1` on fine pointers; native on touch and under reduced motion). There is no snapping, no wheel capture and no horizontal page scroll. The camera travels only while the next section's top moves from 100% to 30% of the viewport, and dwells otherwise. There is one pin (S1) and one scrub (S6). Everything reverses on scroll-up. Sims pause off-screen, in hidden tabs and during the Interrupt, and the render loop idles at 0 frames when nothing changes.
- **Section breaks** are 32px **scribe lanes** (`--floor-deep`, 1px `--line` edges, a box-in-box key left, a cross key right, and a die-ID in `--t-data` such as `AG-S4 · RISC-V`). They are aria-hidden and never interactive.
- **Headings develop:** opacity 0→1, 320ms `--e-out`, at 20% in view, once. No translate, no split letters. Body text never animates.
- **Cursor:** native everywhere. `pointer` on targets, `crosshair` on the Tide Pool pad, `grab` only on Bubble Lock's optional drag.

### S1-hero — orient · signature 1 (the focus)
- **Layout:**
  - The canvas is full-bleed. The DOM **ink plate** (solid `--floor-0`, no radius, 32px padding) sits lower-left in cols 1–5, and the light-lettering never forms in the lower-left quadrant.
  - The plate contains, top to bottom:
    1. h1 "Akash Gojuru" (`--t-display-xl`, `clamp(48px,4.4vw,64px)`, the *quiet* name).
    2. The role line (`--t-lede`, `--sand`).
    3. `[SLOT: grad-term]`, omitted when empty.
    4. The **4-line project index** (DOM links, `--t-data`; ≥ 44px rows on phone): `BLE Link Layer — senior design, in progress` · `RISC-V 5-stage pipeline — hazard debug, review, docs` · `WiSARD — RAM-based classifier` · `CyBot — autonomous robot`. Each jumps to its section.
    5. The ADV_IND panel, shown only while 3D loads.
  - There is no CTA in the plate; the pill is the CTA. A text "scroll" cue sits at bottom centre.
  - **Phone:** the lettering zone is the top ~38% (it shows shimmer only until the first scroll, so the name appears once at load). The plate takes ~58% of the viewport, and ADV_IND is one mono line at the top of the plate (R-05).
- **Visual:**
  - Zenith sun, cool white `#E6F4FF`. Grey-cyan sand (`--sand-sun #BAC4C2` / `--sand-shade #6E7E80`), tiled to the frame edges.
  - The light-letters are ~4× the h1 cap height, built from the canonical 8×12-track glyph set (the JSON in 04-art, extracted to `glyphs.json`). The die around them has a double seal ring, the pad ring (the reef), straps and density fill.
  - Target luminance: traces 1.0 · pads 0.35 · seal 0.30 · straps 0.20 · fill 0.20 (24px pitch, 20px keep-out) · core 0.02.
  - Acceptance: letters ≥ 3× fill and ≥ 8× core (the proof measures 9.1× and 24.3×).
  - Dispersion under 8% chroma, desktop only.
- **Motion:**
  - The pin is **120vh desktop / 100vh phone**: 0–0.05 shimmer · 0.05–0.45 focus · 0.45–0.55 hold · 0.55–1.0 straight vertical rise to plan view of the whole die. S2's headline is in view by P 0.70.
  - The focus `f` (0→1, power3.inOut) lerps the lagoon surface from swell to the engineered slope field. Exposure stops down 1.6→0.42, ambient goes 0.35→0.02, bloom 0→1, and camera tilt goes 28°→0° as the image focuses.
  - Lagoon swell `(1−f)^1.6`. The open sea `(1−f)^0.7` calms more slowly and **stops** over P 0.9–1.0.
  - A 3% residual swell is masked off the traces (corners never bend) and ramps to 0 over P 0.7–0.9.
  - Metal layers tint in 0→35% over P 0.72–1.0.
  - From P ≥ 0.9 the RTs freeze and the loop idles.
  - Scrolling back melts the name into shimmer (it is all a function of scroll).
  - The camera distance is **fitted** so that the letter bbox plus 6% sits inside the free region measured from the real DOM (bars plus plate), and the die bbox plus 4% at the rise end. A lens shift keeps the rise purely vertical.
  - The DOM plate never animates.
- **Loader (ADV_IND):**
  - It starts only if 3D isn't ready at 300ms. Its lines advance on real milestones (script parsed → GPU context → slope field loaded → shaders compiled), never on a timer.
  - It decodes a real legacy ADV_IND: header `0x40 0x17`, an illustrative random static AdvA (labelled), and AdvData `02 01 06 | 0D 09 "Akash Gojuru"` = 17/31 bytes, with a CRC-24.
  - On the first frame it prints `CONNECT_IND` and the canvas fades over the poster (400ms). The panel collapses after 1.2s, and the camera starts at the current scroll pose.
  - With no frame at 8s: "Showing the still version." It is aria-hidden, with no % and no "enter".
- **Content:** the frozen role line "Computer Engineering, Iowa State. Heading into ASIC design; seeking hardware and chip-design internships." The canvas is aria-hidden, with a visually hidden one-sentence description of the focus.
- **Still / reduced motion:** the final focused frame as an AVIF still, no pin, 100vh, identical plate.

### S2-about — recognise
- **Layout:**
  - Desktop: text in cols 1–5 and the die plan view in cols 7–12.
  - Text order:
    1. h2 display line (italic `--t-display-l`): *"Light through water. Light through a mask."*
    2. The sub-line (`--t-lede`): "Sunlight through waves draws patterns on the sand. Lithography draws a chip the same way, with light through a mask. The pattern is the designer's work, and it's the work I'm training for."
    3. The about paragraph (content.md).
    4. `[SLOT: ocean-story]` (collapses to zero height when empty).
    5. The facts `dl` (Education · Skills · Experience · Recognition).
    6. `[SLOT: photo-akash]` as a 4:5 "unexposed frame" (fill tiles, four L-fiducials, the one word `UNEXPOSED`; never "[SLOT]" or "coming soon").
  - Beside the die: h3 "On this die", 4 DOM link rows twinned with the blocks.
  - **Die caption at body size, always visible:** "An illustrative die. The blocks are projects I worked on; it is not a fabricated chip."
  - Phone: stacked, with a 343×343 die, 56px rows and the facts below.
- **Visual:**
  - Floorplan: Radio is a wide NW block (~3:1), CPU centre-west (~5:2), Memory east (~3:2). The south third of the core is open lagoon facing the contact pads on the S reef. The UART pad is on the SE reef.
  - The name stays in top metal at 12%, all three layers at 35%, with coaxial-microscope light (flat, 1px specular edge).
  - Ground: `--floor-0` plus 12% `--exposure` radial behind the die.
- **Motion:**
  - Camera at C0 (whole die), RTs frozen.
  - The h2 lines develop 320ms apart by 160ms.
  - Row ↔ block hover or focus: layer 35→70%, outline 0.4→1, 120ms in / 200ms out.
  - Visited blocks 35→50%.
  - When S3's travel starts, only the destination fill lights in the minimap (240ms). There is no "docking".
  - A filled photo gets one 600ms light-sweep.
- **Still:** the floorplan is an SVG with the same links.

### S3–S5 shared rules (sims drawn on the blocks, C-06)
- Each sim renders to its own 2D canvas, uploaded as a `CanvasTexture` onto its block's top-metal plane. It uploads only when the sim changes, at device-pixel size.
- The same DOM canvas stays in place at `opacity:0` as the input and focus layer. Focus rings, hover labels and grid overlays are drawn visibly by the DOM.
- During dwell the camera **pans 1:1 with the Lenis scroll value** (plan view, no easing), so the die moves like the paper.
- Safety valve: if drift exceeds 1px for 3 or more frames, that section falls back to flat-DOM.
- **Flat-DOM mode** (sim canvas flat over a static plan still of the block) applies on phone, with `pointer: coarse`, under reduced motion and in Still.
- Controls live in a DOM control rail under or beside the drawn surface (`--floor-1`, `--line-strong` borders, no pills). Each rail carries the sim name · "running in your browser" · Pause/Play (if it autoplays) · Reset · a short "illustrative die" caption at the right end.
- Each block keeps its 2px layer rule (S3 violet, S4 copper, S5 oxide). Framings are **top-down only** (pan or zoom, never orbit or tilt).
- Each section ends with `Next block: <name> ↓` and `Back to die map ↑`.
- **The text reads completely without touching the sim.** Every sim has a DOM twin.
- Sim feedback is ≤ 100ms. Sims never capture the wheel.

### S3-linklayer — understand (radio block, Hop)
- **Content:**
  - h2 "BLE Link Layer".
  - Status line "Senior design · in progress · Jan–Dec 2026 · advisor Dr. Henry Duwe".
  - His part: advertising, scanning, connections, PDU decode/generation, state machines, CSA#1 channel selection.
  - Stack chips: Python · C · Verilog.
  - `[SLOT: project-media-linklayer]`.
  - Data line: `CSA#1 per the BLE Core spec · a teaching model running in your browser, not his silicon`.
- **Layout (desktop):** a text band above (2 cols, 8/12). A **full-width spectrogram band** is drawn across the radio block. Below it, a rail: chip grid 8/12 plus hop log 4/12.
- **Model (C-12, R-03, R-04):**
  - 40 lanes in frequency order (2402→2480 MHz), with 37/38/39 at their real positions and not toggleable.
  - `unmapped = (lastUnmapped + hop) mod 37`. If that channel is used it is the channel; otherwise `used[unmapped mod numUsed]`. The next hop always starts from `lastUnmapped`.
  - `hopIncrement` (5–16) is fixed per connection. **Moving the slider starts a new connection** (`CONNECT_IND · hop = 9`, and the log resets).
  - **Tapping a chip or lane stages a pending map.** "Send map update" (or the one-tap demo "Avoid the whale song") issues `LL_CHANNEL_MAP_IND · instant = event n+6` with a countdown, and the map applies at the instant. Only one update is in flight at a time.
  - Marking bad is disabled at 2 used channels ("CSA#1 needs at least 2 used channels").
- **Four chip states, never colour alone:** used (plain) · pending (dashed plus "pending") · bad (hatched plus ✕) · **lost**: a hop that lands on a whale-covered used lane gets a hollow, broken mark labelled `lost` in `--dim` (C-19).
- **Visual:**
  - Advertising lanes are `--light` hairlines with mono tags. Data lanes are violet at 20% and 60% when used.
  - The whale song is soft `--light` strokes at 35% (labelled "stand-in for interference, e.g. Wi-Fi").
  - A tappable lane gets a `--sea` outline on hover or focus.
  - Ground at 8% exposure. The block top under the drawing is flat and unrouted.
- **Motion:**
  - Autoplay at 2.5 events/s while ≥ 30% in view, with a visible Pause (WCAG 2.2.2).
  - Event mark 90ms expo.out. Hop connector fades over 400ms. Remap ghost and arrow 180ms.
  - Pending outline ≤ 100ms. At the instant, pending lanes switch together with one 200ms 1px sweep.
  - Whale-song drift takes 8s per crossing.
  - The log and formula swap instantly.
  - Reduced motion: paused; Step adds one column; states are static.
- **Twin:** h3 "Channel map" (counts plus a list of bad channels) and h3 "Last 8 hops" as an `ol` of `unmapped→channel`.
- **Announcements:** only on user action or at the instant.
- **Phone:** a 343×220 surface, then the slider and demo, then an "Edit channel map" disclosure (a 6-per-row grid of 50px chips plus Send).

### S4-riscv — understand (CPU block, Bubble Lock)
- **Content:**
  - h2 "RISC-V 5-stage pipelined processor".
  - **Directly under the h2, at body size, not in a caption (R-02):** "Two-person team. My partner led the RTL. I reviewed the design, debugged hazards like these, and wrote the docs."
  - Stack chips: VHDL · SystemVerilog · QuestaSim · RARS.
  - A testing line (RARS assembly, QuestaSim waveforms, VHDL component organisation).
  - `[SLOT: project-media-riscv]` (waveform).
  - Stage data line: `Textbook 5-stage · branch resolves in EX · register file writes, then reads · a teaching model, not our RTL`.
- **Layout (desktop):** h2 and role line above; five chambers `IF ID EX MEM WB` laid along the CPU block; the rail; the **cycle table full width** below.
- **Model (C-13):** one JS model drives the chambers, the table and the captions.
  - Dependent ALU: 0 bubbles with forwarding (EX/MEM→EX), 2 without.
  - Load-use: **1 bubble with forwarding** (bubble in EX at cycle 4, MEM/WB→EX at cycle 5), 2 without.
  - Taken branch: resolved in EX, **2 wrong-path instructions flushed**.
  - Scenarios are a radio group (`Load-use` is the default: `lw x5,0(x1)` · `add x6,x5,x2` · `sub x7,x6,x3`), plus the Forwarding switch and `◀ Back · Step ▶ · ▶ Play (700ms/cycle) · Reset`.
  - It starts paused at cycle 0. Drag-in is optional desktop sugar only (WCAG 2.5.7).
- **Visual (R-08):**
  - Copper-edged chamber walls (2px). Instructions are `--light` mono tokens.
  - A **bubble** is a labelled cell reading "bubble" with a hollow `--light` circle (1.5px). Stalled instructions read "(held)".
  - The forwarding path is full copper. A flush is a cool-white wave, with the wrong-path instructions struck through and reading "flushed".
  - 6% exposure, and an empty band above the chambers for the flush.
- **Motion:**
  - Gates open 80ms power2.in. Instructions advance 280ms power3.inOut. Water levels equalise over 240ms.
  - The bubble rises into EX over 240ms expo.out.
  - The forward back-current fills in 200ms in **the cycle the consumer is in EX**, then fades over 300ms.
  - Flush sweep 260ms. The table column highlight is 120ms.
  - Reduced motion: cuts per step, same information.
- **Live caption:** one sentence per meaningful event.
- **Phone:** chambers as 5 columns of ~62px. The cycle table is in its own labelled horizontal-scroll region with a sticky first column (the site's only horizontal scroll).

### S5-wisard — understand (memory block, Tide Pool)
- **Content:**
  - h2 "WiSARD weightless neural network".
  - The claim line: RAM-based classifier, inputs → binary vectors → addresses, memory versus accuracy for edge devices.
  - The honesty line "**No accuracy numbers. Try it on your own drawings.**"
  - Seed classes (wave, fish, shell) are trained on sample drawings bundled with the page, and the page says so.
  - `[SLOT: project-media-wisard]`.
- **Layout (desktop):** a centred text column (6/12) above. A **square 16×16 tide pool** centred on the memory block, with the discriminator bars to its right. Then the rail: Clear · Try an example · Tuple size (2–8) · a live RAM-size line · Teach a new class (name plus button, max 6).
- **Model (C-22):** a winner is shown only when the top count leads by **more than 2 RAMs**. Otherwise the result reads "Too close to call: 23 vs 22" with no highlight. The **gap** (top minus second) is always shown as a plain count. An empty pool reads "Draw something". All numbers are computed live and never claimed.
- **Visual (R-11):**
  - The pool is the one window of lit sand after S1 (`--sand-sun`), with an `--ink` stroke.
  - Cells are oxide at 100% for 1 and `--line` for 0.
  - Bars run oxide 35→100%. The winner's bar is oxide at 100% and its label `--light` weight 600, plus the text "→ wave".
  - 4% exposure. A soft 10% pool shimmer (none under reduced motion).
- **Motion:**
  - Ink has 0ms latency. The tide wash binarises left→right in 360ms.
  - 8 sample tuples light over 240ms. Bars 320ms expo.out. Winner 160ms.
  - Teach flips RAM cells with a 20ms stagger, capped at 300ms.
- **Input:** draw with pointer or finger (`touch-action:none` on the pad only, with ≥ 32px scrollable gutters), or toggle cells by tap or click. Keyboard: a `role="grid"` 16×16 with arrows, Space and Shift+arrows.
- **Phone:** a 280×280 pad (≤ 50% of viewport height), with the bars and result below.

### S6-cybot — understand (off-die, echo sequence)
- **Content:**
  - h2 "CyBot autonomous robot (CPRE 2880)".
  - Semester-long, three-person team. The robot navigates an obstacle course autonomously from bump, IR and PING data only.
  - The why-off-die line (a board-level system, linked by UART from the die's UART pad).
  - Stack chips: C · microcontroller · timers · interrupts · UART · analog/digital peripherals.
  - `[SLOT: project-media-cybot]`.
  - Stage label: "Illustrative course, not a recording."
  - `[SLOT: cybot-sensing-detail]` until Akash confirms how the PING sensor was aimed. No servo-sweep claim.
- **Layout:** the one sticky split. Text in cols 2–6 scrolls normally. The stage is sticky on the right (top 72px, max-h 100vh−96px).
  - The scrub is 160vh desktop and 110vh phone.
  - Phone: a sticky stage of 40vh with the text below.
  - **Text is never keyed to scrub position.**
- **Visual:** `--floor-deep`, 0% exposure, no metal colour, no sun. About 70% of the frame is unlit. The UART line is a 1px aluminium hairline. The readout is `d = v·t/2`, v ≈ 343 m/s (air).
- **Motion (C-14):**
  - The UART line draws in over the first 8%.
  - Each **PING is a narrow forward cone** (±20°) filling outward along the heading. Pings start at 10% + 20%·k, each over 8% of the scrub. There are no 360° rings.
  - An **echo and its obstacle segment appear only where the cone meets an obstacle**.
  - IR is a short dotted ray (160ms). **Bump** is a contact tick on the robot outline (120ms).
  - The path turns between pings based only on what the sensors revealed.
- **Still:** a static SVG with every cone, echo and the dashed path at normal height.

### S7-contact — act · signature 2 (the reef lights)
- **Content:**
  - h2 (italic `--t-display-m`): *"Every chip talks to the world through its pads. These are how you reach me."*
  - **Pad list, primary at every size, visible and clickable at 0%**, as five 56px rows numbered as pads:
    - **01 Resume (PDF) ↗** (`--sea`)
    - 02 Email `gojuru18@iastate.edu` with a separate 44px [Copy] ("Copied" inline, reverts after 1.4s)
    - 03 LinkedIn ↗
    - 04 GitHub ↗
    - 05 Reflection (PDF) ↗
  - "Write a message", a `<details>` form (name, email, message) **only if a form service is configured; otherwise it is absent**. It has visible labels and inline errors, and the post never waits on an animation.
  - Under the stage: the die caption (the frozen wording from S2; R-01).
  - Footer: name · Iowa State · Back to top · Still · Keys · the "**How the light works**" `<details>`, with this copy verbatim: "The water in the opening scene is a surface solved in advance so that its refraction focuses sunlight into the layout, using the goal-based caustics method (Yue et al., 2014; explained in Matt Ferraro's "Magic Windows"). Your browser refracts light through that surface every frame; nothing is cross-faded. Lithography does the same job with a mask and optics: shape the light, and the pattern prints. The die itself is illustrative, not a chip that was fabricated." Both references are linked.
- **Layout:** the list in cols 1–5. The atoll in **plan view, framed on the south half** (C-10): the reef, the five contact pads (in the middle 60% of the S edge), the bond wires and the DOM lead chips (12px `--t-tag`; `01`–`05` on phone), all within `100vh − 56px` at ≥ 1280×720. The name shows only as a cropped glow at the top.
- **Phone:** the stage is capped at **32vh** above the list, so the first two pad rows are visible on arrival (R-06).
- **Visual:**
  - The frozen S1 exposure (RT frozen, f = 1), with grain only in the open-sea margin.
  - Pads are `--m5-al` at rest. Only the five contact pads, which are interactive, ever turn `--sea` (R-10).
  - Lit-pad glow `0 0 0 1px var(--sea), 0 0 16px rgba(61,157,242,.35)`.
- **Motion:**
  - The camera rises from C4 to C5 over the last 60vh of S6 plus the first 40vh of S7 (a straight rise plus recentring, ending in plan view).
  - When S7's top reaches 70% of the viewport, once: a clockwise **ring wave** runs around all 60 pads from the SE corner. Each pad goes 0.32→1→0.55, 160ms up and 450ms down, with a 12ms stagger, so the sweep takes 720ms.
  - At +620ms the five contact pads take a `--sea` outline (240ms, 70ms stagger) and their bond wires draw out (520ms power3.out). At +980ms the lead chips surface (240ms).
  - Hover or focus on a row, pad, lead or chip lights all four twins in ≤ 120ms, starting the same frame, and fires a 420ms **packet** down that wire.
  - Press 80ms. The power-up never replays.
  - Reduced motion: pads rest lit, with instant colour changes and no pulse.
- **Still:** the atoll as an SVG with all pads lit. The twinning still works.

---

## Design tokens

Final set, after CLIENT-01. **No yellow or amber remains anywhere.** The accent is ocean blue `#3D9DF2`. The caustic light, sand and text are all cool. The only warm hue is `--m1-copper`, a die-layer colour confined to the CPU block (a thin-film oxide colour, not a UI accent).

```css
:root {
  /* ground */
  --floor-0:#0E1312; --floor-1:#161C1A; --floor-2:#222A27; --floor-deep:#0A0E0D;
  --exposure:#9CC8E8; --exposure-amt:0; /* S2 .12 · S3 .08 · S4 .06 · S5 .04 · S6 0 */
  --line:#2E3733; --line-strong:#737E83;
  /* sand + light (3D and stills; --sand-sun also the S5 pool) */
  --sand-sun:#BAC4C2; --sand-shade:#6E7E80; --caustic:#E6F4FF;
  /* text */
  --light:#E8EEF0; --sand:#A7B5BB; --dim:#85939A; --ink:#0A1016;
  /* action only: CTA fill, contact pads, bond-wire pulse, focus ring, hover on tappable sim parts */
  --sea:#3D9DF2; --sea-glow:rgba(61,157,242,.35);
  /* die layers, inside the die only */
  --m1-copper:#D08A62; /* S4 */ --m2-violet:#A597DD; /* S3 */ --m3-oxide:#86C4A8; /* S5 */ --m5-al:#C3C9CC;
  --block:var(--m5-al);
  /* type */
  --f-serif:"Newsreader","Iowan Old Style",Georgia,serif;
  --f-mono:"Martian Mono",ui-monospace,"SF Mono",Menlo,monospace;
  --t-display-xl:clamp(48px,4.4vw,64px); --t-display-l:clamp(34px,4.8vw,72px);
  --t-display-m:clamp(26px,2.8vw,40px);  --t-lede:clamp(19px,1.5vw,22px);
  --t-body:18px; --t-nav:16px; --t-small:15px; --t-tag:12px; --t-data:13px;
  --lh-display:0.92; --lh-body:1.55; --track-display:-0.025em; --track-tag:0.08em;
  /* space */
  --s-1:4px; --s-2:8px; --s-3:12px; --s-4:16px; --s-5:24px; --s-6:32px;
  --s-7:48px; --s-8:64px; --s-9:96px; --s-10:128px; --s-11:192px;
  --gutter:24px; --margin:clamp(16px,4.4vw,64px); --scribe:32px; --bar:56px; --bottombar:56px;
  /* shape */
  --r-0:0; --r-pill:999px;
  --b-hair:1px solid var(--line); --b-ui:1px solid var(--line-strong); --b-block:2px solid var(--block);
  --focus:0 0 0 2px var(--ink); /* outline:3px solid var(--sea); outline-offset:2px; box-shadow:var(--focus) */
  --scrim:rgba(14,19,18,.86); --grain-opacity:.03;
  /* motion */
  --t-tap:80ms; --t-fast:120ms; --t-close:200ms; --t-ui:240ms; --t-read:320ms; --t-travel:900ms;
  --e-out:cubic-bezier(0.16,1,0.3,1); --e-in:cubic-bezier(0.7,0,0.84,0);
  /* camera: power3.inOut (scroll travel), power2.inOut (jumps); sims: steps() + short expo.out settle */
}
```
- **Type roles:** Newsreader (variable opsz 6–72) speaks and names: display, reading text, nav, pill and rails in sentence case (it has no true small caps, and faux small caps are refused). Martian Mono (variable wdth 75–112.5) only measures: data, pads, tags, die-IDs and the project index. Italic Newsreader is reserved for the metaphor lines and the "running in your browser" notes. Body emphasis is italic, never bold.
- **Rules:** no shadows except the lit pad; no glass or blur; no radii except the pill; icons are text glyphs (↗ ≡ ▴). Sea blue covers under 2% of any viewport at rest and never touches bare sand.
- **Key contrasts (computed):**
  - `--light` on floor-0 15.99.
  - `--dim` on floor-2 4.65.
  - `--sea` on floor-0 6.52.
  - Ink on sea 6.65.
  - The bar scrim over full caustic: `--light` 11.12, `--sand` 6.19.
  - Worst residual ground (S2 `#1F292C`): `--dim` 4.70, `--sea` 5.17.
  - The focus ring clears 3:1 on every ground, including sand (ink halo 10.71).

---

## Signature moments

| # | Section | Moment | Proof |
|---|---|---|---|
| SM-1 | S1-hero | **The focus.** Real engineered refraction pulls sunlit caustics into top-metal lettering of his name, the plate exposes to near-black, and the camera rises straight up to the whole die. It melts back on scroll-up. | [`proofs/motion-S1-hero.html`](proofs/motion-S1-hero.html) |
| SM-2 | S7-contact | **The reef lights.** The pad ring powers up clockwise from the UART corner, and the five contact pads light sea blue and send light down their bond wires. The DOM pad list is live from 0%. | [`proofs/motion-S7-contact.html`](proofs/motion-S7-contact.html) |
| — | all | **The look** (the sun print, tokens, type, scribe lanes, die map, cycle table, phone bottom bar). | [`proofs/style-tile.html`](proofs/style-tile.html) |

### Mockup direction
**What each proof shows:**
- **`motion-S1-hero.html`:**
  - The real hero: a Worker solves the engineered surface (exact Snell forward model, FFT Poisson, about 2s), and a 512² mesh refracts the light live.
  - The tiled open sea, the auto-exposure, the fitted framing, the full DOM plate with the project index and the ADV_IND loader on real milestones, and a working Surface Interrupt (✕, Back, `inert`, focus trap).
  - Built-in tests: `framingTest()` (passes at 5 sizes), `contrastTest()` (9.1× / 24.3×) and `precisionTest()` (RG16F 0.9%). Query flags: `?tier=high|low`, `?reduced`, `?hud`.
  - It **solves live** (production bakes offline) and shows the known lagoon/open-sea seam (open question 3).
- **`motion-S7-contact.html`:** the S7 south-half framing in SVG with production timings: the ring wave, the bond-wire draw, the lead chips, the row ↔ pad twin with its packet pulse, email copy, reduced motion, and the phone 32vh cap. **Known leftover:** its caption still reads "The blocks are my projects". The build uses the frozen wording (R-01).
- **`style-tile.html`:** the full art system as one page: the exposed-plate hero still (a 2D sketch, not the solve), tokens with live contrast, type specimens, the canonical glyphs, scribe lanes, the S2 die map with its caption, the unexposed photo frame, the S4 chambers and the correct load-use cycle table, and the phone bottom bar with no overflow at 375.

**If more mockups are wanted, mock these next, in this order:**
1. **The whole page at 375×667 in Still mode**, S1 to the footer, with every slot empty. This is the fallback that ships first and the phone's real first impression.
2. **S3 Hop drawn on the radio block** (desktop, the page-locked pan) plus its flat phone version. This is the riskiest new layout (C-06) and the most technical mechanism.
3. **S4 Bubble Lock with the cycle table** at cycles 4 and 5 of load-use, desktop and phone (the table's horizontal-scroll region).
4. **The Surface Interrupt at 1440** opened from S4 (the proof covers phone only).
5. **S2 with slots empty and then filled** (a placeholder photo and an ocean-story line), to check that the empty state looks intentional.
6. S5 Tide Pool's tie state and S6's sticky echo stage at mid-scrub.

---

## Performance

All GPU figures are **targets and estimates**. Nothing has yet been measured on a phone GPU; the proofs were timed in a Mac browser pane (see open question 4).

**Load order (C-21):**
1. The HTML carries the h1, role, index, pill and bars (the LCP candidates). The poster AVIF is ≤ 60 KB, `fetchpriority=high`, decorative, and never out-paints the plate text.
2. One self-hosted, subset Newsreader roman is preloaded with a `size-adjust` fallback. Martian Mono loads non-blocking.
3. There is no 3D in the critical path. three/webgpu, R3F, GSAP and Lenis come in one deferred chunk after first paint (`requestIdleCallback`, 300ms timeout).
4. The slope field (512² RG16F, about 1 MB, KTX2 or a Float16 `.bin`, `NoColorSpace`, nearest filtering, no premultiply) and the shaders load alongside it. ADV_IND reports real progress.
5. Compile with `renderer.compileAsync()`, yielding between materials (no long task over 50ms while interactive). The tier warm-up runs after that, during ADV_IND.
6. The pill's INP is under 100ms. Opening the Interrupt pauses the loop in the same frame.
7. First-visit budget, gzipped: HTML+CSS ≤ 30 KB, fonts ≤ 60 KB, poster ≤ 60 KB before any JS. The 3D chunk plus data is about 1 MB, loaded after first paint.

**Tiers (C-08):**

| | high (desktop, if the warm-up passes) | low (default on `pointer: coarse`, or if the warm-up fails) |
|---|---|---|
| lagoon mesh | 513² | 257² (slope downsampled) |
| open-sea mesh | 257² | 129² |
| RTs (RGBA16F) | 1280² / 640² | 640² / 320² |
| dispersion | 3 offset samples of one RT | off |
| bloom | 2 mips | 1 mip |
| DPR cap | 2 | 1.5 |

The warm-up renders 12 offscreen frames (2 discarded) during ADV_IND, never mid-focus. If the median exceeds 6ms after subtracting the readback, the device gets the low tier. Use GPU timer queries where available.

**Frame budget:**
- S1 during the focus: ≤ 8ms GPU on both tiers (phone estimated at 3–6ms on Adreno 610 / Mali-G57).
- S2–S7: ≤ 3ms (floor pass over frozen RTs).
- Sims: ≤ 2ms CPU.
- Idle: 0 frames.

**Fixed rules:**
- The runtime solve never ships.
- Metal layout is procedural in the floor shader (sharp at any zoom, C-07). RTs are `RenderTarget` from `three/webgpu`.
- Half-float RTs fall back to RGBA8 × 1/8.
- The area ratio has `+1e-8`, and shaders use highp.

**Phone cuts, in order:**
1. The low tier.
2. Caustic updates at 30 Hz.
3. The shorter pin and scrub (already 100/110vh).
4. Below 45 fps for 2s in S1: stop the caustic passes and **freeze at the AVIF focused still, with no cross-fade**.

**Still path:** no WebGPU and no WebGL2, or `saveData`, or the user's toggle, gives no canvas. `deviceMemory ≤ 2` is only a hint (Chromium) that pre-selects Still with "Turn on 3D".

**Success bars:** Lighthouse ≥ 90 for performance and accessibility on the Still path. 60 fps on a mid-range laptop. No jank on a mid-range phone, which must be measured on a real device before the 3D ships.

---

## Accessibility

- **Everything meaningful is DOM text.** The canvas and stage chips are `aria-hidden`, and S1 has a visually hidden description. Section text is visible without JS (reveals are gated behind a `js` class). No claim is carried only by an animation or a sim.
- **Landmarks and headings:** `header` (wordmark, label, pill) · `nav` "Sections" (7 links) · `main` S1 h1 → S2–S7 h2s → h3s for the sims and twins · `footer`. The dialog has its own h2 and h3.
- **Keyboard path:** Skip link → wordmark → **Resume** (tab 3) → Contact → sections nav → content in visual order. Composite widgets (chip grid, Tide Pool grid, scenario radios) are one tab stop each, with arrows inside. Global keys: `R` summary (switchable), `?` keys, `Esc` closes. Only the modal traps focus.
- **Focus:** a 3px `--sea` outline, 2px offset, plus a 2px `--ink` halo. It is never animated and never obscured (`scroll-padding-top: 72px`, `scroll-padding-bottom: 56px + safe area`). After a jump focus moves to the h2, and after the Interrupt it returns to the opener.
- **Contrast:** body ≥ 4.5:1 and large ≥ 3:1, measured against the **worst frame** of the backdrop. Text never sits on live caustics (it uses the ink plate or the scrim). Sim states never rely on colour alone (hatch plus ✕, "bubble", "flushed", "lost", "→ wave").
- **Touch:** every target is ≥ 44×44 with ≥ 8px gaps. No hover-only content. No custom gestures. The only touch-captured area is the Tide Pool pad, with scrollable gutters. Every drag has a single-pointer alternative (WCAG 2.5.7).
- **Reduced motion**, watched live through a `change` listener (Still forces the same or more):
  - Native scroll.
  - S1 is the final focused still.
  - No camera travel or page-locked pan (flat-DOM).
  - Jumps are instant cuts.
  - Reveals are simply shown.
  - Sims don't autoplay and cut per step.
  - S6 is a static SVG, and S7 pads rest lit.
  - The Interrupt opens and closes instantly.
  - The only fade kept is canvas over poster (200ms). The information is identical.
- **Pause/Stop/Hide:** the always-visible Still toggle stops all auto-motion, and each autoplaying sim has its own Pause. **Flashing:** nothing exceeds 3 per second.
- **Live regions (polite):** only user-triggered or meaningful events (the map update and its instant, bubble/forward/flush, the classification or tie). Autoplay hops are never announced.
- **No scroll trap:** one short pin and one scrub, reversible, with no direction change. The wheel over a sim scrolls the page. The nav and pill are always there.

---

## Decisions log

### Critique findings (05-critique.md): all 22 accepted
| ID | Owner | Resolution |
|---|---|---|
| C-01 | ux | The 4-line project index is in the S1 plate from first paint. The pin is cut 180→120vh desktop and 130→100vh phone. S2 is in by P 0.70. On phone the name shows once at load. |
| C-02 | motion | The near framing is fitted by binary search to the letter bbox plus 6% inside the measured free region. `framingTest()` passes at 1280×720, 1440×900, 1920×1080, 375×667 and 390×844. |
| C-03 | art | Target luminance is rebalanced: fill **0.20**, not the suggested 0.12, because the solver measured 0.12 leaving the core grey. Acceptance is ≥ 3× fill and ≥ 8× core, and it is met. |
| C-04 | art | One canonical 8×12-track glyph set (straps, jogs, vias at free ends) as JSON, feeding the solve, the stills and the SVGs. |
| C-05 | motion | The floor is tiled to the frame edges with a periodic open-sea tile and a 3×3 fold. The opening is pale sand (ambient 0.35→0.02). |
| C-06 | ux | Sims are drawn onto their blocks as CanvasTextures with a page-locked pan and per-block framings. Only S6 keeps a side column. Flat-DOM on phone and in reduced/Still, plus a drift safety valve. |
| C-07 | motion | Metal layout is procedural in the floor shader (sharp at any zoom). The light stays soft on purpose. |
| C-08 | motion | The low tier is the default on coarse pointers, with a warm-up during ADV_IND, one-RT dispersion and `+1e-8`. |
| C-09 | motion | Ship the slope field as RG16F, never a PNG height map (measured 0.9% vs 83.9%). |
| C-10 | motion | S7 is framed on the south half, with DOM lead chips at 12px and a 32vh phone stage. |
| C-11 | motion | The Surface Interrupt has ✕, "Back to where you were", `inert`, a focus trap and `pushState`, the pill hidden while open, and Resume as the only sea fill. |
| C-12 | ux | Hop is a correct connection model: `LL_CHANNEL_MAP_IND` with an instant, a minimum of 2 channels, `lastUnmapped`, the unmapped→mapped log, and hop fixed per connection. |
| C-13 | ux | One pipeline model drives the chambers and the table. The assumptions are stated on the stage. The load-use forward happens in cycle 5. |
| C-14 | motion | S6 uses a forward PING cone, echoes only on hits, an IR ray and a bump tick. No 360° rings, no servo claim. |
| C-15 | art | Photomask grammar (scribe lanes, keys, die-IDs, reticle-edge rails). Progressive exposure from 12% to 0. Uppercase mono only on pads, tags and data. Nav and rails use **sentence-case Newsreader instead of the suggested small caps** (no true small caps exist in the font). |
| C-16 | art | The phone bottom bar is built in the tile. The top pill is hidden under 768. There is no horizontal overflow at 375. |
| C-17 | creative-director | Die caption "An illustrative die. The blocks are projects I worked on; it is not a fabricated chip." in S2, the S3–S5 rails and S7, plus the footer. The S7 line now ends "These are how you reach me." |
| C-18 | creative-director | One frozen role line everywhere. `[SLOT: grad-term]` goes on the plate and in the Interrupt; it is to be asked of Akash, never inferred, and omitted while empty. |
| C-19 | motion | A collision is a hollow `lost` mark. Hatch plus ✕ is only for channels in the bad map. |
| C-20 | motion | (1) The phone fallback freezes at the still with no cross-fade. (2) The residual goes to 0 by P 0.9 and the loop idles. (3) Deterministic RT render on hash load and after context loss. (4) `deviceMemory` is a hint only. (5) `RenderTarget` from `three/webgpu`. |
| C-21 | motion | Numbered load-order rules (above). |
| C-22 | ux | The Tide Pool tie rule (> 2 RAMs, or "Too close to call"). The gap is shown as a count and ties are announced. |
| CLIENT-01 | art + motion + ux | Amber becomes ocean blue `#3D9DF2`. Caustic, sand, text and ink are cooled. The accent still marks interactive elements only. Confirmed by the client. No yellow or amber remains. |

### Leftover contradictions resolved in this plan
| ID | Conflict | Decision | Rule applied |
|---|---|---|---|
| R-01 | 03-motion SM-2 and the S7 proof caption say "The blocks are my projects". | The frozen wording "projects I worked on" is used everywhere (the RISC-V RTL was his partner's). | brief (honesty) |
| R-02 | 03 and 04 place the S4 role text as a caption; 02 puts it under the h2 at body size. | It goes under the h2 at body size: "Two-person team. My partner led the RTL. I reviewed the design, debugged hazards like these, and wrote the docs." | brief + usability |
| R-03 | 03: a tap issues `LL_CHANNEL_MAP_IND` at once; 02: taps stage a pending map, then "Send map update". | Stage, then Send (one update in flight, explicit). The motion timings apply to the pending outline and the instant. | usability |
| R-04 | 03: the hop slider changes the next hop immediately; 02: it starts a new connection. | A new connection (`CONNECT_IND`, reset). Hop is fixed per connection in BLE. | brief ("zero wrong terms") |
| R-05 | 02's art-handoff row: the plate holds only h1, role and ADV_IND, and the phone plate is ~45%. | The C-01 plate (with the index), and the phone plate at ~58% below a ~38% lettering zone, as in the proof. | usability |
| R-06 | S7 phone stage: 42vh (02 wireframe) vs 32vh cap (03, C-10). | 32vh, so two pad rows are visible on arrival (measured). | usability |
| R-07 | Phone breakpoint: 02 uses < 768; 03's S7 stage cap uses < 820. | The global layout switches at 768. The S7 32vh cap applies below 820 as a section rule, because it only affects stage height. | usability |
| R-08 | A bubble is a hollow circle (04) vs a labelled cell (02). | A labelled "bubble" cell containing the hollow circle. | accessibility |
| R-09 | 04: the production bake is 1024² (~13 texels/track); 03: ship a 512² RG16F slope (1 MB). | **512²** (6.5 texels/track, above the ~6 floor; precision measured). 1024² (about 4 MB) only if device testing shows the desktop name soft, and then for the high tier only. | performance |
| R-10 | S7 pads: 04 says all pads power up to 30% sea; 03 has a ring wave in aluminium, then sea only on the 5 contact pads. | 03's version. Non-contact pads are not interactive, so they must not turn blue (sea discipline). | usability (the colour carries meaning) |
| R-11 | S5 winner: 04 uses a `--light` label; 03 uses an oxide bar and weight 600. | Both: the oxide bar at 100%, the `--light` label at 600, plus the text "→ wave". | accessibility |

### Major choices made during the team's discussion
| ID | Decision | By |
|---|---|---|
| D-01 | The client picked Concept B over A (Abyssal Stack) and C (Advertising on 37). The best of A and C was folded in: the pokeable pipeline, the live CSA#1, the ADV_IND loader. The archive is in `01-concept-archive.md`. | client |
| D-02 | The innovation challenge (10 points) was answered in the `01-concept.md` challenge log. It brought in engineered caustics, the atoll with contact on the I/O pads, CyBot off-die, and the Surface Interrupt. | CD + innovation-designer |
| D-03 | A **split pill** (`Resume ↗` as a real link, `Contact` for the Interrupt). The guardrail reads "always visible, plainly labelled", not "one target". | CD, ux request |
| D-04 | The contact form is secondary and absent when no service is configured. Email (mailto plus Copy) is the main route. | CD, ux request |
| D-05 | Floorplan: Radio NW, CPU centre, Memory E, CyBot off-die SE via the UART pad, contact pads on the S reef. The S2 die links every block. | ux, approved by CD |
| D-06 | Scroll-back melts the name. A 3% residual swell is masked off the traces. **One straight vertical rise**, with no orbits or swoops anywhere on the site. | motion, approved by CD |
| D-07 | The **sun print**: sunlit plate → exposed plate by conservation plus camera stop-down. The accent marks interactive elements only. Die colours stay inside the die. Newsreader + Martian Mono. | art, approved by CD |
| D-08 | The S2 copy (display line plus plain sub-line) and the "How the light works" footer copy. | CD |
| D-09 | The wordmark is "Akash Gojuru". "Sea of Gates" is at most a `<title>` suffix, pending the client. Nav uses project names first, with block names as eyebrows. | CD, ux questions |
| D-10 | Honesty lines: the S4 role line, S5 "No accuracy numbers. Try it on your own drawings.", S6 "Illustrative course, not a recording.", "running in your browser" on every sim, and "in progress" on every senior-design mention. | ux + CD |
| D-11 | Accepted with conditions: C-01 (the index stays small and clear of the focus zone) and C-06 (top-down framings only, twins and labels kept, an illustrative-die caption in the rails). | CD |

---

## Open questions for the client

**Approved by the client on 2026-09-23. Their answers:**

| # | Answer | What the build does |
|---|---|---|
| 1 | The contact form is important. | The form ships. It uses Formspree, a hosted endpoint that needs no backend, so it works on GitHub Pages. Email, LinkedIn and GitHub stay as the fallback. |
| 2 | No. | The `<title>` is "Akash Gojuru" and does not include "Sea of Gates". |
| 3 | Yes. | Apply the 2-unit margin bake so the lagoon seam falls outside the frame. |
| 4 | Yes. Akash will test on real phones. | Still mode ships first. The 3D turns on by default only after his Android and iPhone measurements. |
| 5 | Akash supplies these through the client. | The slots stay marked. The client drops in the photos, ocean story, graduation term and project media that Akash approves. Any web image must be free to use (for example Unsplash or Pexels) and approved by Akash, with nothing scraped. |
| 6 | Yes. | The pinned Resume button opens `RESUME_IBM_1.pdf`. |

The original questions follow for the record.

1. **Contact form service.** GitHub Pages has no backend. Should we use Formspree (or similar), or ship without the form? Without a service, the "Write a message" disclosure is simply absent; email, LinkedIn and GitHub still work.
2. **"Sea of Gates"** as a `<title>` suffix ("Akash Gojuru · Sea of Gates")? It is a real ASIC term (gate-array architecture) but names a design style, not his work. The default is no.
3. **The seam where the reef meets the open sea.** In the S1 proof a faint square line shows where the still lagoon tile meets the moving open-sea tile. The proposed fix is to bake a 2-unit margin so the edge falls outside the frame (a slightly larger bake). Do you approve the fix, or accept the seam?
4. **No real-phone measurements yet.** All phone GPU numbers are estimates. Can Akash test the build on a real mid-range Android phone (and an iPhone) before the 3D is switched on by default? Until then the plan ships Still mode first.
5. **Personal content that is still empty.** The site launches finished without these, but only Akash can fill them:
   - `[SLOT: ocean-story]`, one line on why the ocean
   - `[SLOT: photo-akash]` (4:5)
   - `[SLOT: photo-ocean]` (3:2; it has no placement yet, so it goes in S2 under the portrait only if supplied)
   - `[SLOT: grad-term]`
   - `[SLOT: project-media-linklayer | riscv (waveform/VCD) | wisard | cybot (robot photo)]`
   - `[SLOT: cybot-sensing-detail]` (how the PING sensor was aimed)
6. **Resume file.** content.md names `RESUME_IBM_1.pdf`, which looks tailored to one employer. Please confirm this is the version the pinned button should open, or supply the current general resume.

---

## Build order

Stack: Vite + React + TypeScript, React Three Fiber on three.js `WebGPURenderer` (WebGL2 fallback, shaders in TSL), GSAP ScrollTrigger, Lenis. Static hosting (GitHub Pages). **The recruiter fast path and the no-WebGL Still site ship first**; every later step is additive and can be switched off.

1. **Foundation.** Repo scaffold, and a `content.ts` generated only from content.md, with slots as typed empty values that render nothing. Extract `glyphs.json` from 04-art. Tokens as CSS. Self-hosted, subset fonts. The resume and reflection PDFs in `/public`.
2. **The fast path.** The header and phone bottom bar, the split pill (`Resume` as a real link), the Surface Interrupt (dialog, `inert`, trap, `pushState`, restore), the sections nav and minimap SVG, the skip link, the keys popover, and hash URLs.
   - *Gate:* the 30-second test passes with real people on this alone. Resume is at tab 3 and one click. `scrollWidth === innerWidth` at 375.
3. **The Still site, S1–S7 in the DOM.** Every section's text, the S1 plate with the index, the S2 die map as SVG from `glyphs.json`, the S7 pad list plus atoll SVG, the footer "How the light works", scribe lanes, progressive exposure grounds and the unexposed frames. The S1 still is temporarily an SVG render of the focused die, until step 5.
   - *Gate:* Lighthouse ≥ 90 for performance and accessibility; keyboard and screen-reader pass; contrast checks.
   - **This is shippable**, and it is also the permanent no-WebGL, reduced-motion and phone-fallback path.
4. **The three sims as flat DOM** (Hop, Bubble Lock, Tide Pool) and the S6 static SVG. Pure JS models with unit tests:
   - CSA#1 with remap, `LL_CHANNEL_MAP_IND` instants and the 2-channel minimum;
   - the 5-stage model asserting 0/2, 1/2 and 2-flushed;
   - WiSARD with the tie rule.
   - DOM twins, live regions and keyboard models.
   - *Gate:* a chip engineer reviews the terms and the cycle table.
5. **The offline bake.** Port the proof's Worker solver to a Node/CLI step: 512² RG16F slope field (with the margin from open question 3), the AVIF stills (S1 focused plate, a plan still for each block, S6), and the poster ≤ 60 KB. Swap the step-3 S1 still for the baked one.
6. **The scroll engine.** Lenis plus ScrollTrigger on one clock, the live reduced-motion listener, the Still toggle, jumps with focus moves, and the S6 scrub on the SVG stage.
7. **The 3D hero (SM-1)** in a lazy chunk after first paint: `compileAsync`, the ADV_IND loader on real milestones, the tier warm-up, the lagoon and open-sea passes, the floor shader (fold, sun blur, one-RT dispersion, procedural metal), auto-exposure, the fitted framing plus lens shift, freezing at P ≥ 0.9, and render on demand.
   - *Gate:* measured on a real mid-range Android and an iPhone (open question 4). The phone cuts are wired.
8. **The camera path and S7 (SM-2).** Stops C0–C5, frozen-RT travel, the south-half S7 framing, the InstancedMesh pads, the Line2 bond wires, DOM lead chips, the ring wave and packet twins, and a deterministic RT render on hash load and context loss.
9. **Sims on blocks (C-06).** CanvasTexture upload on change, the page-locked pan, the DOM input layer and the drift safety valve (desktop fine pointers only).
10. **Polish and verify.** Grain, bloom and dispersion on the high tier only. Full reduced-motion, Still and hash-load regression. Performance traces (LCP < 2.5s, INP on the pill < 100ms, 0 idle frames). Then a **post-build check by `design-critic` against this plan**.

Design ends here. Implementation starts only after the client approves this plan, by the user or by `frontend-developer` / `engineering-webgl-creative-engineer`.
