# 04 — Art direction

Owner: art-director. Inputs: [`00-brief.md`](00-brief.md) and [`01-concept.md`](01-concept.md) (concept **B, Caustic Lithography**, frozen), plus [`01b-innovation.md`](01b-innovation.md).
Proof: [`proofs/style-tile.html`](proofs/style-tile.html) opens in a browser with no build step.
Agreed with:
- **creative-director:** the direction, and the S2 and S7 copy (C-17 / C-18).
- **motion-designer:**
  - hero lighting (zenith sun, auto-exposure)
  - C-03 target levels (fill 0.20, measured)
  - C-05 open-sea tiling
  - the ocean-blue tokens
  - the canonical glyph set
- **ux-designer:**
  - focal points, the bar, the focus ring and the minimap
  - the S1 plate contents (C-01)
  - drawn-on-block sims and the floorplan ratios (C-06)
  - scribe lanes and the phone bottom bar (C-15 / C-16)
- **Client direction (CLIENT-01):** the accent is ocean blue, not amber, and the palette is cooled throughout.

---

## Visual idea

**A sun print, taken underwater.** The site is one photographic plate exposed by the sea.
- **The opening.** It starts on a **sunlit plate**: pale sand a few metres down, covered in moving caustic light. The light is cool white, because the water has already absorbed the reds.
- **The exposure.** As the water's surface is engineered, refraction pulls that light *into* the layout lines, and the sand between them goes dark. Two things cause this, and neither is a fade:
  - **Energy conservation.** A caustic lens moves light and never adds any.
  - **The camera stops down** for the brightest light, the way any camera adapts.

  What remains is an **exposed plate**: near-black sand with Akash's die printed in light.
- **The plate carries the rest of the site.** The exposure **fades progressively** down the page: a little residual light in S2 and full dark in S6. Every section break is drawn in **photomask grammar**: scribe lanes, alignment keys and die-IDs.

The line connecting the look to the concept:
**sunlit sand → focused light → an exposed plate, read like a photomask.**
- The one accent is **sea blue `#3D9DF2`**. It sits near the ~475 nm that clear ocean water carries furthest, and it is the blue end of the spectrum that exposes photoresist (g-line, 436 nm). It marks only the things you can act on: the light that reaches Akash.
- Die-photo metal colours appear only inside the die, one per block.

**Two lights and three rooms**
- **The sun** lights S1. It sits at zenith, cool white, and moves until it focuses. S7 returns to that same frozen exposure; only the pads and bond wires move there.
- **A coaxial microscope** lights S2–S5: flat, even and inspecting.
- **Nothing** lights S6, off the die in open water. Only returning echoes are drawn.

---

## Typography

Two families, both free:

| Role | Face | Licence / source | Why |
|---|---|---|---|
| **The sea's voice**: display, headlines, reading text, nav and rails | **Newsreader** (Production Type), variable `opsz 6–72`, `wght 200–800`, with italics | SIL OFL · [Google Fonts](https://fonts.google.com/specimen/Newsreader) | Built for long-form science and news reading, so recruiters read it without effort. The optical-size axis lets one family be a tight, high-contrast display at 72 px and a sturdy text face at 16–18 px. At display size its contrast (hairline into thick stem) echoes a caustic filament running into its cusp. The italic carries the metaphor lines. |
| **The silicon's voice**: data, code, signals, pads and die-IDs only | **Martian Mono** (Evil Martians), variable `wdth 75–112.5`, `wght 100–800` | SIL OFL · [Google Fonts](https://fonts.google.com/specimen/Martian+Mono) | Its width axis behaves like layout. Pad labels are set semi-condensed (`wdth 87.5`) so they fit a pad, and data tables are set at normal width. It is not JetBrains, IBM Plex or Space Mono, the three mono faces every developer site uses. |

**Pairing rules**
1. **Newsreader speaks and names; Martian Mono measures.** Nav, rails, the pill, figure captions and group headings are Newsreader roman in sentence case. Uppercase mono is limited to **pads, block tags and data** (C-15).
   - Newsreader's Google build has no true small caps (tested: no `smcp` feature), and faux small caps are refused.
   - Sentence case also keeps screen-reader and copy-paste text normal ("Link Layer", not "LINK LAYER").
2. Mono never sets a sentence longer than one line, and Newsreader never sets a signal name, channel number, opcode or pad label.
3. Every mono token is real: `IF ID EX MEM WB`, `ch 37/38/39`, `ADV_IND`, `hopIncrement`. Decorative fake code is banned.
4. Italic Newsreader is reserved for the metaphor lines: the S2 display line, the S7 line, and the "running in your browser" notes.
5. Emphasis in body text is italic, never bold.

**Scale** (fluid; 1440 px desktop → 375 px phone)

| Token | Face / settings | Size | Line height | Tracking | Use |
|---|---|---|---|---|---|
| `--t-display-xl` | Newsreader opsz 72, wght 360 | `clamp(48px, 4.4vw, 64px)` | 0.92 | −0.025em | The S1 h1, the quiet name. The light-name is the display, so the DOM name never competes with it (agreed with ux-designer). It is still the largest DOM type. |
| `--t-display-l` | Newsreader opsz 72, wght 340, italic allowed | `clamp(34px, 4.8vw, 72px)` | 0.98 | −0.02em | The S2 metaphor line; section titles S3–S7 |
| `--t-display-m` | Newsreader opsz 48, wght 400 | `clamp(26px, 2.8vw, 40px)` | 1.1 | −0.01em | Block sub-heads; the S7 line |
| `--t-lede` | Newsreader opsz 24, wght 400 | `clamp(19px, 1.5vw, 22px)` | 1.45 | 0 | Role line, section claims |
| `--t-body` | Newsreader opsz 16, wght 400 | `18px` (phone 17px) | 1.55 | 0.003em | Reading text, max 62ch |
| `--t-nav` | Newsreader opsz 16, wght 450, sentence case | `16px` | 1 | 0.01em | Nav, pill, rails, bottom bar (targets ≥44 px) |
| `--t-small` | Newsreader opsz 12, wght 420 | `15px` | 1.5 | 0.005em | Captions, slot notes, group headings |
| `--t-tag` | Martian Mono wdth 87.5, wght 500, UPPERCASE | `12px` | 1 | 0.08em | Pads, block tags, status tags (`IN PROGRESS`) |
| `--t-data` | Martian Mono wdth 100, wght 400, `tabular-nums` | `13px` | 1.5 | 0 | DOM twins, ADV_IND decode, the project index, die-IDs, tables |

**Behaviour at display sizes.** From 56 px up, the display face tightens to −0.025em and ascenders may touch the line above (leading 0.92). It never goes above weight 400: a heavy display serif reads as luxury fashion, and this is a scientific plate caption.

**Type-as-image moments**
- **The light-name (S1, S7).** AKASH / GOJURU is drawn in caustic light as **top-metal silicon art**, built from the canonical glyph set below. It is custom geometry baked into the engineered heightfield target, not a font. The DOM h1 in Newsreader is the caption for that image and never imitates it.
- **Die-IDs and layer labels** (`AG-S3 · LINK LAYER`, `RADIO · LL`) are set in Martian Mono at `wdth 75`, like the text layer of a GDS file. They are aria-hidden duplicates of DOM headings.
- **ADV_IND decode (S1 loader):** Martian Mono, typed out field by field. Hex is in `--dim` and decoded values are in `--light`.

### Glyph set (canonical)

One set feeds the solve target, the stills, the S2/S7 SVG and the style tile (C-04). The build extracts this block verbatim to `glyphs.json`.

**Grid and units.** Each glyph is 8 × 12 tracks. Rectangles are `[x, y, w, h]` in tracks, with y pointing down. Stroke rules:
- **Stems** are 1.5-track straps.
- **Bars and jogs** are 1-track, the minimum width.
- **Diagonals** are replaced by one 1-track jog, the way a router would draw them.
- **Vias** (`v`) are 2 × 2-track squares centred on the listed points and clamped inside the glyph box. They sit only at free stroke ends.

**Layout.** Letters sit 2 tracks apart and the two lines 4 tracks apart, each line centred.
- GOJURU is 58 tracks wide. The production bake runs at 1024², which gives about 13 texels per track. The live 512² proof uses 6.5 texels per track (word block 377 texels, bars 6.5 texels, stems 9.75, all above the ~6-texel floor), which leaves about 22 px clear of the reef (motion-designer).
- Legibility is checked at 24 px cap height on phone (the S7 SVG). There, bars are 2 px and stems 3 px.

**Letterform rules**
- **K** is a squared K: a stem plus two right-hand stubs, each joined by a single jog.
- **R** has a closed bowl and a jogged leg.
- **J** has a top serif and a left terminal.
- **S** and **G** have terminals.
- No two letters share a silhouette.

```json
{"grid":[8,12],"units":"tracks","stem":1.5,"bar":1,"via":2,"letterGap":2,"lineGap":4,"lines":["AKASH","GOJURU"],"glyphs":{"A":{"r":[[0,0,1.5,12],[6.5,0,1.5,12],[0,0,8,1],[0,6,8,1]],"v":[[0.75,12],[7.25,12]]},"K":{"r":[[0,0,1.5,12],[1.5,5.5,3.5,1],[4,3.5,1,5],[4,3.5,4,1],[6.5,0,1.5,4.5],[4,7.5,4,1],[6.5,7.5,1.5,4.5]],"v":[[0.75,0],[0.75,12],[7.25,0],[7.25,12]]},"S":{"r":[[0,0,8,1],[6.5,0,1.5,2.5],[0,0,1.5,6.5],[0,5.5,8,1],[6.5,5.5,1.5,6.5],[0,11,8,1],[0,9.5,1.5,2.5]],"v":[[7.25,2.5],[0.75,9.5]]},"H":{"r":[[0,0,1.5,12],[6.5,0,1.5,12],[0,5.5,8,1]],"v":[[0.75,0],[0.75,12],[7.25,0],[7.25,12]]},"G":{"r":[[0,0,8,1],[6.5,0,1.5,2.5],[0,0,1.5,12],[0,11,8,1],[6.5,6,1.5,6],[4,6,4,1]],"v":[[7.25,2.5],[4,6.5]]},"O":{"r":[[0,0,1.5,12],[6.5,0,1.5,12],[0,0,8,1],[0,11,8,1]],"v":[]},"J":{"r":[[2.5,0,5.5,1],[6.5,0,1.5,12],[0,11,8,1],[0,8,1.5,4]],"v":[[2.5,0.5],[0.75,8]]},"U":{"r":[[0,0,1.5,12],[6.5,0,1.5,12],[0,11,8,1]],"v":[[0.75,0],[7.25,0]]},"R":{"r":[[0,0,1.5,12],[0,0,8,1],[6.5,0,1.5,6.5],[0,5.5,8,1],[4,5.5,1,3.5],[4,8,4,1],[6.5,8,1.5,4]],"v":[[0.75,12],[7.25,12]]}}}
```

---

## Color

Hard limit: **one ground family, one light, one accent and three die layers.** Nothing else. The palette is cool throughout (CLIENT-01). The water has taken the reds, so nothing reads yellow.

| Token | Hex | Role |
|---|---|---|
| `--floor-0` | `#0E1312` | The exposed plate: page ground, and the ink plate behind the S1 caption. Near-black with a trace of water green. |
| `--floor-1` | `#161C1A` | Raised surface: control rails, chips, pad-label backs, the Contact half of the pill. |
| `--floor-2` | `#222A27` | Highest surface: DOM-twin table headers, hover rows. |
| `--floor-deep` | `#0A0E0D` | S6 only, the open sea past the reef. |
| `--exposure` | `#9CC8E8` | Residual light tint, as a per-section percentage over `--floor-0` (see palette shift). Ground only, never text. |
| `--line` | `#2E3733` | Decorative hairlines and dummy fill (non-text, not a boundary). |
| `--line-strong` | `#737E83` | Boundaries of interactive components, plus fiducials and reticle marks (≥3:1 on every ground). |
| `--sand-sun` | `#BAC4C2` | Lit sand under water (3D and stills), and the S5 tide-pool drawing surface. |
| `--sand-shade` | `#6E7E80` | Sand in shade (3D and stills only). |
| `--caustic` | `#E6F4FF` | Emissive caustic light (3D only). Never a UI colour. |
| `--light` | `#E8EEF0` | Primary text, and the main "light" in 2D graphics. A cool paper, not cream. |
| `--sand` | `#A7B5BB` | Secondary text. |
| `--dim` | `#85939A` | Tertiary text: metadata, hex, slot notes. |
| `--sea` | `#3D9DF2` | **Sea blue, only for actionable elements**: pinned CTA fill, lit pads, bond-wire pulse, focus ring, hover on tappable sim parts. |
| `--ink` | `#0A1016` | Text on sea, and text on sand. |
| `--m1-copper` | `#D08A62` | Die layer: the **CPU block (S4)**. |
| `--m2-violet` | `#A597DD` | Die layer: the **radio block (S3)**. |
| `--m3-oxide` | `#86C4A8` | Die layer: the **memory block (S5)**. |
| `--m5-al` | `#C3C9CC` | Top metal: pads, seal ring, bond wires when unlit. |

**Why this blue.** `#3D9DF2` sits in the band that clear ocean water carries furthest (about 475 nm), and at the blue end that exposes photoresist (g-line, 436 nm). It is deep enough to read as sea rather than as a default UI blue (Apple's `#0A84FF`, dodgerblue `#1E90FF`), bright enough to pass AA on the ground, and has no teal in it.

**Why these metal colours.** Under a microscope, die colours are **thin-film interference** in the oxide, not paint. The first-order SiO₂ sequence runs tan → brown → purple → blue → green → yellow. Copper, violet and oxide green come from that sequence, desaturated so they read as material, not neon. They appear only inside the die, at 35% in the S2 overview. Copper is the one warm note left, and it is confined to the CPU block.

**Sea discipline.** If it's blue, you can press it. Sea blue never appears on the caustic light, body text or decoration. At rest it covers less than 2% of any viewport.

**Contrast (WCAG 2.2, computed)**

| Text / element | Background | Ratio | Passes |
|---|---|---|---|
| `--light` body | `--floor-0` / `--floor-1` / `--floor-deep` | **15.99** / 14.75 / 16.57 | AAA |
| `--sand` secondary | `--floor-0` / `--floor-1` / `--floor-2` | 8.90 / 8.21 / 6.98 | AAA / AAA / AA |
| `--dim` tertiary | `--floor-0` / `--floor-1` / `--floor-2` | 5.92 / 5.46 / 4.65 | AA |
| **`--sea`** link text, focus ring | `--floor-0` / `--floor-1` | **6.52** / 6.01 | AA |
| `--ink` on sea (pill, lit pad) | `--sea` | 6.65 | AA |
| `--ink` on lit sand (S5 pool labels, stills) | `--sand-sun` | 10.71 | AAA |
| `--ink` on `--light` | `--light` | 16.31 | AAA |
| Worst residual ground, S2 at 12% `--exposure` → `#1F292C` | `--light` / `--sand` / `--dim` / `--sea` | 12.69 / 7.06 / 4.70 / 5.17 | AA+ |
| Pinned bar scrim, worst case over full caustic `#E6F4FF` | `rgba(14,19,18,.86)` → `#2C3233` | `--light` 11.12, `--sand` 6.19 | AA+ |
| Metal-layer labels (sim legends only, ≥13 px) | `--floor-0`: copper / violet / oxide / Al | 6.69 / 7.20 / 9.35 / 11.20 | AA+ |
| `--line-strong` component boundary | `--floor-0` / `--floor-1` / `--floor-2` / 12% ground | 4.50 / 4.15 / 3.53 / 3.6 | ≥3:1 non-text |
| Focus ring: sea outline + 2-px ink halo | any ground, including `--sand-sun` | sea 6.52 on floor; ink 10.71 on sand | ≥3:1 on every ground |

**Bans**
- `--light` on `--sand-shade` is 3.61, which fails. No DOM text sits directly on the live caustic field; text on a moving image always sits on a solid plate.
- Sea on `--sand-sun` is 1.61, so sea blue never touches bare sand. The pill always sits on the bar scrim or the bottom bar.

**Palette shift down the page: progressive exposure (C-15)**

| Section | Ground | What changes |
|---|---|---|
| S1 | `--sand-sun` → `--floor-0` | The exposure. |
| S2 | floor-0 + **12%** `--exposure` | Radial, peaking behind the die. All three layers at 35%. |
| S3 | **8%** | Violet raised. |
| S4 | **6%** | Copper raised. |
| S5 | **4%** | Oxide raised, with one window of `--sand-sun` (the tide pool). |
| S6 | `--floor-deep`, **0%** | No metal. |
| S7 | floor-0 on the frozen S1 exposure | All layers and pads; sea blue on interaction. |

The residual is a radial gradient centred on the section's focal point, fading to plain `--floor-0` at the text column. The plate keeps developing, and gets darker, as you scroll.

---

## Imagery, lighting & texture

**Medium.** A real-time 3D scene (the sand, the water surface and the die) plus 2D sims drawn onto the die. There are no stock photos, no illustrations and no 3D blobs. Every image is either physically computed light or real layout language: Manhattan routing, seal ring, pad ring, power straps, density fill, scribe lanes and alignment keys.

**Lighting**
- **Sun (S1).** One directional light, cool white `#E6F4FF`, at **zenith** (normal incidence, as in a lithography exposure).
  - The engineered surface is solved for that one direction, and a stepper exposes a mask the same way. A tilted sun would print the letters offset and sheared.
  - The camera, not the sun, carries the 28° tilt.
  - There is no fill light. Shadows carry a cool water-green tint.
  - Chromatic dispersion (IOR 1.3305 / 1.333 / 1.3355) stays under 8% chroma at caustic edges.
- **The exposure (S1 scroll) (C-03).**
  - **Formula.** Floor = albedo × (ambient + caustic intensity) × exposure.
  - **Ambient** ramps from 0.35 at f=0 (pale sand) to 0.02 at f=1.
  - **Conservation.** Mean caustic intensity is held at 1.0.
  - **Camera exposure** stops down about 4× as f goes 0→1, the way a camera adapts to its brightest light. At f=1 the letters clip to cool white with a small bloom (threshold 0.9, radius about 6 px at 1080p).
  - **Outside the reef (C-05, motion-designer).** The floor is tiled with a periodic open-sea caustic. The lagoon inside the reef calms first ((1−f)^1.6), while the swell outside calms more slowly ((1−f)^0.7) and comes to a full stop over P 0.9–1.0. Because of the exposure drop, the open sea reads as dim grey-cyan sand around a dark plate.
- **Solve target luminance (normalised).**

  | Element | Target |
  |---|---|
  | Letters (traces + vias) | **1.0** |
  | Pads | 0.35 |
  | Seal ring | 0.30 |
  | Straps and bond wires | 0.20 |
  | Dummy fill | **0.20**, 1-track squares on a 3-track pitch (≈ 24 px), with a 2.5-track (≈ 20 px) keep-out around letters and rings |
  | Core | 0.02 |

  - **Fill is where the light goes.** An engineered surface moves light only locally. Motion-designer measured with the solver that fill at 0.12 left the core grey (I ≈ 0.34), and 0.20 is the smallest value that darkens it. Real dies need fill for the same reason (density rules).
  - **Acceptance at f=1.** The mean luminance under the letter mask must be **≥3×** the fill region and **≥8×** the core. Motion-designer's solver measures **6.3×** and **19.2×**, and those are the binding numbers. The style tile's 2D sketch hits the target exactly with no solve blur, so its live meter (letters:fill about 140×) is only an upper bound.
- **Coaxial microscope (S2–S5).** In plan view the light is flat and axial, as on a die-photo microscope. Metals read as their layer colour, and relief comes from a 1-px specular edge on top metal, not from shadows.
- **Nothing (S6).** No light source. Echoes are self-luminous `--light` at 40% → 0, drawn only where a sensor cone meets an obstacle (motion-designer's C-14).
- **Frozen exposure (S7).**
  - It is the same zenith exposure as the end of S1, with the caustic render target frozen (f = 1). The die stays in focus exactly where the visitor is asked to act, and the one medium GPU pass never re-runs.
  - The only light that moves is the pad ring powering up and the sea-blue bond-wire pulses.
  - The open-sea margin gets the 3% grain animated at 12 fps (static under reduced motion).

**Texture and photomask grammar (C-15)**
- **Film grain.** A static 256² blue-noise tile in overlay at 3% (2% on phone). It animates only on desktop, at 12 fps, and is static under reduced motion.
- **Dummy fill.** 4-px squares on a 12-px pitch in `--line`, used only where a real die would need density fill (empty die areas, empty slots). Never as general wallpaper.
- **Scribe lanes replace section hairlines.** Every section break is a 32-px band, `--floor-deep`, with 1-px `--line` edges. It carries:
  - a **box-in-box alignment key** at the left margin and a **cross key** at the right, both in `--line-strong`;
  - a **die-ID** in `--t-data` matching the section label: `AG-S2 · ABOUT`, `AG-S3 · LINK LAYER`, `AG-S4 · RISC-V`, `AG-S5 · WISARD`, `AG-S6 · CYBOT`, `AG-S7 · CONTACT`.

  They are aria-hidden and not clickable: no hover state, no sea blue. They add 32 px of height with no layout impact (ux-designer). A scribe lane is where a wafer is sawn into dies, so each section reads as its own die on one reticle.
- **Rails become reticle-edge labels.** The section's die-ID sits in the rail in `--t-data`, with the section name in Newsreader `--t-nav` under it.
- **No vignette in the UI layer.** A slight physical lens falloff (8%) exists in the 3D camera for S1 and S7 only.

**Personal ocean photos (`[SLOT: photo-akash]`, `[SLOT: photo-ocean]`)**
- **Empty, the launch state: the "unexposed frame."** It reads as a plate waiting for light, not as a missing image.
  - Frame: 4:5 (photo-akash) or 3:2 (photo-ocean), with a 1-px `--line` border.
  - Four corner fiducials: 8-px L-marks in `--line-strong`.
  - Dummy fill inside at 60%.
  - One `--t-tag` word, `UNEXPOSED`. The `[SLOT: …]` token lives only in code.
- **Filled: the "exposure."** Photos keep their natural colour with a light grade.
  - Blacks lift to `#0E1312` and highlights cap at `#E8EEF0`. The 3% grain is added.
  - No duotone, no filters, no rounded corners.
  - A mono caption `PLACE · YEAR`, filled in by Akash.
- **`[SLOT: ocean-story]`** is a text line; when empty it collapses to zero height.
- **Project media (`[SLOT: project-media-<id>]`)** is shown **unretouched** in an "inspection frame" (the same fiducials) with the caption `from the project`. Real artefacts are never recoloured, because honesty beats harmony.

**No-WebGL / reduced-motion still look**
- Every section has a pre-rendered **still** from the same scene and camera: AVIF with a JPEG fallback, at 2×, with grain baked in.
- The S1 still is **the focused plate**: dark floor, AKASH / GOJURU in cool light, the seal and pad rings dim at the edges.
- The S2 and S7 die maps are **SVG**, and S7's pads are real links. The S3–S5 sims are the same canvases laid flat in the DOM. S6 is a still of the echo-drawn course.
- It looks finished, not degraded. The only thing missing is the moment of focus.

---

## Composition per section

Grid: 12 columns, 24-px gutters, 64-px outer margin on desktop and 16 px on phone. Pinned bar 56 px on desktop. The phone bottom bar is 56 px plus the safe area (see S1).

### S1-hero
- **Focal point:** the light-name AKASH / GOJURU, centre-right in cols 5–12, then the whole die after the pull-back. The framing keeps the whole word block inside the free region with a 6% margin (motion-designer, C-02).
- **Scale contrast:** the light letters are about 4× the DOM h1 cap height. It is the only place where image type outscales DOM type.
- **Negative space:** the upper-left third is sand and shimmer, tiled to the frame edges (C-05). The lettering stays out of the lower-left quadrant.
- **Caption:** lower left, cols 1–5, on the **ink plate** (solid `--floor-0`, no radius, 32-px padding). From the top (C-01, C-18):
  1. h1 (`--t-display-xl`).
  2. Role line (`--t-lede`, `--sand`): "Computer Engineering, Iowa State. Heading into ASIC design; seeking hardware and chip-design internships."
  3. `[SLOT: grad-term]` ("Graduating <term>"), omitted when empty.
  4. A **four-line project index**: DOM links in `--t-data`, each row a ≥44-px target on phone.
     - BLE Link Layer — senior design, in progress
     - RISC-V 5-stage pipeline — hazard debug, review, docs
     - WiSARD RAM-based classifier
     - CyBot autonomous robot
  5. The ADV_IND decode, which collapses after `CONNECT_IND`.

  There is no CTA in the plate: the pinned `Resume · Contact` pill is the one CTA. On pale sand the plate reads as a cut-out; after the exposure it merges into the floor.
- **Light / 3D:** zenith sun; the camera starts 28° off vertical, close on the letters, and rises to plan view as the focus completes.
- **Where caustics meet the chip:** here they *are* the chip. The light draws the top-metal lettering, and the fill takes the rest of the light.
- **Phone (375):**
  - The lettering zone is the top ~38%, and the plate grows to ~58% of the viewport.
  - ADV_IND is a single mono line at the top of the plate.
  - The top-right pill is hidden and replaced by the **bottom bar** (C-16): 56 px + `env(safe-area-inset-bottom)`, three targets at 144 / 88 / 96 px: `[≡ 3/7 Link Layer ▴]` (`--floor-1`, Newsreader), `[Resume ↗]` (sea fill, ink text), `[Contact]` (`--floor-1`, `--line-strong` border).
  - No horizontal overflow: `scrollWidth === innerWidth` at 375.

### S2-about
- **Focal point:** the die in plan view, cols 7–12, behind a 12% residual exposure. The floorplan (C-06) is the section map:
  - **Radio:** a wide NW block (~3:1) across the top of the core.
  - **CPU:** centre-west (~5:2).
  - **Memory:** east (~3:2).
  - The UART pad is SE, and the contact pads sit on the S reef. The south third of the core stays open lagoon facing them.
  - The name remains in top metal at 12% over the blocks.
- **Die caption** (C-17), at body size, visible beside the die: "An illustrative die. The blocks are projects I worked on; it is not a fabricated chip."
- **Text:** cols 1–5.
  1. The display line in italic `--t-display-l`: *"Light through water. Light through a mask."*
  2. The plain sub-line in `--t-lede`.
  3. The about text, education, skills (a mono row), experience and recognition.
- **Slots:** `[SLOT: photo-akash]` is a 4:5 unexposed frame in cols 1–4 under the text. `[SLOT: ocean-story]` collapses when empty.
- **Negative space:** the gutter between cols 5 and 7, like the channel between the reef and the lagoon.
- **Light:** coaxial microscope. All three layers at 35%.
- **3D:** the die on the dark floor, with aluminium bond wires to the reef.

### S3-linklayer
- **Focal point** (C-06, ux-designer): a **full-width spectrogram band drawn onto the wide radio block's top-metal plane** as a texture (flat DOM canvas on phone and in Still mode).
  - Text sits above the band.
  - A DOM control rail sits under the drawn surface in `--floor-1` with `--line-strong` borders, no pills.
- **Lanes:** 40 horizontal lanes.
  - Advertising 37 / 38 / 39 are `--light` hairlines with mono tags.
  - The 37 data lanes are violet at 20%, rising to 60% when used.
  - Lanes marked bad are hatched `--dim` with ✕. Lost packets are hollow marks labelled `lost` (motion-designer's C-19).
  - A tappable lane gets a sea-blue outline on hover or focus.
- **Ground:** 8% residual exposure. Violet rises in the 2-px block rule and in the sim; everything else stays neutral.
- **Ocean:** the **whale song** is drawn as soft `--light` strokes at 35% drifting across lanes as interference, the only organic curve in the section.
- **Calm field:** the block top under the drawing is flat and unrouted (`--floor-1`, fill at 6%). Routing appears only at the block edges and frames the drawing.

### S4-riscv
- **Focal point:** Bubble Lock, five chambers `IF ID EX MEM WB` **laid along the CPU block** (~5:2) as a drawn texture, with copper-edged chamber walls (2 px). The cycle table runs full width below it.
- **Text:** above or beside it, with the exact role caption: *"My partner led the RTL. I reviewed the design, debugged hazards like these, and wrote the docs."*
- **Palette:** 6% residual exposure, copper raised.
  - Instructions are `--light` mono tokens.
  - A **bubble** is a hollow `--light` circle (1.5-px stroke), the one round shape in the section.
  - The forwarding path is copper at full brightness.
  - A **flush** is a cool-white wave sweeping IF/ID.
- **Scale contrast:** 12-px chamber labels against a 40-px italic sub-head. The tile shows placeholder copy; the wording is creative-director's call.
- **Negative space:** a full empty band above the chambers for the flush wave.

### S5-wisard
- **Focal point:** a centred square **tide pool** on the memory block (~3:2), a window of **lit sand** (`--sand-sun`), with the discriminator bars to its right.
  - It is the only place after S1 where the pale sand returns, because this is where you draw in it. The stroke is `--ink`.
  - The binarised grid shows cells in oxide at 100% for 1 and `--line` for 0.
  - The bars run oxide 35% → 100%; the winner is in `--light`, and ties read "Too close to call" (ux-designer's C-22).
- **Palette:** 4% residual exposure. No accuracy numbers anywhere.
- **Light:** the pool alone gets a soft top-down sun with a 10% shimmer (none under reduced motion). The rest is microscope-flat.
- **Where caustics meet the chip:** the sand you draw on is S1's sand, and the tide that binarises your drawing is the same edge that separated light from dark in the exposure.

### S6-cybot
- **Focal point:** the CyBot off-die past the SE reef, with its sensors drawn as they work (motion-designer's C-14): the PING))) sensor as a forward cone, IR as a short dotted ray, and bump as a contact tick. Obstacle edges appear only where a sensor returns.
- **Ground:** `--floor-deep`, 0% exposure, no metal colour, no sun. The UART line from the SE pad arrives as a 1-px aluminium hairline.
- **Text:** a narrow column, cols 2–6. The `d = v·t/2` readout is in mono.
- **Negative space:** about 70% of the frame is unlit, the darkest point of the plate's journey.

### S7-contact
- **Focal point:** the atoll in straight-down **plan view**, framed on the **south half** of the die (motion-designer's C-10). The reef, the five contact pads, the bond wires and the labelled leads all sit within `100vh − 56px`; the name shows only as a cropped glow at the top.
  - Resume, Email, LinkedIn, GitHub and Reflection sit within the middle 60% of the south edge.
  - Reef labels are DOM chips in `--t-tag`, aria-hidden duplicates of the list.
- **Text:**
  - The DOM pad list on the left is the **primary** control at every size (56-px rows). The 3D pads are aria-hidden pointer twins with `tabindex=-1`.
  - The line in italic `--t-display-m` (C-17): *"Every chip talks to the world through its pads. These are how you reach me."*
- **Light:** the frozen S1 exposure; grain only in the open-sea margin.
  - Pads are `--m5-al` at rest and power up in ring order to 30% sea blue on section entry.
  - On hover or focus a pad goes full sea blue, and its bond wire carries a sea-blue pulse out to the open-sea edge.
- **Where caustics meet the chip:** the light that focused in S1 is still holding the die in focus. The pads are the brightest moving thing, so contact outranks spectacle.

---

## Design tokens

```css
:root {
  /* colour: ground */
  --floor-0:#0E1312; --floor-1:#161C1A; --floor-2:#222A27; --floor-deep:#0A0E0D;
  --exposure:#9CC8E8; /* residual light tint; used as a % over floor-0 per section */
  --exposure-amt:0;    /* S2 .12 · S3 .08 · S4 .06 · S5 .04 · S6 0 */
  --line:#2E3733; --line-strong:#737E83;
  /* colour: sand and light (3D + stills; sand-sun also the S5 pool) */
  --sand-sun:#BAC4C2; --sand-shade:#6E7E80; --caustic:#E6F4FF;
  /* colour: text */
  --light:#E8EEF0; --sand:#A7B5BB; --dim:#85939A; --ink:#0A1016;
  /* colour: action (only) */
  --sea:#3D9DF2;
  /* colour: die layers (inside the die only) */
  --m1-copper:#D08A62; --m2-violet:#A597DD; --m3-oxide:#86C4A8; --m5-al:#C3C9CC;
  /* per-section accent, set on each <section> */
  --block: var(--m5-al); /* S3: var(--m2-violet) · S4: var(--m1-copper) · S5: var(--m3-oxide) */

  /* type */
  --f-serif:"Newsreader", "Iowan Old Style", Georgia, serif;
  --f-mono:"Martian Mono", ui-monospace, "SF Mono", Menlo, monospace;
  --t-display-xl:clamp(48px, 4.4vw, 64px);
  --t-display-l:clamp(34px, 4.8vw, 72px);
  --t-display-m:clamp(26px, 2.8vw, 40px);
  --t-lede:clamp(19px, 1.5vw, 22px);
  --t-body:18px; --t-nav:16px; --t-small:15px; --t-tag:12px; --t-data:13px;
  --lh-display:0.92; --lh-body:1.55;
  --track-display:-0.025em; --track-tag:0.08em;

  /* spacing: 4-px base, 8-px rhythm */
  --s-1:4px; --s-2:8px; --s-3:12px; --s-4:16px; --s-5:24px; --s-6:32px;
  --s-7:48px; --s-8:64px; --s-9:96px; --s-10:128px; --s-11:192px;
  --gutter:24px; --margin:clamp(16px, 4.4vw, 64px);
  --scribe:32px; --bottombar:56px;

  /* radii: Manhattan. 0 everywhere, except the pinned pill */
  --r-0:0; --r-pill:999px;

  /* borders */
  --b-hair:1px solid var(--line);
  --b-ui:1px solid var(--line-strong);
  --b-block:2px solid var(--block);

  /* focus: double ring, ≥3:1 on every ground */
  --focus: 0 0 0 2px var(--ink);
  /* usage: outline:3px solid var(--sea); outline-offset:2px; box-shadow:var(--focus); */

  /* motion hand-off (owned by motion-designer; listed for tokens only) */
  --grain-opacity:.03;
}
/* section ground: progressive exposure */
section { background:
  radial-gradient(60% 70% at var(--focal-x,75%) var(--focal-y,40%),
    color-mix(in srgb, var(--exposure) calc(var(--exposure-amt)*100%), transparent), transparent 70%),
  var(--floor-0); }
```

**Shadows: deliberately none.** Depth comes from surface luminance (`floor-0 → floor-1 → floor-2`) and light, never drop shadows.
- The one glow on the site is the **lit pad**: `box-shadow: 0 0 0 1px var(--sea), 0 0 16px rgba(61,157,242,.35)`.
- Bloom exists only in the WebGL caustic pass.

**No glass and no blur.** The bar scrim is a flat `rgba(14,19,18,.86)`.
**Icons:** one ↗ glyph for external links and ≡ / ▴ in the phone bar, all set as text. No icon library.

---

## References

| # | Reference | What I took | What I changed |
|---|---|---|---|
| 1 | [Tiny Tapeout: Creating Silicon Art](https://tinytapeout.com/guides/creating-silicon-art/) | Top-metal art is a real place where designers sign their chips, which justifies a name drawn in the layout. | Our letters are formed by light, not etched metal, and are routed on an 8 × 12 track grid with strap/jog width variation. |
| 2 | [ZeptoBars: TT04 die shot + GDS](https://zeptobars.com/en/read/tt04-tinytapeout-silicon-inside-gds-sky130) | Real die photos are dominated by power stripes and density fill, so the texture is fill. | Fill is the only texture, used only where a die needs it, and in the hero it is where the light goes. |
| 3 | [Tiny Tapeout GDS viewer](https://gds-viewer.tinytapeout.com/) / [Hackster on the viewer](https://www.hackster.io/news/matt-venn-s-tiny-tapeout-gets-a-shiny-new-interactive-chip-viewer-for-easy-project-browsing-00eef941aed8) | Plan view is the native view of a chip; zooming from die shot to GDS is the engineer's gesture. | No free orbit. Plan view is composed as an editorial plate with captions. |
| 4 | [ArtistIC (arXiv 2502.02626)](https://arxiv.org/html/2502.02626v1) | High-fidelity GDS renders can be beautiful without stylising. | Informs the no-WebGL stills: render the real scene at 2×, don't illustrate. |
| 5 | [Matt Ferraro: Magic Windows](https://mattferraro.dev/posts/caustics-engineering) | Engineered caustics are monochrome light, bright where rays converge and dark where they leave. | That redistribution, plus camera stop-down, became the palette hinge: sunlit plate to exposed plate. |
| 6 | [On Landscape: physics of caustic light](https://www.onlandscape.co.uk/2019/01/physics-of-caustic-light-in-water/) (Kertész's *Underwater Swimmer*, Hockney's pools) | Caustics as a net of hairline filaments with bright cusps. | No pool tile and no pool blue: it's sand, and the net becomes a drawing. |
| 7 | [OSA/FSU: colour, thin films and interference](https://osa.magnet.fsu.edu/teachersparents/articles/colorthinfilmsinterference.html) | Die colours are oxide interference: tan → purple → blue → green → yellow. | Three hues picked from it (copper, violet, oxide green), desaturated, one per block. |
| 8 | [Yellow light in lithography cleanrooms](https://cleanroomtechnology.com/why-yellow-tinted-glass-walls-are-necessary-in) | Litho bays are lit ~590 nm yellow because resist responds to blue and UV. | First became resist amber; after the client's direction (CLIENT-01) it inverted: the accent is now the *exposing* blue end. |
| 9 | [Jerlov water types, depth profiles (Williamson 2023)](https://aslopubs.onlinelibrary.wiley.com/doi/10.1002/lol2.10338) | Clear ocean water (type I) is most transparent near 475 nm, and daylight turns near-monochromatic blue with depth. | Sets the accent `#3D9DF2` and the cool shift of the whole palette. Reds are gone because the water took them. |
| 10 | [Anna Atkins, *Cyanotypes of British Algae* (1843)](https://publicdomainreview.org/collection/cyanotypes-of-british-algae-by-anna-atkins-1843/) | The first photobook was seaweed printed by sunlight through a mask; the sun print is the site's logic. | Refused the Prussian-blue ground (blueprint cliché). Kept the logic, and blue exists only as the actionable light. |
| 11 | Photomask and reticle layout: scribe lanes, alignment keys, die-IDs (standard wafer / reticle practice; cf. the Tiny Tapeout die shots in refs 2–3) | Dies on a reticle are separated by scribe lanes carrying alignment marks and IDs. | Became the section grammar for S2–S7 (C-15), aria-hidden and never interactive. |
| 12 | [Juror list 2026: By-Kin, Iventions, Minh Pham](https://www.hontran.dev/blog/best-award-winning-websites-2026) | Confident editorial type, each project staged as a lit installation, and 3D that frames the work. | Our staging light is a coaxial microscope, not a theatrical spot. |
| 13 | [Igloo Inc (Awwwards SOTY 2024)](https://www.awwwards.com/sites/igloo-inc) | UI made from the world's material. | The ink plate *is* the unlit floor, the pads *are* UI, and section breaks are scribe lanes. No particle morphs, no ice-glass. |
| 14 | [Arm brand refresh (DEPT)](https://www.deptagency.com/case/shaping-the-brand-behind-the-worlds-most-pervasive-tech/) | Semiconductor brands went minimal, built around one graphic device. | Our device is the focused light line, with no gradient arc and no corporate blue. |

---

## Anti-generic

**Directions tried inside concept B and rejected**
1. **Cyanotype.** A Prussian-blue ground with paper-white light, after Anna Atkins. It reads instantly as *blueprint* and *blue ocean*, and leaves no dark for the light to cut into. The sun-print logic was kept. Even after the client's move to blue, blue stays an accent, never a ground.
2. **Daylight shallows.** Pale sand and ink type everywhere. Caustic light has no drama on a bright ground, and moving light behind text fails contrast. It survives as the S1 opening and the S5 tide pool.
3. **Chosen: the sun print.** It moves from a sunlit plate to an exposed plate by conservation and camera exposure, then **keeps developing down the page** (C-15). It has one accent with one meaning, and die colours stay inside the die.

**What this site does not look like**
- **"Tasteful dark editorial"** (the critic's C-15). There is no cream serif (the text is cool paper) and no uppercase mono on every rail (mono is data and pads only). Hairlines became scribe lanes, alignment keys and die-IDs, and the ground carries a residual exposure that fades section by section.
- **Ocean clichés.** No teal-to-navy "ocean" gradients, no cyan `#90E0EF` with coral `#FF7438`, no Prussian or blueprint blue grounds, no default UI blue.
- **Glass.** No glassmorphism, backdrop blur or frosted cards.
- **Particle kits.** No generic particle fields, plankton motes, bubbles, god-rays, fog or jellyfish.
- **Hardware clichés.** No PCB-green traces, Tron glow lines, Matrix rain, fake HUD brackets or fake telemetry.
- **Default typefaces.** No Inter, Space Grotesk, JetBrains Mono, Playfair or Cormorant (the ui-ux-pro-max search offered Playfair + JetBrains, and I refused), and no faux small caps.
- **AI-style colour.** No purple-blue AI gradients, mesh blobs or neon.
- **Template furniture.** No rounded cards, bento grids, drop shadows or icon libraries.
- **Pixel type.** No 8-bit or LCD letterforms. The light-name is routed metal with strap/jog widths (C-04).
- **Decorative caustics.** The only caustics form the layout (S1), frozen in focus for S7, with an open-sea swell that stops by the end of S1.

---

## Revisions

C-03 — accepted: target luminance rebalanced so the name dominates. Letters 1.0, pads 0.35, seal ring 0.30, straps 0.20, fill 0.20 at a 3-track (~24 px) pitch with a 2.5-track (~20 px) keep-out (motion-designer measured 0.12 as leaving the core grey), core 0.02. Ambient ramps 0.35 → 0.02 and camera exposure stops down ~4×. Acceptance: letters ≥3× fill and ≥8× core (solver 6.3× / 19.2×). The style tile prints its measured ratios live.
C-04 — accepted: one canonical glyph set on an 8 × 12 track grid, with 1.5-track straps, 1-track jogs, single-jog K/R legs and vias only at free ends. It is embedded as JSON in 04-art.md ("Glyph set"), and the style tile and motion-designer's proofs draw from it.
C-15 — accepted: photomask grammar for S2–S7 (scribe lanes with alignment keys and die-IDs, reticle-edge rails). Progressive exposure runs S2 12% → S6 0%. Uppercase mono is limited to pads, tags and data. Nav and rails are Newsreader sentence case, because Newsreader has no true small caps and faux ones are refused. Cream text became cool paper.
C-16 — accepted: the style tile builds the 02-ux phone bottom bar (56 px + safe area; targets 144/88/96: ≡ 3/7, Resume ↗, Contact), hides the top pill below 768 px, fixes the horizontal overflow, and asserts `scrollWidth === innerWidth` at 375. Motion-designer has been told that its proofs need the same.
CLIENT-01 — accepted: amber → ocean blue #3D9DF2 (`--sea`; 6.52:1 on #0E1312, ink text on it 6.65:1). Caustic, sand, text and ink tokens shifted cool (`--caustic` #E6F4FF, `--sand-sun` #BAC4C2, `--light` #E8EEF0, `--ink` #0A1016). The accent role is unchanged: interactive elements only.
