# 03 — Motion

Owner: motion-designer. Inputs: [`../vision.md`](../vision.md), [`../content.md`](../content.md), [`00-brief.md`](00-brief.md), [`01-concept.md`](01-concept.md) (Concept B, **Caustic Lithography**, with a frozen beat sheet), [`01b-innovation.md`](01b-innovation.md), [`02-ux.md`](02-ux.md), [`04-art.md`](04-art.md), [`05-critique.md`](05-critique.md).
Frozen section IDs: **S1-hero · S2-about · S3-linklayer · S4-riscv · S5-wisard · S6-cybot · S7-contact**.
Revision round 1 is applied throughout this file and logged in **Revisions** at the end. The palette is the client's **ocean blue** (CLIENT-01): the accent `--sea #3D9DF2` is used only on interactive elements, the caustic light is cool white `#E6F4FF`, and the sand under water is grey-cyan (`#BAC4C2` / `#6E7E80`). No amber or yellow remains.

Proofs (open them in a browser; each is self-contained):
- [`proofs/motion-S1-hero.html`](proofs/motion-S1-hero.html): **the focus.** It uses real engineered caustics. The surface is solved in a Worker with a forward model that uses exact Snell refraction. On screen, a 512² mesh refracts sunlight and caustic intensity is the area ratio. The floor is tiled: the die tile is the lagoon, and a periodic open-sea caustic surrounds it. The DOM plate carries h1, role, the 4-line project index and ADV_IND. The chrome matches 02-ux (a top bar on desktop, a bottom bar on phone), and the Surface Interrupt has ✕, Back, `inert`, a focus trap and history support. The file also has built-in acceptance tests: framing (C-02), contrast (C-03) and slope precision (C-09). Open **proof controls ▾** → **run tests**, or call `__proof.framingTest()`, `__proof.contrastTest()` or `__proof.precisionTest()`. `?tier=high|low`, `?reduced` and `?hud` force states.
- [`proofs/motion-S7-contact.html`](proofs/motion-S7-contact.html): **the reef lights.** It is framed on the south half of the die. The pad ring powers up, the bond wires carry a pulse, the numbered DOM pad list is twinned with the pads, the lead labels are DOM chips at 12px, and the email has a copy button. It also demonstrates reduced motion.

---

## Research

| Source | What I took | What I avoided |
|---|---|---|
| [Evan Wallace, WebGL Water](https://madebyevan.com/webgl-water/) (+ [WebGPU port](https://www.webgpu.com/showcase/webgpu-water-simulation-porting-webgl-history/)) | Caustics as a **refracted mesh**. Each vertex refracts a sun ray to the floor, and the fragment shader takes intensity = source area ÷ refracted area via `dFdx/dFdy`, with additive blending. The S1 proof runs exactly this. | Treating caustics as a scrolling texture overlay (the #5 overdone item in 01b). |
| [Matt Ferraro, "Magic Windows"](https://mattferraro.dev/posts/caustics-engineering) · Yue et al. 2014, *Poisson-based continuous surface generation for goal-based caustics* | Design the surface so that its caustic *is* a chosen image: transport map → normals → Poisson solve for height. The proof uses a compact variant: a Newton step on the Monge–Ampère form in log space, pulled back to the source point and solved coarse-to-fine by FFT (see SM-1). | Crossfading or morphing into a logo, which fails guardrail 4. |
| [three.js WebGPU caustics example](https://threejs.org/examples/webgpu_caustics.html) · [Codrops, *Volatile Nexus* (Aug 2026)](https://tympanus.net/codrops/2026/08/31/volatile-nexus-tinkering-with-glass-caustics-cubes-and-sound-in-three-js/) | The caustic pass can live in TSL on WebGPU with a WebGL2 fallback. | Colourful glass-toy caustics as the whole show. Dispersion stays faint here (under 8% chroma, per 04-art). |
| [GSAP + Lenis integration (GreenSock pen)](https://codepen.io/GreenSock/pen/jOKvOpR) · [Lenis repo](https://github.com/darkroomengineering/lenis) · [Codrops, infinite scroll with GSAP + Lenis (May 2026)](https://tympanus.net/codrops/2026/05/28/the-never-ending-story-building-a-seamless-infinite-scroll-experience-with-gsap-lenis/) | One clock: `lenis.on('scroll', ScrollTrigger.update)`, `gsap.ticker.add(t => lenis.raf(t*1000))`, `lagSmoothing(0)`. Touch devices keep native scroll. | Scroll-jacking, snapping, and scroll-velocity skew. |
| [Utsubo: best three.js sites 2026](https://www.utsubo.com/blog/best-threejs-websites-2026) · [Utsubo storytelling guide](https://www.utsubo.com/blog/immersive-storytelling-websites-guide) · [Pendragon Cycle (SOTD Jan 2026)](https://www.webgpu.com/showcase/pendragon-cycle-webgl-cinematic-storytelling/) | Winners spend the whole budget on one idea, with weighted, deliberate travel. | The formula of a spline camera plus a particle burst at every checkpoint. |
| [hontran.dev: award sites 2026, by a juror](https://www.hontran.dev/blog/best-award-winning-websites-2026) · [hontran.dev: WebGL examples](https://www.hontran.dev/blog/webgl-website-examples) | Jurors now mark down "animation for its own sake" and mid-range-device jank, and they score reduced-motion fallbacks. | Cursor blobs, magnetic buttons, split-letter reveals, preloader counters. |
| [WCAG 2.2: 2.3.1](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html) · [2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) · [2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) | Auto-moving content needs a pause, motion from interaction can be turned off, and nothing flashes more than three times a second. | — |
| Bluetooth Core Spec v5.x, Vol 6 Part B §4.5.8 (CSA#1) and §5.1.2 (Channel Map Update) | A new channel map is sent in `LL_CHANNEL_MAP_IND` and takes effect at a future connection-event **instant**. The spec's guidance is that the central allows at least 6 events. CSA#1 needs at least 2 used channels and hops from `lastUnmappedChannel`. | Remapping a live connection "instantly" on a tap (C-12). |

**What makes scroll choreography feel cheap (and is banned here):** elements sliding up 40px on every section; staggered letters; parallax layers at unexplained speeds; the camera moving while you read; entrances that replay; scrubs whose meaning depends on scroll speed; one easing for everything.

---

## Motion principles

1. **Light develops; nothing slides.** Content appears the way a print develops. Only UI sheets (the Surface Interrupt) translate. Headings and blocks change opacity or brightness, never position.
2. **Scroll is the master clock, and the camera moves only between sections.** It travels in UX's travel windows and otherwise holds a plan view (or pans 1:1 with the page, so it moves with the page like paper). The two scrubs are the S1 focus and the S6 echo sequence.
3. **Every move is a mechanism.** If a motion isn't refraction, a clock edge, a packet, a flush, a write to RAM or an echo, it's cut. Easing follows physics: light settles (expo out), the camera has mass (power3.inOut), and clocked sims step on the edge.
4. **Two spectacles; everything else is under 240ms.** Big motion is spent only on S1 (the focus) and S7 (the reef lights).
5. **Never make them wait.** Name, role, **what he built** (the 4-line index) and the fast path are HTML at first paint. Interactive feedback lands within **100ms**. No animation gates any content or link.

### Spectacle budget
| Spend | Where | Why this and not something else |
|---|---|---|
| **Signature 1: the focus** (the site's one medium-cost GPU effect) | S1-hero | The idea of the site in one shot. The light *is* lithography, and it's physically true. |
| **Signature 2: the reef lights** (cheap: pads plus line segments) | S7-contact | The resolve, and the primary action. The spectacle lands where the user acts. |
| Pokeable sim motion (click-driven, drawn onto the blocks) | S3, S4, S5 | Each sim's motion *is* its mechanism: hop, bubble, write. |
| One scrubbed sequence | S6 | Time-of-flight is naturally a scrub. |
| **Cut** | everywhere | Cursor follower, magnetic buttons, split-letter reveals, parallax layers, particle, bubble and plankton kits, section wipes, orbits and swoops, scroll-velocity skew, preloader %, noise-displacement hovers, ambient "breathing" on UI, 360° sonar rings. |

---

## Signature moments

### SM-1 · S1-hero · The focus: "the light on the sand is drawing something"
**What happens.** Sunlight through moving water prints caustics on grey-cyan sand across the **whole frame** (C-05). On the first scroll the water inside the reef relaxes toward an **engineered heightfield**, and the same refraction pulls the light into Manhattan top-metal letterforms spelling **AKASH / GOJURU**. The glyphs come from art-director's canonical 8×12 set, with vias at free stroke ends, a double seal ring, the pad ring (the reef), straps and dense metal fill. The camera starts tilted 28° and reaches plan view *as* the image focuses, then rises straight up to show the whole die. Scrolling back melts it into shimmer, because the whole effect is a function of scroll.
**The atoll, literally.** The die tile is the lagoon and stills first. The open sea outside the reef (a periodic caustic tile repeated to the frame edges) calms more slowly and comes to rest over P 0.9–1.0. The camera **stops down** as the light focuses (auto-exposure 1.6 → 0.42), exactly as a camera adapts to its brightest light. The ambient light falls from 0.35 (sunlit sand) to 0.02 (art-director). The result: the letters clip to cool white, the core goes near-black, and the open sea reads as dim sand around a dark plate. The energy is conserved: mean I = 1 in every tile.
**Why it's memorable.** Caustics are the most overused underwater effect, and here the cliché becomes the instrument, with true optics. A non-engineer retells it in one sentence, and an engineer who asks "how?" gets goal-based caustic design, a Poisson solve and Snell refraction.

**Technique (what the proof does, and what production does):**
| Stage | Proof ([`motion-S1-hero.html`](proofs/motion-S1-hero.html)) | Production |
|---|---|---|
| Target | A 512² tile. The die sits 5% in from the tile edge with the seal ring on the die edge, and 15 pads per side at 13px. Letters use the canonical JSON at **6.5 texels per track** (GOJURU = 377 texels, about 22px clear of the reef). Target luminance (C-03, agreed with art): traces 1.0, pads 0.35, seal 0.30, straps 0.20, fill **0.20** (7px squares, 24px pitch, 20px keep-out), core 0.02. The margin outside the die is 0.85 × the die's own mean, so it lands at I ≈ 1 and meets the open sea without a step. | The same target from the same JSON (`glyphs.json` feeds the solve, the stills and the S2/S7 SVG). |
| Solve | In a Worker, the forward model is **exact Snell** refraction of a zenith sun, splatted to the floor. Each update solves ∇²δh = step·[log I(y(x)) − log T(y(x))] by periodic FFT, pulled back to the source point, on a schedule of σ = 8→4→2→1.5 texels (19 iterations; stopping at 1.5 avoids sub-texel folds). **Measured in the browser pane on this Mac: 1.9–2.0 s, mean \|T−I\| 1.12 → 0.46.** | **Baked offline** by the same solver and shipped as the **slope field in RG16F** (512², 1 MB raw, KTX2 or a Float16 `.bin`). It is uploaded with `NoColorSpace`, `premultiplyAlpha:false` and nearest filtering. No PNG height map (C-09). Nothing is solved at runtime. |
| Runtime pass | Two meshes per update. The **lagoon** is 513² vertices covering the die tile edge to edge, with slope = `f·engSlope + swell·(lagoonWave + resid·calm)`. The **open sea** is 257² vertices of swell only, periodic over the tile (k = π·(m,n)). Each goes into its own RGBA16F RT covering the tile plus a 0.25 margin (1280² and 640²). The fragment computes `I = a0/(max(a1, a0·0.015) + 1e-8)` (C-08). | TSL `Fn`s for WebGPU; the same node graph compiles to WebGL2. RTs are `RenderTarget` from `three/webgpu`, not drei's `useFBO` (C-20). |
| Floor | For each floor point, sum the light every neighbouring source tile throws there (a 3×3 fold, so light crossing tile edges is kept). The **finite sun** (0.53°) blurs the lagoon's caustic by D·0.0093 (a 7-tap disc). Dispersion is **3 offset samples of the one RT** along the light gradient, scaled by f, desktop only (C-08). Exposure uses a toe. **The metal layout (m1/m2/m3, block outlines) is procedural in the floor shader**, antialiased with `fwidth` and faded to coverage when stripes go sub-pixel, so it stays sharp at any zoom (C-07). The lit name masks the lower layers, because top metal sits above them. | Same. The sun blur becomes one separable blur pass on the lagoon RT (at RT resolution, once per caustic update) instead of per-pixel taps. |
| Composition (C-02) | The free region is **measured from the real DOM**: the top bar on desktop or the bottom bar on phone, plus the plate's pinned rect. The camera distance is **fit by binary search** so that the projected **letter bbox plus a 6% margin** stays inside the region at tilt 0° and 14°, and the die bbox plus 4% fits at the rise end. A lens shift (`setViewOffset`) puts the die centre in the region, so the rise stays a pure vertical move. The shift eases (k = 6/s) if the plate changes size, for example when ADV_IND collapses. | Same; re-measured on resize and `document.fonts.ready`. |

**Framing test (C-02), run in the proof at five sizes, all PASS** (letters checked at P 0.30, 0.45, 0.50, 0.55; die checked at P 1):
| viewport | free region | letter bbox at hold (px) | die bbox at P 1 (px) |
|---|---|---|---|
| 1280×720 | right of plate [552,56]–[1280,720] | [605,238]–[1226,537] | [610,82]–[1221,693] |
| 1440×900 | right of plate [552,56]–[1440,900] | [617,295]–[1374,660] | [607,89]–[1384,866] |
| 1920×1080 | right of plate [552,56]–[1920,1080] | [657,288]–[1814,847] | [764,96]–[1707,1039] |
| 375×667 | above plate [0,0]–[375,256] | [25,49]–[349,206] | [69,10]–[305,245] |
| 390×844 | above plate [0,0]–[390,433] | [25,134]–[364,298] | [15,37]–[374,395] |
`scrollWidth === innerWidth` at 375 and 390, so there is no horizontal overflow.

**Contrast test (C-03), measured on the lagoon RT at f = 1:** letters I 5.16, fill 0.57, core 0.21, so **L/F 9.1 (≥ 3 ✓) and L/C 24.3 (≥ 8 ✓)**. After the tone map it is 7.7 and 24.5.
**Slope precision (C-09), display-scale comparison with the f32 solve** (4×4-averaged, share of pixels off by more than 10%): **RG16F slope 0.9%**, 16-bit height packed hi/lo into RGBA8 1.8%, **16-bit PNG decoded to 8 bits 83.9%**. The 8-bit case turns the name to noise; switch "slope: h8" in the proof to see it.

**Timing (S1 pin = 120vh desktop / 100vh phone, per C-01 and ux-designer; P = progress 0→1 over the pin; S1 = 160vh desktop / 150vh phone, so S2's headline is in view by P 0.70):**
| element | trigger | property | from → to | duration / scroll range | easing | reduced motion |
|---|---|---|---|---|---|---|
| swell (both tiles) | load | time-driven, 7 periodic waves | — | continuous; speed × (0.35 + 0.65·(1−f)) × stop(P) | linear (physical) | frozen; no swell |
| focus `f` | scroll | lagoon surface = lerp(swell, engineered) | 0 → 1 | P 0.05 → 0.45 | power3.inOut | f = 1 from first paint (the final frame as a still) |
| lagoon swell amplitude | scroll | (1−f)^1.6 | 1 → 0 | P 0.05 → 0.45 | follows f | 0 |
| open-sea swell amplitude | scroll | (1−f)^0.7 × stop(P) | 1 → 0 | P 0.05 → 1.0 (**stops** over P 0.9–1.0) | follows f; smoothstep stop | 0 |
| residual swell | scroll | 3% of the swell, **masked off the traces** so corners never bend (creative-director) | 0 → 0.03 → 0 | up with f, **ramps to 0 over P 0.7–0.9** (C-20) | linear | 0 |
| exposure (auto) | follows f | stops down | 1.6 → 0.42 | P 0.05 → 0.45 | smoothstep(f) | 0.42 |
| ambient | follows f | sunlit → exposed plate | 0.35 → 0.02 | P 0.05 → 0.45 | linear in f | 0.02 |
| camera tilt | scroll | pitch | 28° → 0° | P 0.05 → 0.45 | power3.inOut | 0° always |
| hold | — | the read; nothing moves but the residual | — | P 0.45 → 0.55 | — | — |
| camera rise | scroll | height, straight up (plan view) | fit(letters) → fit(die) | P 0.55 → 1.0 | power3.inOut | plan view of the whole die from t = 0 |
| metal layers | scroll | procedural m1/m2/m3 tint, under the lit name | 0 → 35% | P 0.72 → 1.0 | linear on scroll | 35% static |
| bloom | follows f | mip-glow gain | 0 → 1 | P 0.05 → 0.45 | follows f | 1 |
| caustic RTs | P ≥ 0.9 | **frozen**: the passes stop and the loop idles at 0 frames when the scroll is still | — | — | — | frozen from t = 0 |
| if the surface lands mid-scroll | ready | f eases to the scroll target | current → target | ~250ms (k = 10/s) | exponential | instant |
| DOM plate (h1, role, index, ADV_IND) | — | **never animates**. It is pinned until S1's end passes (about P 0.5), then scrolls away with S2 coming in. | — | — | — | same |

### SM-2 · S7-contact · The reef lights: "every chip talks to the world through its pads. These are how you reach me."
**What happens.** The camera rises (mirroring S1) to a plan view, **framed on the south half of the die** (C-10). That frame holds the south reef, the five contact pads, their bond wires and the labelled package leads, all inside `100vh − 56px` at 1280×720 and up. The name shows only as a cropped glow at the top of the frame. When S7's top reaches 70% of the viewport, a wave of light runs **clockwise around all 60 pads from the SE corner** (where the UART pad tethers CyBot), like an I/O ring at power-on. It ends on the south reef, where the five contact pads take on a `--sea` outline and their **bond wires draw out** to the leads. There, the **DOM lead chips** (12px `--t-label`; `01`–`05` on phone) surface. Hovering or focusing a pad row (or a pad or lead) then fires a **packet of light down that wire** in 420ms, and the row, pad, lead and chip light in `--sea` with the glow `rgba(61,157,242,.35)`.
**Why it's memorable.** The user's action and the metaphor coincide: a pad ring really is where a chip talks to the world. Light arrives in S1 and leaves here.
**Technique.** In production the die is the frozen S1 RT (rendered once, deterministically, if absent; see Performance). Pads are one `InstancedMesh` with a per-instance `aLight` tweened through a typed array. Wires are `Line2` segments with a dash-offset pulse, and chips are DOM. The proof uses SVG with the same timings. Below the stage sits the caption "An illustrative die. The blocks are my projects; it is not a fabricated chip." (creative-director, C-17).
**Timing:**
| element | trigger | property | from → to | duration / scroll range | easing | reduced motion |
|---|---|---|---|---|---|---|
| DOM pad list (numbered 01–05, Resume filled `--sea`) | S7 at 0% | — | **visible and clickable at 0%** | — | — | same |
| ring wave | S7 top at 70% of the viewport, `once` | pad light | 0.32 → 1 → 0.55 | 160ms up + 450ms down per pad, 12ms stagger × 60 = a 720ms sweep | power2.out / power2.inOut | skipped; pads rest at 0.55 |
| contact pads | at +620ms | `--sea` outline | 0 → 0.9 | 240ms, 70ms stagger | e-out | shown at once |
| bond wires | at +620ms | stroke draw (pad → lead) | 0 → length | 520ms, 70ms stagger | power3.out | drawn at once |
| lead chips (DOM) | at +980ms | opacity, y | 0 → 1, 6px → 0 | 240ms, 70ms stagger | power2.out | shown at once |
| hover/focus a row, pad, lead or chip | pointerenter / focus | row, pad, lead, chip → `--sea` | — | **≤ 120ms, starting the same frame** | e-out | instant colour change |
| packet pulse | same | a 14-unit dash with glow, pad → lead | offset 14 → −len | 420ms, then a 150ms fade | expo.out | none (the wire is simply lit) |
| press | pointerdown | row scale | 1 → 0.985 | 80ms | linear | none |
| email copy | click | "copy" → "copied" plus polite status text | — | instant, reverts after 1.4s | — | same |
| re-entry | scroll back into S7 | — | the power-up does **not** replay | — | — | — |
| phone (<820px) | — | stage capped at **32vh** above the list; the first two pad rows are visible on arrival (measured at 375×667: row 2 bottom 470px, bar top 610px) | — | — | — | same |

---

## Per section

Each table is `element | trigger | property | from → to | duration / scroll range | easing | reduced motion`.

### Camera stops (NW → C → E → SE open sea → rise)
All dwell poses are **top-down plan views, screen-aligned** (no orbits, swoops or tilts outside the S1 opening). A "travel window" is the next section's top moving from 100% to 30% of the viewport (02-ux).
| stop | section | pose (dwell) | arrives by |
|---|---|---|---|
| C0 | S1 end / S2 | whole die, plan view (S1's final frame) | S1 P = 1.0 |
| C1 | S3-linklayer | radio block (NW) | the S3 travel window |
| C2 | S4-riscv | CPU block (centre) | the S4 travel window |
| C3 | S5-wisard | memory block (E) | the S5 travel window |
| C4 | S6-cybot | open sea past the SE reef, with the UART pad at the frame edge | the S6 travel window |
| C5 | S7-contact | south half of the atoll, plan view | the last 60vh of S6 and the first 40vh of S7 |
Travel is a straight line in plan plus a height change, power3.inOut over the window. No tilt, no roll. The caustic RTs are frozen from C0 on, so travel costs only the floor pass.
**Dwell on S3–S5 is a page-locked pan (C-06, agreed with ux-designer).** The sim is drawn **onto the block**, as a `CanvasTexture` on the block's top-metal plane. The DOM canvas stays in place as the transparent input and focus layer. So the camera translates 1:1 with the Lenis scroll value in the same rAF (world shift = scroll px × visible world height ÷ viewport px, exact for a plane, no easing), and the die moves with the page like paper. Relative to the content nothing moves, so there's still no camera motion while someone is reading. Conditions: (1) reduced motion, Still, phones and `pointer:coarse` get flat-DOM mode, with the sim flat in the DOM over a static plan still (native async scroll would drift). (2) The texture uploads only when the sim changes, never every frame, at the DOM canvas's device-pixel size (crisp, C-07). (3) The loop renders only while the scroll value or a sim changes. (4) If DOM-to-block drift exceeds 1px for three or more consecutive frames, that section falls back to flat-DOM.

### S1-hero
See SM-1 for the scroll choreography, camera, exposure and type. Also:
| element | trigger | property | from → to | duration / scroll range | easing | reduced motion |
|---|---|---|---|---|---|---|
| canvas | first frame rendered | opacity over the poster | 0 → 1 | 400ms | e-out | the still frame, no fade |
| ADV_IND panel | 3D not ready at t = 300ms (**only then**) | lines print on **real milestones**: in the proof, script parsed → GPU context → solve 40% → solve 80% → solve done; in production, UX's list | — | per milestone; the channel dots cycle at 340ms | steps | lines appear whole; static dots |
| ADV_IND position | — | desktop: under the index in the plate; phone: **one mono line at the top of the plate** (ux-designer) | — | — | — | same |
| CONNECT_IND | first focused-capable frame (after the tier warm-up) | final line `CONNECT_IND · surface ready (n ms)` | — | shown, then it collapses to one line after 1.2s; the composition eases to the new plate size | — | same |
| project index (4 DOM links) | — | never animates; hover changes colour to `--sea` in 120ms | — | — | e-out | instant |
| **Type motion** | — | none. The DOM h1 is the quiet name; the *light* is the display type. | — | — | — | — |
| **Cursor** | — | native | — | — | — | — |

### S2-about (quiet; recognise)
Camera at C0; the RTs are frozen. Nothing scrubs.
| element | trigger | property | from → to | duration / scroll range | easing | reduced motion |
|---|---|---|---|---|---|---|
| h2 "Light through water." | h2 20% in view, once | opacity | 0 → 1 | 320ms | e-out | shown |
| h2 line 2 "Light through a mask." | +160ms after line 1 | opacity | 0 → 1 | 320ms | e-out | shown |
| "On this die" rows ↔ die blocks | hover/focus a row or a block | the block outline plus its metal layer | 35% → 70%; outline alu 0.4 → 1 | 120ms in, 200ms out | e-out / e-in | instant |
| visited blocks | after a section visit | block metal layer | 35% → 50% | 240ms | e-out | instant |
| row click (jump) | click | see Global → Jumps | — | ≤ 900ms | power2.inOut | instant cut |
| die-map minimap (visible at full opacity from first paint) | S3's travel window starts | only the destination block's fill lights; **no "docking" move** | fill 0 → layer colour | 240ms | e-out | instant |
| `[SLOT: photo-akash]` exposure | frame 30% in view, once, only if filled | a light-sweep (brightness 1.6 → 1, left → right) | — | 600ms, once | power2.out | shown |
| **Cursor** | over die blocks | `pointer` | — | — | — | — |

### S3-linklayer · Hop (CSA#1 around whale song)
Camera dwell at C1 (page-locked pan), with the spectrogram drawn on the radio block. Click-driven; **never scroll-scrubbed**. The mechanism follows the spec: **CSA#1** computes `unmapped = (lastUnmapped + hopIncrement) mod 37`. If that channel is unused, it maps to `used[unmapped mod numUsed]`, and the next hop always starts from `lastUnmapped`. **Map changes go through `LL_CHANNEL_MAP_IND` and take effect at an instant**, never on the tap.
| element | trigger | property | from → to | duration / scroll range | easing | reduced motion |
|---|---|---|---|---|---|---|
| spectrogram time axis | autoplay while in view (≥ 30%) | x scroll, one column per connection event | — | 2.5 events/s (400ms connInterval) | linear | **paused**; Step adds one column with no scroll |
| connection event | each event | a 1-column mark in lane `ch` | 0 → 1 → 0.6 | 90ms rise, then held | expo.out | mark appears whole |
| the hop | each event | a thin connector from the last lane to the new lane | opacity 0.8 → 0 | 400ms | power2.out | not drawn |
| remap (unmapped channel unused) | event | a ghost mark at `unmapped` and an arrow to `used[unmapped mod numUsed]` | ghost 0.4 → 0; arrow draws | 180ms | e-out | both shown statically |
| hop log (DOM twin) | event | a new entry `19→19` or `14→ch3` (unmapped → mapped) | — | instant swap | — | same |
| formula line | event | `(lastUnmapped + hop) mod 37 = …` digits swap | — | instant | — | same |
| **mark a lane bad** (click or tap a lane or chip, Space) | input | the lane gets a **dashed "pending" outline**, the chip is `aria-pressed`, and the formula line prints `LL_CHANNEL_MAP_IND · instant = event n+6` | 0 → 1 | **≤ 100ms** | e-out | instant |
| instant countdown | each event | `instant in 6…1` beside the formula (a data swap, no animation) | — | per event | — | same |
| **map switches at the instant** | event n+6 | all pending lanes become hatched ✕ at once, and a single 1px sweep crosses the lanes top to bottom to mark the new map in force | — | 200ms sweep | power2.inOut | hatched at once, no sweep |
| minimum map | a tap that would leave < 2 used channels | the chip stays unpressed (no shake, no motion), and an inline note says "CSA#1 needs at least 2 used channels" | — | instant | — | same |
| whale song | autoplay | a slow up-sweeping band drifting across 2–4 lanes (labelled "stand-in for interference, e.g. Wi-Fi") | x drift | 8s per crossing; opacity 0.5 ↔ 0.7 over 4s | linear / sine.inOut | static band at rest |
| **collision** (an event on a whale-covered lane still in use) | event | a **hollow, broken mark labelled `lost` in `--dim`**. Hatch plus ✕ stays **only** for channels in the bad map (C-19). | — | 120ms | e-out | hollow mark at once |
| "Avoid the whale song" demo | click | stages the covered lanes as pending in one `LL_CHANNEL_MAP_IND` (60ms stagger on the outlines), then they switch at the instant | — | 60ms stagger | e-out | all at once |
| hopIncrement slider (5–16) | input | the next hop uses the new value | — | immediate | — | same |
| **Cursor** | over lanes | `pointer` plus tooltip `ch14 · 2432 MHz` after 150ms | — | — | — | same |

### S4-riscv · Bubble Lock
Camera dwell at C2 (page-locked pan), with the five chambers laid along the CPU block and the cycle table full width below. It starts **paused at cycle 0**. One clock edge is one Step, or 700ms in Play. Everything moves on the edge and then settles. **A single JS pipeline model drives the animation, the cycle table and the captions, so they can't drift apart** (C-13). Stated model on the stage: *textbook 5-stage · branch resolves in EX · register file writes, then reads · a teaching model, not our RTL.*
**Reference timings the motion must reproduce (cycle numbers, 1-based):**
| scenario | what the chambers show |
|---|---|
| ALU → ALU, forwarding on (`add x5` then `sub x6,x5`) | `add` EX at 3, `sub` EX at 4 with **EX/MEM → EX** in cycle 4. No bubble. |
| ALU → ALU, forwarding off | `sub` holds in ID at 4 and 5 (2 bubbles into EX), reads x5 in cycle 5 after `add` writes it (write-then-read), and enters EX at 6. |
| load-use (`lw x5` then `add x6,x5`), forwarding on | `lw` MEM at 4. **Bubble in EX at cycle 4**; `add` repeats ID at 4 and enters EX at 5 with **MEM/WB → EX in cycle 5**. One bubble survives forwarding. |
| taken branch (`beq`, resolved in EX at 3) | the two younger instructions (IF and ID at cycle 3) are **flushed** at the end of cycle 3, and the target is fetched at 4. |
| element | trigger | property | from → to | duration / scroll range | easing | reduced motion |
|---|---|---|---|---|---|---|
| clock edge | Step / Play tick | the lock gates between chambers open | 0 → open | 80ms | power2.in | none |
| instructions | edge (+80ms) | x, one chamber forward | n → n+1 | 280ms | power3.inOut | position cut on the edge |
| chamber water level | edge | levels equalise across the opened gate | Δ → 0 | 240ms | power2.out | none |
| **bubble** | the cycle the model inserts it (the load-use: cycle 4 in EX) | a labelled "bubble" cell rises into EX; stalled instructions hold, with a 1px outline pulse | y +12px → 0, opacity 0 → 1 | 240ms | expo.out | the cell appears; no pulse |
| **forwarding path** | **the cycle the consumer is in EX** (never the bubble cycle) | a back-current fills from the pipeline register named by the model (EX/MEM or MEM/WB) to the ALU input, in the block's copper m1 | dashoffset len → 0, then fades | 200ms fill, 300ms fade | e-out | the line shown for that cycle |
| forwarding switch | toggle | the scenario recomputes from cycle 0; the table re-renders | — | 120ms thumb; table instant | e-out | instant |
| **flush** | the edge after EX resolves a taken branch | a wave sweeps IF and ID right → left; the 2 wrong-path instructions strike through at 30% and read "flushed" | — | 260ms sweep; removed on the next edge | power2.inOut | strike-through plus "flushed", no sweep |
| cycle-table column | edge | current column `th` highlight | — | 120ms | e-out | instant |
| live caption | a meaningful event | text swap (polite) | — | instant | — | same |
| Play | click | runs to the end, then stops | — | 700ms per cycle | — | allowed (user-initiated); each cycle is a cut |
| **Cursor** | — | native; `grab` only on the optional desktop drag-in sugar | — | — | — | — |
The caption stays exactly: "My partner led the RTL. I reviewed the design, debugged hazards like these, and wrote the docs."

### S5-wisard · Tide Pool
Camera dwell at C3 (page-locked pan), with a centred square pool on the memory block and discriminator bars to its right. No accuracy numbers are ever shown or animated.
| element | trigger | property | from → to | duration / scroll range | easing | reduced motion |
|---|---|---|---|---|---|---|
| ink | pointermove | wet-sand darkening under the stroke | — | **0ms latency**, same frame | — | same |
| tide wash (binarise) | stroke end + 150ms, or a key toggle | a bright front crosses the pad left → right; cells snap to on/off as it passes | x 0 → 100% | 360ms | power2.inOut | the grid snaps at once |
| tuples → RAM addresses | after the wash | 8 sample tuples light; a line to their RAM row flashes once | 0 → 1 → 0.4 | 40ms stagger, 240ms total | e-out | final state shown |
| discriminator bars | after the tuples | width to the hit count | old → new | 320ms | expo.out | instant |
| winner | after the bars, **only if top − second > 2** | the bar in oxide-green m3, label weight 400 → 600 | — | 160ms | e-out | instant |
| **tie** (top − second ≤ 2, ux-designer's C-22) | after the bars | **no winner highlight**; the line "Too close to call: 23 vs 22" swaps in; the gap shows as a count | — | instant swap | — | same |
| Teach (one example) | click | the written RAM cells flip 0 → 1 | per cell | 20ms stagger, capped at 300ms | steps | all at once |
| tuple-size slider | input | tuples re-partition; RAM size updates | — | 120ms | e-out | instant |
| pool light | while in view | a soft top-down shimmer at 10% (2D) | — | continuous | sine | none |
| **Cursor** | over the pad | `crosshair` (the site's only custom cursor state) | — | — | — | same |

### S6-cybot · Ping (scrubbed; off-die)
Sticky split (the only sticky stage left); the camera travels to C4. This is the only scrub after the hero (160vh desktop, 110vh phone). The text column is **never keyed to the scrub**. Stage label: "Illustrative course, not a recording." **All three sensors named in content.md appear, with the right physics (C-14):**
| element | trigger | property | from → to | duration / scroll range | easing | reduced motion |
|---|---|---|---|---|---|---|
| UART line | S6 enters | a thin line from the UART pad out to the CyBot glyph | draw 0 → len | first 8% of the scrub | linear on scroll | drawn |
| **PING cone** (ultrasonic, forward only) | scrub | a **narrow cone (about ±20°) along the robot's heading**, filling outward at the speed of sound; **no 360° rings** | range 0 → R | ping k starts at 10% + 20%·k, over 8% of the scrub | linear | all cones drawn at rest |
| echo | scrub | the return, drawn **only where the cone meets an obstacle**, and the obstacle segment appears only then | — | the same 8%, mirrored | linear | all echoes drawn |
| readout `d = v·t/2` | scrub | t and d update (v ≈ 343 m/s, in air) | — | continuous | — | final values |
| **IR** (short range) | between pings, when an obstacle is within the IR range | a **short dotted ray** from the robot's front | 0 → 1 → 0 | 160ms | e-out | drawn dotted at rest |
| **bump** | the one contact event in the course | a **contact tick** on the robot outline where it touched | 0 → 1 | 120ms | e-out | tick shown |
| robot path | scrub | turns and advances between pings, based only on what the sensors revealed | pose k → k+1 | the gaps between pings | power2.inOut on scroll | final path dashed |
| **Cursor** | — | native | — | — | — | — |
No servo-sweep claim is made (`[SLOT: cybot-sensing-detail]` until Akash confirms how the PING sensor was aimed).

### S7-contact
See SM-2. The camera rises from C4 to C5 over the last 60vh of S6 and the first 40vh of S7, as a straight rise plus lateral recentring that ends in plan view on the south half. **Type motion:** the h2 fades in (320ms, e-out) at 20% in view; the list doesn't animate. **Cursor:** `pointer` on rows, pads, leads and chips. Stage chips are `aria-hidden`; the DOM list is the only keyboard route, and hover or focus on either one lights the other.

---

## Global system

### Tokens
| token | value | use |
|---|---|---|
| `--t-tap` | 80ms | press states |
| `--t-fast` | 120ms | hover and focus colour, toggles, lane marks. **All interactive feedback ≤ 120ms, starting within one frame.** |
| `--t-ui` | 240ms | sheet open, small reveals |
| `--t-close` | 200ms | sheet close (exits are faster than entrances) |
| `--t-read` | 320ms | heading fade-ins |
| `--t-travel` | ≤ 900ms | camera jumps |
| `--e-out` | `cubic-bezier(0.16,1,0.3,1)` (≈ `expo.out`) | arrivals |
| `--e-in` | `cubic-bezier(0.7,0,0.84,0)` (≈ `expo.in`) | exits |
| camera | `power3.inOut` for scroll travel; `power2.inOut` for jumps | anything with mass |
| clock | `steps()` plus a short `expo.out` settle | sim clock edges |
| scroll-linked | linear in scroll (the ease lives in the mapping) | S1 and S6 scrubs |
| colour | `--sea #3D9DF2` (interactive only), glow `rgba(61,157,242,.35)`, caustic `#E6F4FF` | CLIENT-01 |

### Scroll engine
- Lenis `{ lerp: 0.1 }` on fine pointers only. **Native scroll on touch** and under reduced motion (Lenis is destroyed live when the preference changes, through a `change` listener).
- One clock: `lenis.on('scroll', ScrollTrigger.update)`, `gsap.ticker.add(t => lenis?.raf(t*1000))`, `lagSmoothing(0)`. The render loop reads ScrollTrigger progress.
- No snapping, no wheel capture, no horizontal scroll.

### Always-reachable chrome (02-ux, built in both proofs)
Desktop has a 56px top bar with the wordmark and a `--sea` pill: `Resume ↗ | Contact` (two ≥44px targets). Phone has a 56px bottom bar plus the safe area: `[≡ n/7 … ▴] [Resume ↗] [Contact]` at 144 / 88 / 96px. There is **no top-right pill on phone** (C-16). The chrome never moves or fades. Only the Surface Interrupt hides it (on purpose) while open.

### Jumps (die map, "On this die" rows, Surface Interrupt project links)
Scroll is set **instantly** to the target's dwell start. The camera flies a **direct path** (a straight line in plan plus a 15% height arc) in ≤ 900ms, power2.inOut. The DOM cross-fades (out 120ms, in 200ms). Entrances in skipped sections are marked done. Focus moves to the target `h2`. **Reduced motion or Still:** an instant cut. **Hash load** (`/#contact`): the camera starts at that stop, and the lagoon RT is rendered **once, deterministically** (t fixed, f = 1, swell 0) before the first frame. The same routine re-renders it after a WebGL context loss (C-20).

### Surface Interrupt (pill `Contact` or key `R`)
| step | what | timing | reduced motion |
|---|---|---|---|
| pre-empt | the render loop stops (the last frame stays), Lenis stops, sims pause | same frame as the press | same |
| save context | `context saved @ <section> · <P%> · scene frozen`; stores {scrollY, camera pose, sim states} | instant | same |
| isolate | `inert` on main, the bars and everything outside the dialog; a **focus trap**; the **pill/bar is hidden**; `history.pushState` | instant | same |
| dim | canvas `brightness(.32) saturate(.5)` | 240ms `--e-out` | instant |
| serve | the sheet rises (translateY 102% → 0) with focus on its heading. It has a **44px ✕ close button** and a **"Back to where you were"** button. **"Open resume (PDF) ↗" is the only `--sea` fill**; Email, LinkedIn and GitHub are `--floor-2` with a `--line-strong` border. | 240ms `--e-out` | instant |
| return (✕, "Back to where you were", `Esc`, or browser/Android Back) | all four go through one path (popstate). The sheet drops, the exact scroll and camera are restored, `inert` is removed, and focus returns to the control that opened it. | 200ms `--e-in` | instant |
Verified in the proof at 375×667: Contact opens it with focus on the heading, `main.inert = true` and the bottom bar hidden. ✕ closes it, restores scroll to the same position and returns focus to Contact (C-11).

### ADV_IND preloader
It appears only if 3D isn't ready by 300ms, prints lines on real milestones, has no percentage and no fake minimum, and collapses 1.2s after `CONNECT_IND`. The packet is a real legacy ADV_IND: header `0x40 0x17` (ADV_IND, TxAdd = 1, ChSel = 0, len 23), a random static AdvA (illustrative, labelled), and AdvData `02 01 06 | 0D 09 "Akash Gojuru"` = 17/31 bytes, with a real CRC-24 (init 0x555555) computed in the proof.

### Cursor
The native cursor everywhere: no follower, no blob, no magnetic pull. The states are `pointer` on interactive targets, `crosshair` on the Tide Pool pad, and `grab` on Bubble Lock's optional drag.

### Hover, press and focus
| state | treatment | time |
|---|---|---|
| hover | colour/luminance shift on the target (`--sea` only on interactive elements) | 120ms `--e-out` |
| press | `scale(.985)` or translateY(1px) | 80ms |
| focus-visible | art-director's focus ring, **never animated**, never obscured by sticky UI (`scroll-padding`) | 0ms |
| disabled | 40% opacity, no hover | — |
Twinned targets (S2 rows ↔ blocks, S7 rows ↔ pads/leads/chips) light each other within the same frame.

### Headings and type motion
**Headings develop:** opacity 0 → 1 over 320ms `--e-out` at 20% in view, once, with no translate, no letter splitting and no blur. Body text never animates. Data lines swap instantly.

---

## Performance

### Load order (C-21), numbered rules
1. **The HTML carries the h1, role, index, pill and bars**, so they're the LCP candidates. The poster is decorative, `fetchpriority=high`, AVIF ≤ 60 KB, and never larger in area than the plate text block's own first paint (the h1 renders first).
2. **One self-hosted, subset Newsreader roman** (Latin, the weights in use) is preloaded, with a `size-adjust`-matched fallback so the swap doesn't shift layout. Martian Mono loads non-blocking (the proofs already load fonts with `media="print" onload`).
3. **No 3D code in the critical path.** three/webgpu, R3F, GSAP and Lenis come in one deferred chunk requested **after first paint** (`requestIdleCallback` with a 300ms timeout).
4. The slope field (RG16F, 1 MB) and the shader modules load in parallel with that chunk. ADV_IND milestones report real progress.
5. **Compile with `renderer.compileAsync()`**, yielding to the main thread between materials, so no long task over 50ms runs while the page is interactive. The tier warm-up (below) runs after compile, during ADV_IND.
6. The pill's INP budget is < 100ms. Opening the Surface Interrupt pauses the render loop in the same frame, and nothing else runs on click.
7. First-visit budget, gzipped: HTML+CSS ≤ 30 KB, fonts ≤ 60 KB, poster ≤ 60 KB before any JS. The 3D chunk plus data is estimated at ~1 MB and loads only after first paint.

### Tiers (C-08)
| | **high** (desktop default, if the warm-up passes) | **low** (default for `pointer: coarse`, or if the warm-up fails) |
|---|---|---|
| lagoon mesh | 513² vertices, **1 pass** | 257² vertices, 1 pass (slope box-downsampled to 256²) |
| open-sea mesh | 257² | 129² |
| RTs (RGBA16F) | lagoon 1280², sea 640² (over the tile plus margin) | 640², 320² |
| dispersion | 3 offset samples of the one RT, scaled by f | off |
| bloom | 2 mip levels | 1 mip level |
| DPR cap | 2 | 1.5 |
**Tier choice:** a 12-frame offscreen warm-up (2 discarded) runs while ADV_IND shows, **never during the focus**. Each frame renders both caustic passes and forces a 1px readback. The bare readback round-trip is measured separately and subtracted, and a median above 6ms selects low. On this Mac's pane it measured **2.6ms per caustic update** (4.1ms round trip) and chose high. That is a CPU-side measurement, not a GPU timer. The build should use `EXT_disjoint_timer_query_webgl2` / WebGPU timestamp queries where available.

### Frame budget (targets; the build must measure on real devices)
| path | budget | contents |
|---|---|---|
| desktop high, S1 during the focus | ≤ 8ms GPU | lagoon 263k vertices + sea 66k vertices into RGBA16F RTs, and the floor pass (3×3 fold, finite-sun blur, dispersion, procedural layout) |
| phone low, S1 during the focus | ≤ 8ms GPU (estimated 3–6ms on Adreno 610 / Mali-G57 per the webgl-engineer review) | lagoon 66k + sea 17k vertices, and the floor pass without dispersion |
| S2–S7 | ≤ 3ms GPU | the floor pass only; **RTs frozen** from P 0.9 |
| idle | 0 frames | render on demand (the proof verifies it: the loop returns early when nothing changes) |
| sims (S3–S5) | ≤ 2ms CPU | 2D canvas; the texture uploads only on change; paused off-screen, in hidden tabs and during the Surface Interrupt |

### What is cheap vs risky
- **Cheap:** the floor pass over frozen RTs, pads, wires, and 2D sims.
- **Medium (the only one):** the two caustic passes, costed by vertex count.
- **Risky:** (1) The floor pass in the proof takes up to about 24 fetches per pixel inside the die at f > 0 (3 dispersion samples × a 7-tap sun blur plus the fold). Production blurs the RT once per update instead (see SM-1). (2) Half-float render targets need `EXT_color_buffer_half_float`; the fallback is RGBA8 with intensity pre-scaled by 1/8. (3) The runtime solve is never shipped. (4) Mipmapped float RTs on older mobile GPUs: the fallback is one fixed-LOD blur.

### Cuts on a mid-range phone (in order)
1. The low tier is already the default on `pointer: coarse`.
2. Caustic updates at 30Hz (the floor still renders at 60).
3. The S1 pin is 100vh and S6's scrub 110vh (UX).
4. If it still drops below 45fps for 2s during S1: **stop the caustic passes and freeze at the AVIF focused still, with no cross-fade animation** (a cut, not a morph; guardrail 4, C-20).

### No-WebGL / Still path
With no WebGPU and no WebGL2, or with `saveData`, or when the user picks **Still**, there's no canvas. `navigator.deviceMemory ≤ 2` is **a hint only** (it exists only in Chromium): it pre-selects Still with "Turn on 3D" offered, and its absence means nothing (C-20). S1 shows the final focused frame as a still (AVIF from the same bake) with the same plate. S2 and S7 dies are SVG, with S7's pad lighting in CSS. S3–S5 sims sit flat in the DOM with motion as step-on-tap. S6 is a static SVG of all cones and echoes. The story beats are identical.

---

## Accessibility

**Reduced motion** (`prefers-reduced-motion: reduce`, read **live** through a `change` listener; Still forces the same or stronger):
- **S1:** no camera travel, no swell and no focus scrub. The hero is the **final focused frame (the die in plan view with the lit name) as a still** from first paint. The canvas renders once on demand, and the layout is identical.
- **Camera:** no travel and no page-locked pan (flat-DOM mode). Section changes and jumps are instant cuts, and focus moves to the target `h2`.
- **Reveals:** every reveal is simply shown. The only fade kept is the canvas-over-poster swap (200ms, opacity).
- **Sims:** no autoplay. Each Step or input **cuts** to the new state: no instruction travel, no tide wash, no pulse, no map-switch sweep. The information is identical (pending, instant countdown, lost marks and ties all still show as static states).
- **S6:** no scrub; a static SVG of the whole course at normal height.
- **S7:** no power-up sweep and no packet pulse. Pads rest lit, and hover or focus changes colour instantly.
- **Surface Interrupt:** appears and disappears instantly; pause, save, `inert`, trap and restore are unchanged.
- **Scroll:** native (Lenis off). **ADV_IND:** whole lines, static dots.

**Flashing.** Nothing flashes more than 3 times per second. ADV_IND dots light about once a second each. Hop marks are small and appear once at 2.5/s. The map-switch sweep happens once per instant. The caustic shimmer is continuous luminance motion, not flashing.

**Pause, Stop, Hide (2.2.2).** The auto-moving content (S1 swell, Hop autoplay, whale song, S5 pool light) stops with the always-visible **Still** toggle and with each sim's Pause.

**No scroll trap.** Native document scroll only. Only the Tide Pool pad sets `touch-action: none`, with 32px+ scrollable gutters. The Surface Interrupt closes with ✕, "Back to where you were", Esc or the browser Back button, and **phone users always have a visible close control** (C-11).

**Focus survives animation.** Focus rings are never animated. Nothing that has focus moves or fades. Jumps move focus to the `h2`. The Surface Interrupt traps focus and returns it to its opener. The canvas and stage chips are `aria-hidden`, all copy is DOM text, and twinned targets have one tab stop each (the DOM row).

**Feedback ≤ 100ms** for every input. Verified in the S7 proof: colour changes are CSS at 120ms and start on the same frame.

---

## Agreements and open points
| with | point | status |
|---|---|---|
| creative-director | scroll-back melts the name into shimmer; 3% residual masked off the traces; one straight vertical rise; S2 and S7 in plan view | agreed |
| creative-director | copy: role line "Computer Engineering, Iowa State. Heading into ASIC design; seeking hardware and chip-design internships."; `[SLOT: grad-term]` omitted when empty; S7 line "…These are how you reach me."; the illustrative-die caption | agreed; in both proofs |
| art-director | sun at zenith; auto-exposure 1.6 → 0.42; ambient 0.35 → 0.02; target luminances with **fill 0.20** (measured); canonical 8×12 glyph JSON at 6.5 texels/track in the 512² proof solve; a still lagoon with swell outside that stops by P 1 | agreed |
| art-director | CLIENT-01 palette: `--sea #3D9DF2`, caustic `#E6F4FF`, sand `#BAC4C2`/`#6E7E80`, lit-pad glow `rgba(61,157,242,.35)` | agreed; in both proofs |
| ux-designer | C-01: pin 120/100vh; focus 0.05–0.45, hold 0.45–0.55, rise 0.55–1.0; S2 by P 0.70; the 4-line index in the plate; ADV_IND one line at the top of the plate on phone | agreed; in the proof |
| ux-designer | C-06: sims drawn on blocks, a page-locked pan during dwell, flat-DOM on phones, reduced motion and Still, and a drift safety valve | agreed (4 motion conditions above) |
| ux-designer | earlier: S7 plan view; pads in the middle 60% of the south reef; the minimap visible from first paint (no docking) | agreed |

**Proof gaps, stated honestly.** The proof solves the surface live (production bakes it). The lagoon tile's edge shows as a faint square line where the calm lagoon meets the open sea; the build can move that edge off-frame by baking a 2-unit margin. Neither proof was measured on a phone GPU, and the fps and warm-up figures come from this Mac's browser pane. The S3–S6 motion is specified here but not built as proofs.

---

## Revisions

Round 1, answering every 05-critique finding addressed to motion-designer, plus the client direction.

- C-02 — accepted: the near framing is no longer a fixed box. The camera distance is fit by binary search so the projected letter bbox plus a 6% margin sits inside the measured free region (excluding the 56px bar or phone bottom bar, the pill and the plate) at tilt 0° and 14°, and the whole die plus 4% fits at P 1. The proof has `framingTest()` and a framing overlay. It passes at 1280×720, 1440×900, 1920×1080, 375×667 and 390×844 (bboxes in SM-1), and all five were screenshotted.
- C-05 — accepted: the floor is now tiled to the frame edges. The die tile is the lagoon, and a periodic open-sea caustic tile surrounds it, with a 3×3 fold so light crossing tile edges is kept and edge-to-edge meshes leave no gaps. At P 0 the whole frame is sunlit sand (ambient 0.35). The "dark plate" now comes from auto-exposure (1.6 → 0.42) plus ambient 0.35 → 0.02, and the open sea calms and stops by P 1. Re-shot at 1440 and 375.
- C-07 — accepted: the metal layout is procedural in the floor shader (fwidth-antialiased, faded to coverage when sub-pixel), so it stays sharp at any dwell zoom. Sim content is drawn onto blocks as a device-pixel `CanvasTexture` (C-06). The light stays soft on purpose, including the finite 0.53° sun blur, and is never re-rendered at higher resolution.
- C-08 — accepted: the low tier (257² mesh, 640² RT, no dispersion, DPR 1.5) is the default for `pointer: coarse`. Other devices run a 12-frame warm-up during ADV_IND, never mid-focus (2.6ms per update here, so high was chosen). 3-pass dispersion is replaced by 3 offset samples of one RT. The area ratio has `+1e-8`, and shaders are highp.
- C-09 — accepted: production ships the **slope** field as RG16F (512², ~1 MB; KTX2 or a Float16 `.bin`, NoColorSpace, no premultiply, nearest filtering), never a PNG height map. Measured in the proof against the f32 solve at display scale: f16 slope 0.9% of pixels off by >10%, 16-bit hi/lo height 1.8%, 8-bit-decoded PNG 83.9%. Toggle "slope: h8" against "slope: f16" to compare.
- C-10 — accepted: S7 is framed on the south half. The reef, contact pads, bond wires and leads sit within 100vh−56px (the chip bottom is at 503px at 1280×720 and 608px at 1440×900). The name is a faded, cropped glow. Lead labels are DOM chips at 12px (`01`–`05` on phone). On phone the stage is capped at 32vh and the first two pad rows are visible on arrival.
- C-11 — accepted: the Surface Interrupt proof now has a 44px ✕ and "Back to where you were", `inert` outside the dialog, a focus trap, `pushState` so Back closes it, and the pill/bar hidden while open. "Open resume (PDF) ↗" is the only `--sea` fill; the other links are `--floor-2` with a `--line-strong` border. Verified at 375×667.
- C-14 — accepted: S6 no longer uses 360° rings. PING is a narrow forward cone (about ±20°) along the heading, echoes appear only where the cone meets an obstacle, IR is a short dotted ray, and bump is a contact tick. There's no servo-sweep claim (`[SLOT: cybot-sensing-detail]`).
- C-19 — accepted: a collision is now a hollow, broken mark labelled `lost` in `--dim`. Hatch plus ✕ is reserved for channels in the bad map, which now change only at the `LL_CHANNEL_MAP_IND` instant (event n+6), with a pending state before it.
- C-20 — accepted: (1) phone cut 7 now freezes at the AVIF still with no cross-fade; (2) the residual ramps to 0 over P 0.7–0.9, the open sea stops over 0.9–1.0, the RTs freeze and the loop idles at 0 frames (checked in the proof); (3) the lagoon RT renders once, deterministically, for a hash load to any stop and after context loss; (4) `deviceMemory` is a hint only; (5) RTs are `RenderTarget` from `three/webgpu`, not drei's `useFBO`.
- C-21 — accepted: numbered load-order rules were added under Performance: static h1/plate as LCP, one preloaded, subset, self-hosted Newsreader with a size-adjusted fallback, the poster AVIF ≤ 60 KB with `fetchpriority=high`, the 3D chunk after first paint, `compileAsync` yielding between materials, and a pill INP under 100ms. Both proofs now load fonts non-blocking.
- CLIENT-01 — accepted: amber → ocean blue. `--sea #3D9DF2` is used on the pill, lit pads, bond-wire pulses and the primary resume link. The caustic light changed from warm `#FFF4E0` to cool `#E6F4FF`, and the sand from `#CDBB9A`/`#8C7A5C` to `#BAC4C2`/`#6E7E80`. Both proofs and this file were checked: no amber or yellow remains.

Teammates' findings also carried into motion and the proofs (they're not mine to answer, so they're listed without the gate format): C-01, the hero pin, index and phone ADV_IND (ux); C-03, target luminances with fill 0.20 measured and adopted by art; C-04, the canonical glyph JSON in both proofs (art); C-06, sims on blocks with the page-locked pan (ux); C-12, `LL_CHANNEL_MAP_IND` with an instant, a minimum of 2 channels and unmapped→mapped logging (ux); C-13, 5-stage timings from one model (ux); C-16, the phone bottom bar in both proofs (art); C-17 and C-18, copy (creative-director); C-22, ties in Tide Pool (ux).
