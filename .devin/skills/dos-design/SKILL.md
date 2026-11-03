---
name: dos-design
description: Computer DOS Store design system — RGB gaming visual language, motion rules (framer-motion + GSAP + Tailwind), reusable FX components, and visual verification
argument-hint: "[page or component to design]"
allowed-tools:
  - read
  - grep
  - glob
triggers:
  - user
  - model
---

You are designing UI for **Computer DOS Store** (React + Vite + Tailwind 3, framer-motion, GSAP + ScrollTrigger).
Apply these rules to any page or component you create or restyle.

## 1. Visual language — "RGB battlestation"
- Mood: dark gaming studio, neon RGB (cyan `#22d3ee` → violet `#8b5cf6` → pink `#f472b6`), glass panels, cyber grid, subtle scanlines.
- Light mode must stay premium (soft lavender/cyan glows), never flat grey.
- Typography: `font-display` (Orbitron) for brand, numbers, prices, big headings; Cairo for body/Arabic.
- Never hard-code colors for surfaces/text. Use theme tokens: `bg-bg`, `bg-surface`, `bg-surface2`, `text-fg`, `text-muted`, `border-line` (they switch with `.dark`).
- Accent gradients: `from-cyan-400 via-violet-600 to-pink-500`. Brand utilities in `client/src/index.css`: `.neon-text`, `.rgb-border > .rgb-inner`, `.glass`, `.btn-neon`, `.cyber-grid`, `.scanline`, `.chip`.

## 2. Bilingual + RTL
- Every visible string goes through `t('عربي', 'English')` from `usePrefs()` (`client/src/shared/prefs.jsx`).
- Use logical properties only: `ms-/me-/ps-/pe-/start-/end-/text-start`. Never `ml-/mr-/left-/right-` for layout.
- Directional motion (slide-in drawers) must flip with `isRTL`.

## 3. Motion rules
- Library choice: **framer-motion** for component state/enter/exit/layout/hover; **GSAP** for timelines, scroll-driven scenes (ScrollTrigger), continuous ambient loops, text scramble/counters.
- Always use `gsap.context(() => {...}, ref)` + `ctx.revert()` in effects to avoid leaks in React StrictMode.
- Durations: micro 150–250ms, UI 300–450ms, hero/scroll scenes 0.8–1.4s. Easing: `power3.out` / spring (stiffness 200–300, damping 20–26).
- Stagger lists (0.03–0.08s, cap total at ~0.4s).
- Respect `prefers-reduced-motion`: use `useReducedMotion()` (framer) / `gsap.matchMedia()`; disable loops, particles, parallax, custom cursor.
- Animate only `transform`/`opacity`/`filter`. Never animate layout-heavy props in loops.
- Canvas FX must pause when tab hidden and cap DPR at 2.

## 4. Reusable FX kit — `client/src/shared/fx/`
Prefer these over ad-hoc code:
- `ScrollProgress` — top RGB progress bar.
- `ParticleField` — canvas constellation background (theme-aware).
- `ScrambleText` — DOS/hacker text decode effect.
- `Magnetic` — magnetic hover wrapper for CTAs.
- `Spotlight` — card with cursor-following glow + border light.
- `CountUp` — GSAP number counter (in-view).
- `Reveal` — scroll reveal wrapper (y/blur/opacity).
- `BootScreen` — one-time DOS boot intro per session.
- `Confetti` — `fireConfetti()` canvas burst for success moments.
- `CursorRing` — desktop custom cursor ring.

## 5. Component patterns
- Cards: `Spotlight` + `rounded-2xl border border-line bg-surface`, hover lift `y:-4..-6`, image zoom 1.06.
- Primary CTA: `Magnetic` + `.btn-neon`. Secondary: `.btn-ghost`.
- Empty/loading: skeleton `animate-pulse rounded-2xl bg-surface2`, never a bare "Loading...".
- Success moments (order sent, build fully compatible, invoice created): toast + `fireConfetti()`.
- Product imagery: always `ProductImage` (uploaded image or RGB category art fallback).

## 6. Verification (mandatory after UI changes)
1. `npx vite build` must pass.
2. Restart server: `node server/index.js` on port 3000.
3. Visual smoke test (unset the host's Electron-as-Node env):
   `env -u ELECTRON_RUN_AS_NODE npx electron scripts/smoke.cjs`
   → all pages `OK`, then open screenshots in `smoke-out/` and inspect AR/EN, dark/light.
