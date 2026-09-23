# 00 — Brief

Owner: creative-director. Source of truth: [`../vision.md`](../vision.md) and [`../content.md`](../content.md).
Nothing here adds facts about Akash. Anything the story needs that is not in content.md is a **`[SLOT: …]`**.

## Goal
A portfolio for **Akash Gojuru** (Computer Engineering, Iowa State, heading to ASIC / chip design) in which
the ocean and the chip are **one world**. The ocean is not a theme painted over a tech site; the
metaphor must be *load-bearing*: the site's structure, motion and navigation come from a real
chip-design idea that also happens to be true of the sea.
It must be award-tier (Awwwards / FWA calibre), cinematic and three.js-grade, and still read as serious
to a hiring engineer at a chip company.
It is a rival to the existing "Silicon City" concept, so no city, skyline, street or building metaphor.

## Audience
1. **Primary:** recruiters and hiring engineers for hardware / ASIC / chip-design internships. Scan fast,
   often on a laptop between calls, and sometimes on a phone from a LinkedIn link. They know what RTL,
   a pipeline and a hazard are, so jargon used *correctly* earns trust and jargon used as decoration loses it.
2. **Secondary:** professors, club peers (ChipForge), senior-design advisor, other students. They share it.
3. **Tertiary:** Awwwards / FWA juries. They reward one strong idea executed without compromise.

## Primary action
**Open the resume or contact Akash** (email, LinkedIn, form) within the first visit.
The 30-second test: a recruiter who scrolls for 30 seconds leaves knowing **who he is, what he built,
and how to reach him**. Resume and contact are reachable from every scroll position and are never hidden
behind a reveal, a loader or a gesture.

## Content inventory
Real content only (from content.md):
- **Identity:** Akash Gojuru · Computer Engineering student, Iowa State University · about text (digital hardware
  design, embedded systems, computer vision; seeking hardware / chip-design internships).
- **Education:** B.S. Computer Engineering, Iowa State.
- **Skills:** VHDL, Verilog, C++, Java, C, Python.
- **Experience:** Tech Support Assistant, Iowa State (CELT).
- **Recognition:** Dean's List · ChipForge Club member.
- **Projects (4):**
  1. RISC-V 5-stage pipelined processor: VHDL / SystemVerilog / QuestaSim, a two-person team. His role was design
     review, hazard debugging and documentation (the partner led the RTL, so do **not** claim he wrote the RTL).
  2. CyBot Roomba (CPRE 2880): C, microcontroller, timers, interrupts, UART. Three-person team. The robot navigates
     autonomously on bump, IR and PING (ultrasonic) data only.
  3. WiSARD weightless neural network: a RAM-based classifier that turns input into binary vectors and uses them as addresses, trading memory against accuracy for edge devices.
  4. **Senior design (Jan–Dec 2026, in progress):** an open-source BLE microcontroller, advised by Dr. Henry Duwe. His part is the
     digital Link Layer: advertising, scanning, connections, PDU decode and generation, state machines and CSA#1 channel
     selection. Python, C, Verilog.
- **Documents:** Resume PDF (`RESUME_IBM_1.pdf`) and Cumulative Reflection PDF.
- **Contact:** gojuru18@iastate.edu · linkedin.com/in/akash-gojuru · github.com/Gakshith · contact form.
- **Slots, left empty and never invented:** `[SLOT: ocean-story]` (diving, surfing, places), `[SLOT: photo-akash]`,
  `[SLOT: photo-ocean]`, `[SLOT: project-media-<id>]` (waveforms, diagrams, robot photos). Every concept must
  look finished with every slot empty.

## Constraints
- Design phase only. No implementation.
- Honest content: no fabricated metrics, testimonials, roles or achievements. Project claims must match
  content.md exactly, including team roles.
- Usability first: persistent nav; resume and contact always one tap away; no scroll-jacking that blocks reading;
  every content block is real, selectable DOM text (not text rendered in the canvas).
- Phone: works at 375 px with a lighter scene. **No WebGL:** a complete static version with the same story beats.
  **`prefers-reduced-motion`:** no camera travel, and every reveal becomes a cross-fade or is simply shown.
- Performance: must hold 60 fps on a mid-range laptop and must not jank on a mid-range phone. The first meaningful
  text (name + role + resume link) is in the HTML, not behind the 3D load.
- No city or skyline metaphor, and no reuse of Silicon City.
- Chip semantics must be correct. A chip engineer will notice a wrong term.

## Stack
Three.js with the WebGPU renderer and a WebGL2 fallback, shaders written in TSL so one codebase serves both;
React Three Fiber; GSAP ScrollTrigger; Lenis smooth scroll. The site is static-hostable (GitHub Pages
is his current host). Audio is optional, off by default, and user-initiated only.

## References
Researched 2026-09-22. What to learn from each, and what is overdone.

| # | Reference | Learn | Avoid / overdone |
|---|---|---|---|
| 1 | [Igloo Inc](https://www.awwwards.com/sites/igloo-inc) (abeto, Awwwards Site of the Year 2024) | One material world, completely coherent: every UI element feels made of the same ice. We want every UI element to feel made of the same water and silicon. | Particle-morph transitions between every section; the effect has become a genre. |
| 2 | [Bruno Simon folio 2025](https://bruno-simon.com/) ([code notes](https://deepwiki.com/brunosimon/folio-2025)) | TSL lets one codebase run on WebGPU or WebGL automatically. Play makes people share a site. | Game-as-portfolio: a recruiter will not drive a car to find a resume. Too slow for our 30-second test. |
| 3 | [Lusion v3](https://www.awwwards.com/sites/lusion-v3) | Materials and light with physical weight, and restraint. A few research-grade shaders are better than many cheap ones. | Nothing to avoid; it sets the ceiling. |
| 4 | [Oryzo by Lusion](https://oryzo.ai) (via [Utsubo 2026 list](https://www.utsubo.com/blog/best-threejs-websites-2026)) | "Sell one object properly": one hero object with inertia and depth. **For us, the object is the die.** | — |
| 5 | [Cartier Watches & Wonders](https://www.cartier.com/watchesandwonders) (Immersive Garden) | One room per item is better than one long scroll: each project gets its own space and staging. | Luxury slowness: long transitions between the rooms. |
| 6 | [The Sea We Breathe](https://www.awwwards.com/sites/the-sea-we-breathe) (Awwwards SOTD, [CSSDA WOTM](https://www.cssdesignawards.com/wotm/the-sea-we-breathe/40014/)) | Underwater journeys carried by sound and narration; the atmosphere does the storytelling. | The standard underwater kit of blue fog, god-rays, drifting plankton and bubbles. Used alone it reads as a stock asset. |
| 7 | [OceanX 2025](https://www.awwwards.com/sites/oceanx-2025) (Unseen + Propagande, SOTD 7.44) | A WebGL intro transition and a timeline. Creativity scored highest and development lowest, so spectacle without engineering polish is marked down. | The cyan #90E0EF + coral #FF7438 palette is the default ocean palette. The horizontal timeline. |
| 8 | [neal.fun: The Deep Sea](https://neal.fun/deep-sea/) | A depth number that keeps changing is compulsive. Scale can itself be the story. | **Descent with a depth meter is now owned by this site.** Any "scroll = dive" concept has to go beyond it. |
| 9 | [Tiny Tapeout GDS viewer](https://gds-viewer.tinytapeout.com/) + [silicon art guide](https://tinytapeout.com/guides/creating-silicon-art/) | Real layout (GDSII) looks nothing like the green circuit-board clip-art cliché: Manhattan routing, metal layers, fill, and top-metal art hidden on real dies. Using the real visual language earns trust from chip engineers. | PCB-green traces and "Tron" glow lines presented as "chip design". |
| 10 | [Minh Pham](https://minhpham.design) and [By-Kin](https://by-kin.com) (via a [2026 juror list](https://www.hontran.dev/blog/best-award-winning-websites-2026)) | Restrained 3D that frames the work; weighted scroll; continuous directed transitions instead of hard cuts. | "Animation for its own sake"; decorated templates. |
| 11 | [IVRESS](https://brand.ivress.co.jp) (Utsubo) | Shipped WebGPU with a WebGL fallback in production, so our stack is proven. | — |
| 12 | Chip-domain sources: [BLE channel selection (MathWorks)](https://www.mathworks.com/help/bluetooth/ug/bluetooth-le-channel-selection-algorithms.html), [eye diagrams (Altium)](https://resources.altium.com/p/what-eye-diagram), [clock tree synthesis (SoC Labs)](https://soclabs.org/design-flow/clock-tree-synthesis) | Real mechanisms we can stage: BLE uses 40 channels, 3 advertising (37/38/39) and 37 data. CSA#1 picks `next = (last + hop) mod 37`. An eye diagram opens as the signal gets cleaner. An H-tree clock gives equal path length to every leaf. The flow runs RTL → synthesis → place & route → tapeout. | Using any of them as decoration. Each must drive structure or interaction, or it is cut. |

**Overdone in 2025–26, to stay away from:** preloaders showing a percentage for 8 s; a "scroll to begin" hero with no
content; cursor-follow blobs; particle-morph logos; drive-around game portfolios; PCB-green circuit clip-art;
the generic underwater kit (fog, god-rays, bubbles, jellyfish); the cyan and coral ocean palette; horizontal timelines;
magnetic buttons on everything.

## Success looks like
- **30-second test passes:** in 30 s of scrolling, a recruiter can name his school and field, one project and
  where the resume is. The test is run with real people on the static version and on the 3D version.
- A chip engineer finds **zero wrong terms**, and at least one says "that's actually how it works."
- A person who isn't an engineer can retell the signature moment in one sentence.
- Lighthouse 90 or better for performance and accessibility on the static / no-WebGL path. The 3D path holds 60 fps on a mid-range laptop.
- Every `[SLOT]` can be empty at launch and the site still looks finished.
- It is good enough to submit to Awwwards / FWA, and specific enough that it could not be anyone else's portfolio.
