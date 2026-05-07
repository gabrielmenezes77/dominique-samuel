# Dominique & Samuel — Wedding Invitation Site

React + Vite migration of the wedding invitation website for Dominique & Samuel.

---

## Project Overview

This is a single-page wedding invitation site featuring:

- A scroll-driven canvas frame animation (90 frames desktop / 50 frames mobile)
- A live countdown timer to the wedding date (2026-06-20)
- An RSVP form with remote API submission
- Botanical-themed SVG decorative elements with scroll-triggered reveals
- A responsive design in olive and ivory tones with Cormorant Garamond and Jost fonts

The project is a React + Vite migration of the original vanilla HTML/CSS/JS implementation. The original site (`webapp/`) is preserved as a reference. The migration maintains complete visual and behavioral parity with the original, while fixing known bugs and replacing CDN dependencies with npm packages.

---

## Tech Stack

| Layer         | Choice      | Version |
| ------------- | ----------- | ------- |
| Framework     | React       | 18.3.1  |
| Bundler       | Vite        | 5.4.2   |
| Language      | JavaScript  | ES2022+ |
| Styles        | CSS Modules | —       |
| Animation     | GSAP        | 3.12.5  |
| Smooth scroll | Lenis       | 1.1.14  |
| Testing       | Vitest      | 2.0.5   |

---

## Setup

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher

### Install

```bash
npm install
```

---

## Available Scripts

| Script            | Description                                    |
| ----------------- | ---------------------------------------------- |
| `npm run dev`     | Start the development server at localhost:5173 |
| `npm run build`   | Production build — output goes to `dist/`      |
| `npm run preview` | Preview the production build locally           |
| `npm test`        | Run the unit test suite (Vitest)               |

---

## Project Structure

```
src/
├── main.jsx                    # Vite entry point
├── App.jsx                     # Root component — layout orchestration
├── styles/
│   ├── globals.css             # CSS custom properties, reset, grain texture, body
│   └── animations.css          # @keyframes: logo-breathe, chev-bounce
├── components/
│   ├── Loader/                 # Progress bar shown during frame preload
│   ├── Nav/                    # Anchor navigation, external gift list link
│   ├── LogoMark/               # Reusable DS monogram SVG component
│   ├── CanvasAnimation/        # Canvas frame scrubbing, fixed background layer
│   ├── ScrollHint/             # Bounce chevron, fades out on scroll
│   ├── MessageSection/         # Welcome message with .ri reveal elements
│   ├── BotanicalDivider/       # SVG vine/leaf decorative separator
│   ├── CountdownSection/       # Live countdown to wedding date
│   ├── RSVPSection/            # RSVP form with API submission
│   └── Footer/                 # Logo, names, date, Bible verse
├── hooks/
│   ├── useCanvasAnimation.js   # Frame loading, Lenis, GSAP ScrollTrigger
│   ├── useCountdown.js         # Countdown tick (setInterval)
│   └── useScrollState.js       # Scroll hint visibility, header scrolled state
├── utils/
│   ├── frameSrc.js             # frameSrc(i) — pure path generation function
│   ├── rsvpPayload.js          # buildPayload(formData) — pure form serializer
│   └── syncAcompanhantes.js    # syncAcompanhantesState — companion select logic
└── services/
    └── rsvpService.js          # fetch POST with AbortController timeout

public/
└── assets/
    ├── frames/                 # frame_0001.webp … frame_0214.webp (animation frames)
    └── images/                 # logo-bg.svg, capa-DS.webp, savethedate.webp

webapp/                         # Original HTML/CSS/JS implementation (reference only)
```

Each component directory follows the pattern:

```
ComponentName/
  ComponentName.jsx
  ComponentName.module.css
  index.js
```

---

## Architecture Overview

The site is a single-page application with no client-side routing. Navigation is anchor-based (`#id`). Lenis handles smooth scrolling; anchor clicks call `lenis.scrollTo('#id')` instead of the default browser jump.

### Canvas Frame Scrubbing

The hero section uses a `<canvas>` element to render a sequence of WebP frames in sync with scroll position. The animation uses a two-phase preload strategy:

1. **Phase 1 (critical):** Load the first 12 frames synchronously. The loader hides once these are ready, giving a fast first paint.
2. **Phase 2 (background):** Load the remaining frames while the user reads the page.

Frame rendering uses refs and `requestAnimationFrame` — never React state — to avoid re-renders during scroll.

### Smooth Scroll

Lenis is initialized once in `useCanvasAnimation`, integrated with GSAP's ticker for frame-accurate updates. It is destroyed on component unmount.

### Scroll-Triggered Animations

GSAP ScrollTrigger drives two animation types:

- **`.ri` elements** — reveal from offset Y with staggered opacity on viewport entry (82% threshold)
- **Botanical dividers** — scale in from center with opacity transition

ScrollTrigger instances are killed on unmount.

### State

No external state library. All state lives in React hooks:

| State               | Owner                | Mechanism   |
| ------------------- | -------------------- | ----------- |
| Loaded frame count  | `useCanvasAnimation` | ref counter |
| Current frame index | `useCanvasAnimation` | ref + rAF   |
| Loader hidden       | `App`                | `useState`  |
| Scroll hint visible | `useScrollState`     | `useState`  |
| Header scrolled     | `useScrollState`     | `useState`  |
| Countdown values    | `useCountdown`       | `useState`  |
| RSVP form fields    | `RSVPSection`        | `useState`  |
| RSVP submitting     | `RSVPSection`        | `useState`  |
| RSVP feedback       | `RSVPSection`        | `useState`  |

---

## Component Tree

```
App
├── Loader               — Progress bar, visible until Phase 1 frames are ready
├── Nav                  — Fixed navigation bar; receives `scrolled` prop for frosted glass effect
│   └── LogoMark         — DS monogram SVG (hidden on mobile)
├── CanvasAnimation      — Fixed canvas layer; drives frame scrubbing via useCanvasAnimation
├── ScrollHint           — Fixed bounce chevron; fades out after 80px scroll into spacer
└── <main>
    ├── MessageSection   — Welcome text with .ri scroll-reveal elements
    ├── BotanicalDivider — SVG vine/leaf separator
    ├── CountdownSection — Days/hours/minutes/seconds countdown via useCountdown
    ├── BotanicalDivider — SVG vine/leaf separator
    ├── RSVPSection      — Controlled form; POST to /api/rsvp via rsvpService
    └── Footer           — Names, date, Bible verse
        └── LogoMark     — DS monogram SVG
```

---

## Key Design Decisions

### CSS Modules over Tailwind or styled-components

The original site has a complete, well-structured `style.css`. CSS Modules allow porting existing CSS with minimal rewriting, preserving visual parity at low risk. Tailwind would require rewriting all styles; styled-components adds runtime overhead and a different mental model.

### No React Router

The site is single-page and anchor-based. Adding a router would introduce unnecessary complexity without any benefit.

### Hooks-only state

State complexity is low. A global store (Redux, Zustand, Jotai) would be overkill for this application.

### npm packages over CDN

GSAP and Lenis are installed as npm packages instead of CDN scripts. This removes the CDN single-point-of-failure risk and enables tree-shaking.

### Vitest over Jest

Vitest is Vite-native, requires zero configuration, and is compatible with Vite's transform pipeline.

### Inline SVG for LogoMark

The DS monogram is rendered as a React component rather than an `<img>` tag. This enables color control via props, matching the As-Is CSS variable `--logo-color` pattern without workarounds.

### Two-phase frame preload

Phase 1 loads 12 critical frames before hiding the loader, giving a fast first paint. Phase 2 loads the remaining frames in the background. This preserves the As-Is UX.

---

## Legacy Site

The `webapp/` directory contains the original HTML/CSS/JS implementation. It is preserved as a visual and behavioral reference. Do not modify it. The React implementation in `src/` is the active codebase.

---

## Environment

The RSVP form submits to `https://dominique-samuel.com/api/rsvp`. No environment variables are required for local development — the form will fail gracefully with a network error if the API is unreachable.

---

## Testing

Unit tests live alongside source files with a `.test.js` suffix. Run the full suite with:

```bash
npm test
```

Tests cover: `frameSrc` path generation, `buildPayload` form serialization, `calculateCountdown` time math, `syncAcompanhantesState` companion select logic, and the frame `onerror` regression.

See `MIGRATION.md` for the full testing rationale.
