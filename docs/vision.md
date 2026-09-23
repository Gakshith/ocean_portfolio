# Vision — ocean_portfolio

The client's vision, written by the orchestrator. This is the input to the design team.
It says **what** the site must be and feel like. It does not design anything.

## Who it is for
**Akash Gojuru** — Computer Engineering student at Iowa State University, heading toward
ASIC / chip design. He is also an ocean lover. The site is his portfolio.

## The one-line vision
A portfolio where his engineering identity and his love of the ocean are **one world**,
not a tech site with a water theme painted on top.

## Must feel
- Professional — a hiring engineer at a chip company takes him seriously.
- Modern and cinematic — it moves like a film, not a template.
- Highly creative and award-worthy — the kind of site that gets shared and gets on
  Awwwards / FWA. Not a normal portfolio template.
- Immersive, three.js-grade 3D experience.

## Decisions already made (by the client)
| Question | Answer |
|---|---|
| How literal is the ocean? | **Fused hybrid.** Ocean and chip are one world. The client's own example: going deeper in scroll = descending through the design stack; signals glow like bioluminescence. This is a direction, not a finished concept — the team may beat it. |
| Relation to the existing `projects/AkashPortfolio` ("Silicon City") | **Alternative concept.** A rival direction; Akash picks one later. Do not reuse or reference Silicon City's design. |
| Personal ocean details (diving, surfing, places, photos) | **Aesthetic only for now.** The ocean sets the world and mood. Leave clearly marked slots for personal details and photos to be filled in later. Invent no personal facts. |
| Repo | Private GitHub repo. |

## Primary audience and action
Default (from his current site, which says he is seeking hardware / chip design
internships): **recruiters and hiring engineers for hardware / ASIC / chip design internships.**
The one action: **reach out to him or open his resume** — within a first visit, even a
fast one. A recruiter who scans for 30 seconds must still leave knowing who he is, what
he built, and how to contact him.

## Content
All real content is in [`content.md`](content.md), taken from his current site
(https://agojuru.github.io/akashgojuru/). Use it as-is; do not invent projects,
roles, numbers or claims. Where a story needs something that is not there, leave a
marked slot.

## Hard constraints
- Design only. No implementation in this phase.
- Honest content: no fabricated metrics, testimonials or achievements.
- Must stay usable: navigation, resume and contact are never hidden behind a reveal.
- Must work on a phone and degrade gracefully without WebGL / with reduced motion.
- Stack default for the later build: Three.js / WebGPU, React Three Fiber, GSAP
  ScrollTrigger, Lenis.

## How the design gets made
The design team works it out independently: story/concept, UX, visual direction, motion,
unique ideas, and critique. Each role researches the current state of the art before
proposing, and weak ideas are challenged and revised before the plan is frozen.
