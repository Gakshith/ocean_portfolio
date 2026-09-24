# Contract: phase 1 (build order steps 1–4)

Frozen by the lead (Ocean_main_agent) on 2026-09-24. The source of truth is
[`design/06-final-plan.md`](design/06-final-plan.md); this file only fixes the seams between
slices. Changes go through the lead only (`CONTRACT | change | why`).

Phase 1 is the no-WebGL Still site. **No three.js, R3F, GSAP or Lenis.**

## Ownership

| Owner | Paths | Branch |
|---|---|---|
| lead | `package.json`, `vite.config.ts`, `tsconfig*`, `index.html`, `scripts/`, `src/main.tsx`, `src/entry-server.tsx`, `src/App.tsx`, `src/styles/tokens.css`, `src/contract.test.tsx`, `docs/contract.md` | `dev` |
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

S7 "Write a message" renders only when `import.meta.env.VITE_FORMSPREE_ID` is set
(see `.env.example`). The client supplies the ID later.

## Gates (DONE needs proof)

- `npm test`, `npm run build` and `npm run lint` are green on the branch, synced with `dev`.
- `src/contract.test.tsx` still passes (the lead's seam test).
- UI: screenshots at 1440×900 and 375×667, and `scrollWidth === innerWidth` at 375.
- Per-slice gates are in each kickoff and the plan's build order.
