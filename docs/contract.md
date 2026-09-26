# Contract: phase 1 (build order steps 1–4)

Frozen by the lead (Ocean_main_agent) on 2026-09-24. The source of truth is
[`design/06-final-plan.md`](design/06-final-plan.md); this file only fixes the seams between
slices. Changes go through the lead only (`CONTRACT | change | why`).

Phase 1 is the no-WebGL Still site. **No three.js, R3F, GSAP or Lenis.**

## Ownership

| Owner | Paths | Branch |
|---|---|---|
| lead | `package.json`, `.env.production`, `vite.config.ts`, `tsconfig*`, `index.html`, `scripts/`, `src/main.tsx`, `src/entry-server.tsx`, `src/App.tsx`, `src/styles/tokens.css`, `src/contract.test.tsx`, `docs/contract.md` | `dev` |
| chrome_agent | `src/chrome/**`, `src/state/**` | `feat/fast-path` |
| sections_agent | `src/content/**`, `src/sections/**`, `src/svg/**`, `src/styles/**` except `tokens.css`, `public/**` | `feat/still-site` |
| sims_agent | `src/sims/**` | `feat/sims` |

Files marked `STUB (lead, freeze commit)` belong to the named owner, who replaces them and
keeps their exports. Need a dependency or a lead-owned change? Ask the lead.

## Global rules

- **SSR-safe.** The build prerenders `<App/>` (`renderToString` → `dist/index.html`, then
  `hydrateRoot`). No `window`, `document`, `localStorage`, `matchMedia`,
  `IntersectionObserver` or randomness during render. Read them in effects or store
  subscriptions. The first client render equals the server HTML.
- **Base** is `/ocean_portfolio/` (GitHub Pages). Build public URLs from `import.meta.env.BASE_URL`.
- **`js` class** is set on `<html>` by an inline script in `index.html` (lead). chrome sets
  `data-still`, `data-reduced-motion` and `data-calm` live.
- **CSS.** chrome's `src/chrome/chrome.css` holds only `html` scroll-padding and the phone
  `body` padding-bottom. Every other base rule is in sections' `src/styles/base.css`. Each
  slice imports its own CSS from its own modules. Tokens only, no raw colours.
- **Copy** comes only from `docs/content.md` and the plan's frozen lines.

## App shell (lead)

```tsx
<Chrome />                                   // src/chrome
<main id="main" tabIndex={-1}><Sections /></main>   // src/sections
<Footer />                                   // src/sections
```

## 1. Sections (chrome_agent, `src/state/sections.ts`)

`SECTIONS = [{ id, n, beat, nav, eyebrow }]` in S1..S7 order, plus `type SectionId`:

| id (= hash) | n | nav | eyebrow |
|---|---|---|---|
| `top` | 1 | Top | — |
| `about` | 2 | About | — |
| `link-layer` | 3 | Link Layer | Radio |
| `risc-v` | 4 | RISC-V | CPU |
| `wisard` | 5 | WiSARD | Memory |
| `cybot` | 6 | CyBot | Off-die |
| `contact` | 7 | Contact | — |

Markup (sections_agent): `<section id={id} data-section={id} aria-labelledby={`${id}-title`}>`,
with the heading `id={`${id}-title`} tabIndex={-1}`. S1's heading is the only `h1`
(`top-title`). In-page links are plain `<a href="#id">`, which work without JS.

## 2. Motion (chrome_agent, `src/state/motion.ts`)

`useMotion(): { reducedMotion, stillChosen, still, calm, setStill }`, plus `useReducedMotion()`,
`useStill()` and `motionStore.get() / subscribe()`. SSR default is all `false`.

- `still = stillChosen || reducedMotion || !has3D`: the visual skin. It is always `true`
  after hydration in phase 1.
- `calm = stillChosen || reducedMotion`: no auto-motion. **Sims gate autoplay on `calm`.**
  Jumps and the Interrupt are instant, and S7 pads rest lit.

## 3. Pause bus (chrome_agent, `src/state/pause.ts`)

`usePaused()` · `pauseBus.isPaused()` · `pauseBus.subscribe((paused, reasons: Set<'interrupt'|'hidden'>) => unsub)`.
Fires synchronously when the Interrupt opens; it's temporary, so sims resume in place.
`registerContextSaver({ save, restore })` is a no-op slot for the phase 2 camera.

## 4. Jumps and UI (chrome_agent, `src/state/jump.ts`, `src/state/ui.ts`)

- `jumpTo(id)`: instant scroll, `replaceState('#id')`, focus `#id-title` (preventScroll).
  `onJump(fn) => unsub`. A delegated listener upgrades every `a[href="#sectionId"]`.
- `openInterrupt(opener?)` · `openKeys()` · `closeOverlay()`. The footer's Still and Keys
  buttons use `setStill` / `openKeys`.
- Shortcuts `R` and `?` are ignored in form fields, `contenteditable` and inside
  `[data-no-shortcuts]` (the Tide Pool pad and grid, the Teach name field, the Hop chip grid).

## 5. Content (sections_agent, `src/content/content.ts`)

- `Slot<T> = T | null`. Empty slots are `null` and render nothing, or the UNEXPOSED frame.
- `identity { name, role, gradTerm: Slot<string>, … }`
- `links { resume, reflection, email (+ address), linkedin, github }`, each `{ label, href }`.
  Resume is `BASE_URL + Akash_Gojuru_Resume.pdf` (client decision, replacing
  `RESUME_IBM_1.pdf`), and Reflection is `BASE_URL + Akash_Gojuru_Reflection.pdf`.
  **No other file hard-codes these.**
- `projects: readonly Project[]` in plate order, `{ key, section, index }` (`index` is the
  plate line verbatim).
- `dieCaption`: the frozen wording.

Consumers: chrome uses identity, links and projects. sims uses only `dieCaption`.

## 6. Floorplan (sections_agent, `src/svg/floorplan.ts`)

`DIE { w: 100, h: 100 }` · `blocks[] { section, label, x, y, w, h, layer }` · `uartPad`.
The minimap (chrome) imports it.

## 7. Sims (sims_agent, `src/sims/index.ts`)

It exports `Hop`, `BubbleLock`, `TidePool` and `CybotStill`, each with props `{ headingId: string }`
at 100% of the column width, and each handles its own phone layout.

- sims render the rail, the surface, the DOM twins with their `h3`s, the live region, the S4
  cycle table and the S6 caption "Illustrative course, not a recording."
- sections render the `h2`, body, chips, slot frame, the S3/S4 data lines, the S5 honesty
  line, the S6 why-off-die line and Next/Back.
- Autoplay = `!calm && !paused && inView && !userPaused`, starting only after mount.
- The dev-only harness lives in `src/sims/__demo__/`. It isn't exported or part of the build.

## Form

S7 "Write a message" renders only when `import.meta.env.VITE_FORMSPREE_ID` is set, and it
POSTs to `https://formspree.io/f/${VITE_FORMSPREE_ID}`. The client's ID (`xvkgqbpl`) is in
`.env.production`, so production builds render the form. `npm run dev` doesn't render it
unless you run `VITE_FORMSPREE_ID=xvkgqbpl npm run dev`.

## Gates (DONE needs proof)

- `npm test`, `npm run build` and `npm run lint` are green on the branch, synced with `dev`.
- `src/contract.test.tsx` still passes (the lead's seam test).
- UI: screenshots at 1440×900 and 375×667, and `scrollWidth === innerWidth` at 375.
- Per-slice gates are in each kickoff and the plan's build order.

## Rulings (lead, during build)

- **R-P1-01 · Footer "How the light works" is not rendered in phase 1.** Its copy describes a
  live refraction and a baked still, and phase 1 has neither: the S1 still is a temporary SVG
  drawing until the step 5 bake. Keep the verbatim copy and both links in `content.ts`
  (Yue et al. 2014: https://doi.org/10.1145/2580946), but don't render the `<details>`.
  Phase 2 turns it on and writes a truthful Still-mode variant once the bake exists.
  Brief (honesty) wins over the plan's copy.
- **R-P1-02 · S3 data line is in first person:** "…a teaching model running in your browser,
  not my silicon". This matches the site's voice (S4 "not our RTL"). It changes voice only,
  not facts.
- **R-P1-03 · Phone Resume is tab stop 4.** The plan's phone bar is visually
  `[chip][Resume][Contact]`, and DOM order must match visual order (WCAG 2.4.3). So on phones
  it's skip → wordmark → chip → Resume. Desktop and tablet keep Resume at tab 3. Still one
  click on every size.
- **R-P1-04 · Phone bottom-bar chip is `1fr`, not a fixed 144px.** Fixed 144+88+96 + gaps +
  margins = 368px, which overflows at 320px. Resume (88) and Contact (96) stay fixed, and the
  chip takes the rest (151 at 375).
- **R-P1-05 · The 60 KB font budget covers the render-critical, preloaded font only**
  (Newsreader roman). The plan itself loads Martian Mono and the italic non-blocking, outside
  first paint. Italic and mono weight is an open item for step 10's performance traces, not
  a phase 1 gate.
- **R-P1-06 · The S5 honesty line is italic, not bold.** The plan's `**…**` is markdown
  emphasis, and the tokens say "body emphasis is italic, never bold".
- **R-P1-07 · Tide Pool inked cells are `--ink` on `--sand-sun`, not oxide.** Oxide on sand
  is about 1.1:1 and fails the 3:1 non-text contrast rule (WCAG 1.4.11); the plan's order puts
  accessibility above looks. Oxide stays in the discriminator bars and the winner. Bubble
  Lock's optional desktop drag-in is deferred; the plan marks it optional.
- **R-P1-08 · S2 facts come before the die map on phone.** The facts `<dl>` sits in the text
  column, so DOM order matches visual order at every size (WCAG 1.3.2). The plan's phone note
  placed the facts after the die; the plan's order puts accessibility above that layout detail.
- **R-P1-09 · The phone S1 split is measured inside the two bars.** The plan keeps the 56px
  top bar on phone (only the top pill goes; 02-ux: "Top bar 56px and phone bottom bar 56px"),
  and the ~38/58 split came from a proof with neither bar. Phone S1 tightens plate spacing
  on the spacing tokens (about 163px of drawing at 375×667). The 44px index rows and the
  `--t-lede` role line are never shrunk. The phase 2 lettering zone is sized again on real
  phones.
- **R-P1-10 · A stalled instruction reads "(stall)" in both the chambers and the cycle
  table.** It's the standard term for the chip-engineer audience, and one word for one state.
  This supersedes the plan's R-08 "(held)" wording; the bubble cell stays "bubble".
- **R-P1-11 · No die caption in the footer in phase 1.** S7's caption sits directly above it,
  in the same viewport. C-17's honesty line still appears in S2, the three rails and S7.
- **R-P1-12 · Sub-headings sit one step below `--t-display-m`.** The S2 "On this die" h3 and
  the sims' "Try it: …" h3s use `--t-lede`, so the S7 h2 is the only 40px heading at its
  level. Sim tags use `--t-tag` (12px), with no off-token 11px.

---

# Contract: phase 2 (build order steps 5–10)

Frozen by the lead (Ocean_main_agent) on 2026-09-26. Phase 1 seams and rulings above still
hold. Same change rule: `CONTRACT | change | why`, through the lead only.

## Ownership

| Owner | Paths | Branch |
|---|---|---|
| lead | as phase 1, plus `src/gl/index.tsx` stub, the App mount, the DOM hooks below | `dev` |
| bake_agent | `scripts/bake/**`, `public/bake/**`, `src/bake/**`, `src/scroll/**`, `src/state/**`, `src/chrome/**`, `src/sims/cybot/**`, `src/sections/S1Hero.tsx`, `src/svg/HeroStill.tsx` (delete), the `.s1-stage` / `.hero-still` rules in `src/styles/sections.css`, `src/sections/Footer.tsx` | `feat/bake` → `feat/scroll` |
| webgl_agent | `src/gl/**` (engine, TSL shaders, loader, tiers, camera, reef, lazy `gl.css`, ADV_IND and lead-chip DOM) | `feat/hero` → `feat/reef` |
| p2_reviewer | reviews only; holds the Playwright MCP browser | — |

Files marked `STUB (lead, phase 2 freeze)` belong to the named owner, who replaces them and keeps
their exports. Step 9 (sims on blocks) is assigned after step 8.

## App shell and DOM hooks (lead, freeze commit)

- `<Gl3D />` (`src/gl`) is App's first child. It renders `null` on the server and on the first
  client render; all 3D work runs in effects.
- `data-gl-avoid` on the S1 plate, the top bar (`.c-bar`) and the phone bottom bar (`.c-bbar`):
  the fitted framing's free region excludes these.
- `data-gl-stage="about"` on the S2 die-map frame, `data-gl-stage="contact"` on the S7 stage
  (S3–S5 surfaces added in step 9): the die or block lands in this rect.
- `<div data-adv-slot aria-hidden="true">` is the last child of the S1 plate (ADV_IND portal).
- S7 rows already carry `data-pad="1..5"`.

## Seam 1: bake → webgl (bake_agent owns)

| file | format |
|---|---|
| `public/bake/slope-512.f16` | 512², RG interleaved, IEEE half LE, no header, 1 MiB. Row 0 = south (GL order), col 0 = west. Covers p ∈ [-1,1]², texel centre p = -1 + (i+.5)·2/512. R = ∂h/∂x, G = ∂h/∂y (north-up; three z = -y). HalfFloat, NoColorSpace, Nearest, no flipY / premultiply / mips. Fetched with `?v=<sha8>`. |
| `public/bake/slope-256.f16` | same format, 2×2 box average (low tier and phones) |
| `public/bake/traces-512.u8` | 512² Uint8, same orientation: 255 · (15×15 box blur of letters ∪ straps), the residual-calm mask |
| `public/bake/s1.avif` (+ `-640/-1024/-1600`) | the focused plan frame (Still, reduced motion, phone freeze). `fetchpriority=high`, ≤ 60 KB at the largest width, never out-paints the plate text |
| `public/bake/poster.avif` | the P = 0 shimmer. Fetched only by webgl's loader, never on the Still path. ≤ 60 KB |
| `public/bake/block-{radio,cpu,memory}.avif`, `s6.avif` | plan stills |
| `public/bake/manifest.sha256` | `npm run bake -- --check` re-bakes and verifies byte-identical outputs |
| `src/bake/bake.json` | `BakeMeta` (`src/bake/meta.ts`), bundled by import |
| `src/bake/target.ts` | pure-TS target builder, shared by the bake CLI and webgl's test-only contrast check |

- **R-P2-05 · Margin (open question 3), amended 2026-09-26.** Solve the tile with Neumann
  boundaries (a mirror-extended periodic 1024² domain; a uniform periodic margin was measured
  not to decay: ~28 texels of displacement at the edge). Ship the 512² [-1,1] crop with slope = 0
  outside. The lagoon carries swell only out to |p| = 3, and webgl ramps the swell from lagoon to
  sea over |p| 1.5 → 3 (runtime only). Acceptance:
  1. normal displacement at the edge ≤ 0.5 texel (the tangential shear, ~20 texels, is harmless and reported);
  2. band I = 1.00 ± 0.02 from 3 texels inside the edge, with the last 3 texels ≤ 6%;
  3. crop vs the mirror-continued full render ≤ 1% rms at display scale;
  4. LF ≥ 3 and LC ≥ 8.

  The seam verdict is the reviewer's screenshot of the live render.
- **R-P2-06 · The name is ~82 die units wide at 6.5 texels/track** (the proof's density; the
  phase 1 SVG's 66 would be 5.2, under the ~6 floor). The exact letter bbox is in `bake.json`.
- **R-P2-07 · Two images.** `poster.avif` is the 3D's first frame. `s1.avif` is the focused still.
  The Still path never downloads the poster.

## Seam 2: scroll → webgl (bake_agent owns)

Typed stubs: `src/scroll/{clock,scroll,windows,index}.ts` and the phase 2 fields in
`src/state/motion.ts`.

- `clock` (gsap.ticker, `lagSmoothing(0)`): each tick runs Lenis.raf → ScrollTrigger.update →
  scrollStore emit → frame fns. `add(fn)` → unsub; `fn` returns true to request the next tick
  and is never called while `pauseBus` is paused. `invalidate()` / `takeInvalidated()`. It
  sleeps (no rAF) when idle; 1s idle = 0 rAF is tested.
- `scrollStore`: `{ y, heroP, from, to, t, dwellPx }`. `heroP` is the S1 pin progress (120vh ≥ 768,
  100vh < 768), emitted from the first tick after `load3D`, and 1 when there's no pin.
- `TRAVEL`: one table of camera travel windows in scroll-y px. The default is
  `[top(to) − vh, top(to) − 0.3vh]`; cybot>contact is `[top(contact) − 0.6vh, top(contact) + 0.4vh]`.
- `jumpTo(id)` goes through `lenis.scrollTo(dwellStart, { immediate: true })`, with a 120/200
  DOM cross-fade unless `calm`, then focuses `#id-title`. `onJump(fn(id, { from, instant }))`, where
  `instant = calm || still`. Nothing fires on first paint or hash load.
- `pauseBus` / `registerContextSaver` are unchanged. webgl saves the camera pose; scroll saves
  scrollY and stops Lenis on `interrupt`.
- Motion store additions: `has3D`, `load3D`, `off3D`, `setHas3D(ready)`, `DEFAULT_3D = false`.
  - `load3D = capable && !reducedMotion && (?3d=1 || (!stillChosen && DEFAULT_3D-or-stored-on && !(deviceMemory ≤ 2) && !saveData))`.
  - `still = !has3D || stillChosen || reducedMotion`.
  - The S1 pin keys on `load3D` (intent), so the layout is fixed before the first frame. If
    `load3D` goes false, the pin unmounts with same-frame scroll compensation.

## Phase 2 rulings

- **R-P2-01 · Entry budget.** Entry HTML+CSS was 29.3 / 30 KB gzip at the freeze. All gl and
  loader CSS ships lazily with the 3D chunk (`src/gl/gl.css`, every rule scoped under
  `html[data-still="false"]`). New entry CSS must fit the headroom. The reviewer gates on it.
- **R-P2-02 · The toggle shows the effective state**, plus why 3D is off (`off3D`). The phase 1
  "Still OFF" while `data-still=true` goes away.
- **R-P2-03 · `?3d=1` = pressing "Turn on 3D".** It overrides the default-off gate, the
  deviceMemory hint, saveData and a stored Still choice for that visit. It never overrides
  reduced motion or a missing WebGPU/WebGL2. Flipping the default is the one line `DEFAULT_3D`.
- **R-P2-04 · S7 caption:** the R-01 frozen wording only, never the proof's "my projects".
- **R-P2-08 · Footer "How the light works"** renders again. With 3D on it uses the plan's verbatim
  copy. In Still, the second sentence becomes: "This page shows that result as a still image,
  rendered offline from the same surface; with 3D on, your browser refracts it live, every frame."
- **R-P2-09 · No React Three Fiber.** Plain `three/webgpu` + TSL with an imperative engine.
  Measured: R3F adds +165 KB min+gz (classic three + react-reconciler) and a second render loop
  that fights the one clock. Performance ranks above the stack line in the plan's order.
- **R-P2-10 · Phone < 45 fps for 2s** stops the caustic passes and hard-swaps to `s1.avif` inside
  the pinned stage, with no layout change. `setHas3D(false)` is only for unrecoverable failure
  (init fails, or the context isn't restored within 3s).
- **R-P2-11 · `s6.avif` is the SE-reef crop** (the die corner with the UART pad at the frozen S1
  exposure), not a 0%-exposure frame, which would be a flat rectangle. It is a lazy, aria-hidden
  backdrop at the S6 stage's left edge in both the scrub and the Still SVG, where the UART
  hairline meets the baked pad. ≤ 25 KB. ~70% of the frame stays unlit, fading into
  `--floor-deep` with no hard edge.

## Phase 2 gates (in addition to phase 1's)

- Every number is labelled with its backend (WebGPU or WebGL2).
- Step 5: `npm run bake -- --check` is byte-identical; RG16F precision ≤ 1% rms; letters ≥ 3× fill
  and ≥ 8× core on the baked field; poster and s1 ≤ 60 KB.
- Step 7: `framingTest` passes at 1280×720, 1440×900, 1920×1080, 375×667 and 390×844; 60 fps
  during the focus on desktop; 0 idle frames; with 3D off the Still path is unchanged and
  Lighthouse stays ≥ 90.
- Reviewer bars: no lagoon/open-sea seam (the proof shows it at x ≈ 518 at P .5, and at
  x ≈ 465/570 at P 1, at 1440). Letters at P .45–.55 are at least as sharp as the proof's.
  S7 visibly beats the flat SVG proof.
