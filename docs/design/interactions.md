interactions

```markdown
# Interaction & Motion Specification (WEB) — Tactile Neo-Skeuomorphic UI
### Companion to `design-system.md` · Apple-inspired interaction language, adapted for the browser

This file defines **how every component and page behaves** on the web.
Visual tokens (colors, radii, shadows) are inherited from `design-system.md`.
Rule zero: **every input produces visible feedback within 100ms.**

---

## 0. Web Adaptation Notes (read first)

| Native assumption | Web reality | Resolution |
|---|---|---|
| Taptic Engine haptics | `navigator.vibrate` works on **Android Chrome only**; iOS Safari ignores it silently | Haptics = progressive enhancement via `haptic()` utility; **visual feedback is always primary** |
| Screen push/pop transitions | No native stack | View Transitions API (progressive) + scroll-reveal choreography |
| Rubber-band scrolling | Native on iOS Safari; not on desktop | Don't fake it; use `overscroll-behavior` and rely on native where present |
| Press states on touch | `:active` can stick after tap | Reset `-webkit-tap-highlight-color`, use `touch-action: manipulation` |
| Hover | Absent on touch | All hover effects are *enhancements only* — never gate information behind them |

---

## 1. Interaction Philosophy (Apple Principles, Web Edition)

1. **Physical controls** — fixed overhead light; press compresses, release rebounds.
2. **Spring physics, never linear** — decelerate naturally; overshoot only on release.
3. **Feedback is a contract** — tap/touch/click/keypress all produce a state change.
4. **Continuity** — elements morph between states; nothing pops.
5. **Restraint** — durations ≤ 400ms; motion explains hierarchy, never decorates.
   Apple.com moves *less* than you remember. When in doubt, remove motion.

---

## 2. Motion Tokens

```css
:root {
  --dur-instant: 80ms;   /* highlight flash */
  --dur-fast:    150ms;  /* press-down, hover-in */
  --dur-base:    250ms;  /* state change, focus, toggle */
  --dur-slow:    400ms;  /* release rebound, reveals, header state */

  --ease-press:   cubic-bezier(0.2, 0, 0, 1);        /* fast attack */
  --ease-release: cubic-bezier(0.34, 1.56, 0.64, 1); /* 6% overshoot */
  --ease-smooth:  cubic-bezier(0.32, 0.72, 0, 1);    /* iOS system curve */
}
```

> Animate **only** `transform`, `opacity`, `box-shadow`, `filter`.
> Never animate `width/height/top/left/margin` (exception: documented toggle-thumb stretch).

---

## 3. Haptics (Progressive Enhancement Only)

```js
// utils/haptic.js — safe everywhere, does nothing where unsupported (iOS Safari)
export function haptic(pattern) {
  if (!("vibrate" in navigator)) return;
  const map = {
    light: 5, rigid: 8, soft: 6, medium: 12, selection: 4,
    success: [10, 40, 10], error: [20, 60, 20],
  };
  navigator.vibrate(map[pattern] ?? 5);
}
```
Call `haptic()` inside the **same handler** as the state change. Never rely on it as the sole signal.

---

## 4. Universal Tactile Grammar (all raised controls)

```css
.tactile {
  -webkit-tap-highlight-color: transparent; /* we draw our own press feedback */
  touch-action: manipulation;               /* kills 300ms tap delay / double-tap zoom */
  cursor: pointer;
  transition:
    transform var(--dur-fast) var(--ease-press),
    box-shadow var(--dur-fast) var(--ease-press),
    filter var(--dur-fast) var(--ease-press);
  will-change: transform;
}
/* PRESS — fast, small */
.tactile:active {
  transform: scale(0.97) translateY(1px);
  filter: brightness(0.96);
  transition-duration: 60ms;
}
/* RELEASE — slow, springy (asymmetry = physical feel) */
.tactile:not(:active) {
  transition:
    transform var(--dur-slow) var(--ease-release),
    box-shadow var(--dur-base) var(--ease-smooth),
    filter var(--dur-base) var(--ease-smooth);
}
/* HOVER — desktop enhancement: gentle lift, never scale-down */
@media (hover: hover) {
  .tactile:hover { transform: translateY(-1px) scale(1.01); }
}
/* FOCUS — keyboard halo, Apple-style */
.tactile:focus-visible {
  outline: none;
  box-shadow: var(--elevation-med), 0 0 0 4px rgba(23, 134, 180, 0.35);
}
.tactile[disabled], .tactile[aria-disabled="true"] {
  opacity: 0.45; filter: saturate(0.4);
  pointer-events: none; box-shadow: none;
}
```

---

## 5. Component Micro-Interactions

### 5.1 Primary Orange Button
- **Hover:** lift + glow blur `20px → 26px`.
- **Press:** scale `0.97`, glow tightens to `8px`.
- **Submit:** label crossfades out (150ms) → spinner in; pill width animates to circle via `--ease-smooth`. On success: spinner → SVG checkmark drawn via `stroke-dashoffset` (300ms) + `haptic("success")`.

### 5.2 Dark Squircle
- **Press:** scale `0.92`, specular highlight dims 40%.
- **Release:** visible spring settle.
- **Hover:** highlight brightens 10%.

### 5.3 Segmented Ribbon
- Sliding inner-highlight element translates between segments with
  `--ease-release` (250ms). Content color crossfades 200ms.
- **Hover-scrub (fine pointer):** `haptic("selection")` as pointer crosses boundaries.
- Implement the slider with one absolutely-positioned element moved via `transform: translateX()` measured from the active segment's `offsetLeft` — recompute on resize.

### 5.4 Input Pills / Fields
- **Focus:** border → accent, 4px halo fades in (`--dur-base`).
- **Typing:** no per-keystroke motion (restraint).
- **Autofill:** style `:-webkit-autofill` with matching background so the bevel isn't broken by the browser yellow.

### 5.5 Metallic Chip (filter chips)
- **Selected:** stays slightly depressed (`translateY(0.5px)`, stronger inset shadow), gradient reverses. `haptic("rigid")`.
- **Unselected:** spring back to raised.

### 5.6 Spherical Toggle — signature iOS detail
```css
.toggle-thumb {
  transition: width 200ms var(--ease-smooth), left 300ms var(--ease-release);
}
.toggle:active .toggle-thumb     { width: 36px; }              /* stretch */
.toggle.on .toggle-thumb         { left: 34px; }
.toggle.on:active .toggle-thumb  { left: 26px; }               /* stretch backward */
```
- Haptic fires when thumb crosses 50% travel (`rigid` on, `soft` off).

### 5.7 Tactical Island
- Stepper icon rotates 180° on tap; counter digits roll odometer-style
  (outgoing `translateY(0 → -100%)`, incoming `100% → 0`, 250ms, `overflow: hidden` mask).
- Neon dot: single pulse ring on activation (`scale 1 → 1.8`, `opacity 0.5 → 0`, 400ms).

### 5.8 Search Pill
- **Focus:** container scales `1.02`, shadow deepens, placeholder slides left 4px + dims.
- **Has value:** clear `×` scales in from `0.5` with `--ease-release`.
- **Submit:** icon wiggles ±6° once (200ms).

### 5.9 Debossed Well
- **Press:** inset shadow deepens 1px (pressed *into* the surface — inverse of raised).
- **Lazy content:** shimmer sweep once (900ms), then fade-in 200ms.

---

## 6. Site-Level Interactions

### 6.1 Translucent Sticky Header (Apple.com pattern)
- At top: fully transparent over hero.
- After `scrollY > 8`: backdrop blur `0 → 20px`, background `rgba(245,246,249,0) → 0.72`, hairline bottom border + `--elevation-low` fade in over `--dur-slow`.
- Drive with a **single** passive scroll listener toggling a `.is-scrolled` class (no per-frame style writes).

```js
const header = document.querySelector(".site-header");
const onScroll = () => header.classList.toggle("is-scrolled", scrollY > 8);
addEventListener("scroll", onScroll, { passive: true });
onScroll();
```

### 6.2 Hero Entrance (on load)
- Headline, subcopy, CTA: staggered rise + fade (`translateY(12px) → 0`, opacity `0 → 1`), 80ms stagger, `--ease-smooth`, 500ms each.
- Runs **once** on first paint only; never on back-navigation or resize.

### 6.3 Scroll Reveals
- `IntersectionObserver`, `threshold: 0.15`, `rootMargin: "0px 0px -10% 0px"`.
- Reveal = `translateY(16px) → 0` + fade, 500ms `--ease-smooth`, stagger 60ms within a group.
- **Unobserve after reveal** (no re-hiding on scroll up — Apple doesn't replay reveals).
- Content must be fully visible with JS disabled (reveal class added by JS, not required by CSS).

```js
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("is-revealed"); io.unobserve(e.target); }
  });
}, { threshold: 0.15, rootMargin: "0px 0px -10% 0px" });
document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
```

### 6.4 Links & Chevrons
- Inline links: underline draws left→right on hover (`background-size` trick or `::after` scaleX), 200ms.
- "Learn more ›" style: chevron translates `2px` right on hover; whole row is the hit target.
- Color shift only, no layout movement.

### 6.5 Card Hover (desktop)
- Lift `translateY(-2px)`, shadow blooms `--elevation-med → --elevation-high`, 250ms `--ease-smooth`.
- Inner imagery may scale `1.0 → 1.02` (Ken Burns restraint) — **never** rotate or tilt cards.

### 6.6 Images
- Placeholder = debossed shimmer (matches wells); image fades in over 200ms on `load`.
- `loading="lazy"` + `decoding="async"`; fixed aspect-ratio boxes to prevent CLS.
- Parallax: **none** on mobile; on desktop, max 10% differential, transform-only, disabled under reduced motion.

### 6.7 Page Transitions (progressive enhancement)
```js
// MPA cross-fade where supported; silent fallback otherwise
if (document.startViewTransition) {
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-transition]");
    if (!a || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    document.startViewTransition(() => { location.href = a.href; });
  });
}
```
- Default transition: 250ms cross-fade + 8px rise of incoming document (`::view-transition-new(root)`).
- Give persistent elements (header, logo) `view-transition-name` so they morph instead of fading.

### 6.8 Anchor / Smooth Scroll
```css
html { scroll-behavior: smooth; scroll-padding-top: 80px; } /* header offset */
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
```

### 6.9 Cursor Discipline
- System cursors only: `default`, `pointer`, `text`, `grab/grabbing`. **No custom cursors.**

---

## 7. Forms (Web)

- **Focus:** §5.4 halo.
- **Invalid submit:** `haptic("error")` + shake `translateX 0,-6,6,-4,4,-2,0` over 400ms + red halo that persists until input.
- **Valid submit:** button enters loading state (§5.1); on response, success draw or inline error under the field (fade + 4px rise, 200ms).
- Never block submit with `alert()`; all feedback is inline and in-layout (reserve space to avoid CLS).

---

## 8. Performance Rules

1. `will-change` only on `.tactile` and actively-animating elements; remove after animation ends.
2. One passive scroll listener total; class toggles only — no per-frame style writes.
3. IntersectionObserver for everything scroll-position-related; no scroll-math loops.
4. Batch DOM reads/writes; never read layout inside a rAF that also writes.
5. Target 60fps: if a shadow animation janks on mobile, swap animated `box-shadow` for an opacity crossfade between two pre-rendered pseudo-element shadows.

---

## 9. Accessibility

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 150ms !important;
    transition-timing-function: ease !important;
    scroll-behavior: auto !important;
  }
}
```
- Reduced motion → reveals become plain fades, shake becomes red halo only, parallax off, hero stagger off.
- Skip-link as first focusable element; visible on `:focus`.
- All targets ≥ 44×44 CSS px; `:focus-visible` halo mandatory on every `.tactile`.
- `:hover` never carries exclusive information; every hover state has a focus equivalent.

---

## 10. Claude Code Implementation Rules

1. **No `linear` / default `ease`.** Only the three easing tokens.
2. **Asymmetric press/release:** 60ms in / 400ms out. This single rule creates the physical feel.
3. **Hover = enhancement.** Every interaction must work identically on touch with hover removed.
4. **Visual feedback first, `haptic()` second** (same handler, feature-detected).
5. **Animate composition-only properties** (`transform`, `opacity`, `box-shadow`, `filter`).
6. **Progressive enhancement:** reveals, View Transitions, and haptics must degrade to a fully functional static site.
7. **Reference, don't redefine:** import all color/radius/shadow tokens from `design-system.md`; this file adds motion tokens only.
8. Ship the `haptic()` utility, the reveal observer, and the header scroll toggle as three small vanilla-JS modules — no animation library required. Add Framer Motion only if React is already in the stack.

### Minimal React/Framer Motion equivalent (only if React is used)
```jsx
<motion.button
  whileTap={{ scale: 0.97, y: 1 }}
  whileHover={{ y: -1, scale: 1.01 }}
  transition={{ type: "spring", stiffness: 500, damping: 30 }}
  onPointerDown={() => haptic("light")}
/>
```
```

The biggest shifts from the native version: haptics demoted to best-effort, hover added everywhere as an enhancement layer, and §6 (sticky header, scroll reveals, View Transitions) replaces native navigation choreography. Want the dark-mode token remap next, or a `tokens.css` file that merges both specs into one importable stylesheet?