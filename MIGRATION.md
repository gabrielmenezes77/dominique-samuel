# Migration Decisions — Dominique & Samuel Wedding Site

This document records the decisions, bug fixes, trade-offs, and known issues from the migration of the wedding invitation site from vanilla HTML/CSS/JS (`webapp/`) to React + Vite (`src/`).

---

## Migration Approach

### Parallel Build Strategy

The migration uses a parallel build strategy: the To-Be implementation lives in `src/` while the As-Is implementation is preserved in `webapp/`. Both coexist in the repository throughout the migration.

This approach allows:

- continuous visual comparison between As-Is and To-Be at any point
- safe rollback — the original is never modified
- incremental acceptance — sections can be validated independently

The As-Is (`webapp/`) is the visual and behavioral source of truth. Any deviation from it must be documented here as a bug fix, accessibility correction, or technical constraint.

---

## Bugs Fixed

### 1. `#site-header` dead reference

**Location:** `webapp/assets/js/app.js`

**As-Is behavior:** The JavaScript references `document.querySelector('#site-header')` to apply a `.scrolled` class when the user scrolls past the video spacer. The element `#site-header` does not exist in the HTML — the nav element has no `id`. The `.scrolled` class is therefore never applied, and the frosted glass header effect defined in CSS never fires.

**Fix:** In the React implementation, the `Nav` component receives a `scrolled` boolean prop from `App`. The `useScrollState` hook tracks scroll position via a GSAP ScrollTrigger callback and sets `headerScrolled` state. `App` passes this state down to `Nav` as a prop, which applies the `scrolled` CSS Module class conditionally.

**Classification:** Bug fix

**Requirement:** 14.2

---

### 2. No fetch timeout on RSVP submission

**Location:** `webapp/assets/js/app.js` — `initForm()`

**As-Is behavior:** The `fetch` call to the RSVP API has no timeout. If the API hangs, the user waits indefinitely with the button disabled and no feedback.

**Fix:** `src/services/rsvpService.js` wraps the `fetch` call with an `AbortController`. The controller's `signal` is passed to `fetch`. A `setTimeout` of 15 seconds calls `controller.abort()` if the request has not resolved. On abort, the catch block shows a "Erro de conexão" error message and re-enables the submit button.

**Classification:** Bug fix

**Requirement:** 14.1, 10.6

---

### 3. Frame `onerror` not incrementing `loaded`

**Location:** `webapp/assets/js/app.js` — `loadOne()`

**As-Is behavior:** The `loadOne` function resolves the promise on `img.onload` but does not handle `img.onerror`. If a frame fails to load, the `loaded` counter never increments for that frame. If enough frames fail, the loader progress bar stalls and never reaches 100%, leaving the loader visible indefinitely.

**Fix:** In `src/hooks/useCanvasAnimation.js`, the frame loader increments `loadedRef` in both the `onload` and `onerror` handlers. On error, the frame slot is left as `null` and the canvas draws a blank frame for that index. The loader always completes.

**Classification:** Bug fix

**Requirement:** 14.3

---

### 4. CDN dependencies

**Location:** `webapp/index.html`

**As-Is behavior:** GSAP, GSAP ScrollTrigger, and Lenis are loaded from CDN `<script>` tags. A CDN outage or network restriction breaks the entire site.

**Fix:** All three libraries are installed as npm packages (`gsap@3.12.5`, `lenis@1.1.14`) and imported directly in the JavaScript modules. They are bundled by Vite into the production output.

**Classification:** Bug fix / technical constraint

**Requirement:** 14.4, 10.2, 10.3

---

## Architecture Decisions

### CSS Modules over Tailwind or styled-components

**Context:** The As-Is has a complete, well-structured `style.css` with CSS custom properties, responsive breakpoints, and component-level selectors. A styling strategy was needed for the React implementation.

**Options considered:**

- Tailwind CSS
- styled-components
- CSS Modules + global CSS

**Decision:** CSS Modules with a shared `globals.css` for custom properties and resets.

**Rationale:** CSS Modules allow porting the existing CSS with minimal rewriting. The `:root` variables, `@keyframes`, and global selectors are copied verbatim into `globals.css`. Component-level styles are scoped via `.module.css` files. Tailwind would require rewriting all styles from scratch, introducing high visual regression risk. styled-components adds runtime overhead and a different mental model with no benefit for this use case.

**Consequences:** The `.ri` class and `.botanical-divider` class remain as global selectors in `globals.css` because GSAP targets them by string selector — CSS Modules would rename them.

**Requirement:** 6.1, 6.2

---

### No React Router

**Context:** The site has three anchor-based navigation targets: `#mensagem-inicial`, `#contagem-regressiva`, `#confirmação-de-presença`. There are no distinct routes.

**Decision:** No React Router. Navigation is handled by Lenis `scrollTo` calls.

**Rationale:** The As-Is is single-page and anchor-based. React Router would add complexity (route definitions, history management, link components) with no user-facing benefit. Lenis already handles smooth scroll to anchor targets.

**Requirement:** 8.3

---

### Hooks-only state

**Context:** The application has several pieces of state: loader visibility, scroll hint visibility, header scrolled state, countdown values, RSVP form fields, and RSVP submission state.

**Decision:** React `useState` and `useEffect` only. No external state library.

**Rationale:** The state is local to components and hooks. No state needs to be shared across distant parts of the tree in a way that would justify a global store. The complexity level does not warrant Redux, Zustand, or Jotai.

**Requirement:** 9.3

---

### Vitest over Jest

**Context:** A test runner was needed for unit tests.

**Decision:** Vitest.

**Rationale:** Vitest is Vite-native, requires zero configuration, and shares Vite's transform pipeline. Jest requires additional configuration to handle ES modules and Vite-specific transforms. Vitest is the natural choice for a Vite project.

**Requirement:** 16.2

---

### Inline SVG for LogoMark

**Context:** The DS monogram logo needs to render in two colors: olive (`#5c6b2e`) in the nav and ivory (`#f5f3ee`) in the footer.

**Decision:** The logo is a React component (`LogoMark.jsx`) that accepts `width`, `height`, and `color` props. The SVG `fill` is set from the `color` prop.

**Rationale:** An `<img>` tag cannot be styled with CSS color properties. The As-Is uses a CSS variable `--logo-color` on the SVG element, which works because the SVG is inline. Inlining the SVG as a React component replicates this behavior cleanly via props.

**Requirement:** 5.4

---

### Two-phase frame preload

**Context:** The animation requires 90 frames (desktop) or 50 frames (mobile). Loading all frames before showing the page would create a long wait.

**Decision:** Phase 1 loads the first 12 frames and hides the loader. Phase 2 loads the remaining frames in the background.

**Rationale:** This preserves the As-Is UX: the user sees the first frame quickly and can start reading while the remaining frames load. The 12-frame threshold matches the As-Is implementation.

**Requirement:** 10.1, 3.1

---

## Known Trade-offs

### Google Fonts loaded via CDN

Google Fonts (`Cormorant Garamond` and `Jost`) are still loaded via `<link>` tags in `index.html`, matching the As-Is. Self-hosting the fonts would improve performance (eliminates the Google Fonts DNS lookup and connection) and remove the external dependency. However, self-hosting Google Fonts requires careful attention to the font license (SIL Open Font License) and adds build complexity. The trade-off was made in favor of simplicity.

**Impact:** Minor performance cost on first load. No functional impact.

---

### GSAP ScrollTrigger initialized with direct DOM queries

GSAP ScrollTrigger is initialized with direct DOM selectors (`.ri`, `.botanical-divider`) rather than React refs. This is necessary because GSAP's ScrollTrigger `batch` and `trigger` APIs expect CSS selectors or DOM elements, and the elements targeted are spread across multiple components. Passing refs from every component to `useCanvasAnimation` would create excessive prop drilling.

**Impact:** GSAP directly queries the DOM after mount. This is safe because the effect runs after the full component tree is rendered. No functional impact.

---

## Visual Differences from As-Is

| Element                      | As-Is                                   | To-Be                                         | Classification |
| ---------------------------- | --------------------------------------- | --------------------------------------------- | -------------- |
| Header `.scrolled`           | Never applied (dead JS reference — bug) | Applied correctly on scroll past video spacer | Bug fix        |
| `font-weight` on scroll hint | `7000` (invalid CSS value)              | `700` (corrected)                             | Bug fix        |

### Header `.scrolled` state

The frosted glass header effect (transparent → blurred background on scroll) was always broken in the As-Is because the JavaScript referenced a non-existent element ID. The To-Be fixes this. The visual behavior now matches the CSS that was already written in the As-Is — the effect was always intended to work.

### `font-weight: 7000` correction

The scroll hint element in the As-Is CSS has `font-weight: 7000`, which is an invalid value (valid range is 1–1000). Browsers silently ignore it and fall back to the inherited weight. The To-Be corrects this to `font-weight: 700` (bold), which matches the intended design.

---

## Testing

### Unit Test Coverage

The test suite has 22 unit tests covering the following:

| Test file                             | What it covers                                                                    |
| ------------------------------------- | --------------------------------------------------------------------------------- |
| `src/utils/frameSrc.test.js`          | `frameSrc(i)` — correct zero-padded path for indices 0–99                         |
| `src/utils/rsvpPayload.test.js`       | `buildPayload(formData)` — string trimming, email lowercasing, int parsing        |
| `src/hooks/useCountdown.test.js`      | `calculateCountdown` — correct days/hours/mins/secs for known time differences    |
| `src/utils/syncAcompanhantes.test.js` | `syncAcompanhantesState` — disables select and resets to 0 when `confirmacao=nao` |
| `src/utils/frameOnerror.test.js`      | Regression: `loaded` increments even when a frame image fails to load             |

Run with:

```bash
npm test
```

All tests must pass before any release.

### Visual Regression

Visual regression testing requires manual comparison between the As-Is (`webapp/`) and To-Be (`src/`) at the following breakpoints:

- 320px (mobile)
- 768px (tablet)
- 1024px (laptop)
- 1440px (desktop)

States to compare:

- Loader visible (before Phase 1 completes)
- Canvas showing frame 0 (loader hidden)
- Message section scrolled into view
- Countdown section
- RSVP form: default state
- RSVP form: "sim" selected
- RSVP form: "não" selected (acompanhantes disabled)
- RSVP form: submitting (button disabled)
- RSVP form: success feedback
- RSVP form: error feedback
- Footer

Baseline screenshots are documented in `baseline/baseline.md`.

---

## What's Not Migrated

### `capa-DS.webp` and `savethedate.webp`

Both files are present in `public/assets/images/` (and in `webapp/assets/images/`). Neither is referenced in the current HTML of either the As-Is or the To-Be. They are preserved in `public/` in case they are needed for future use, matching the As-Is behavior exactly.

---

## Requirement Traceability

| Decision / Fix                    | Requirements     |
| --------------------------------- | ---------------- |
| `#site-header` dead reference fix | 14.2, 15.2       |
| Fetch timeout (AbortController)   | 14.1, 10.6       |
| Frame onerror fix                 | 14.3             |
| CDN → npm packages                | 14.4, 10.2, 10.3 |
| CSS Modules strategy              | 6.1, 6.2         |
| No React Router                   | 8.3              |
| Hooks-only state                  | 9.3              |
| Vitest                            | 16.2             |
| Inline SVG LogoMark               | 5.4              |
| Two-phase frame preload           | 10.1, 3.1        |
| README and MIGRATION docs         | 18.1, 18.2       |
