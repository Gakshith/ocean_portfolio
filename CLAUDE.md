# ocean_portfolio

## Commands
```bash
npm install
npm run dev      # http://localhost:5173/ocean_portfolio/
npm test         # vitest (jsdom)
npm run build    # tsc + vite build + SSR prerender into dist/index.html
npm run lint     # oxlint
```

## Architecture
- Vite + React + TypeScript, prerendered at build (`scripts/prerender.mjs`), hosted on GitHub Pages
  at base `/ocean_portfolio/`. Phase 1 is the no-WebGL Still site; Three.js / WebGPU, R3F, GSAP
  and Lenis arrive in phase 2 (build order steps 5–10).
- Seams, ownership and shared rules: `docs/contract.md`.
- `docs/vision.md` holds the client vision. `docs/content.md` holds the real content, and
  site copy must come only from it.
- `docs/design/` holds the design team's output. The build follows `06-final-plan.md` once
  that file is approved.

## Conventions
- Never invent projects, metrics or personal facts. Missing personal ocean details and
  photos stay as marked slots.
