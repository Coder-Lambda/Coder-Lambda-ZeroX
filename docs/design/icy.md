# Icy style guide

A reference for the look of Icy, to borrow from in another app. It describes the recipes and the values behind them; copy the ideas, not the files. The source of truth is `src/styles/tokens.css`, `src/styles/glass.css` and `src/styles/base.css`.

## The idea in one paragraph

A dark, warm-grey canvas with soft colored light behind it, and translucent "liquid glass" cards floating on top. One accent color carries every highlight: active nav item, primary button, progress fill, chart lead series. Big numbers are the heroes; labels are small and grey. Everything is rounded and pill-shaped. A second theme swaps the mood (light grey with lime) using exactly the same token names, so no component knows which theme it is in.

---

## 1. Color

All colors are CSS variables on `:root[data-theme='dark' | 'light']`. Components only ever read the variables.

### Theme 1: dark mauve

| Token | Value | Used for |
| --- | --- | --- |
| `--page` | `#09080a` | Behind everything (outside the frame) |
| `--canvas` | `#4d474d` | The big rounded frame the app sits in |
| `--card` | `rgba(14, 13, 15, 0.6)` | Glass card fill |
| `--card-solid` | `#0e0d0f` | Tooltips, dropdown options (no transparency) |
| `--sidebar-bg` | `rgba(14, 13, 15, 0.86)` | Sidebar / bottom bar |
| `--surface-2` | `#241f24` | Inputs, list rows, stat tiles, segmented track |
| `--accent` | `#8a6d8a` | Deep accent |
| `--accent-glow` | `#c9a7c7` | Light accent: focus ring, name highlight, chart lead |
| `--text` / `--text-2` | `#ffffff` / `#a39ea3` | Main text / labels and secondary text |
| `--positive` / `--alert` | `#58b970` / `#ff3b30` | Gains, "Saved" / losses, errors |
| `--line` / `--line-strong` | white at 10% / 20% | Borders, grid lines |
| `--pill-active` | `linear-gradient(120deg, #8a6d8a, #c9a7c7)` | Primary button, active tab, progress fill |
| `--active-bg` | gradient from `#c9a7c7` at 75% fading to transparent, left to right | Active sidebar item |

### Theme 2: light with lime

| Token | Value |
| --- | --- |
| `--page` / `--canvas` | `#f4f5f6` |
| `--card` | `rgba(255, 255, 255, 0.46)` |
| `--sidebar-bg` | `#0d0e0e` (the sidebar stays black in the light theme) |
| `--surface-2` | `#eaebed` |
| `--accent` / `--accent-glow` | `#7ed321` / `#549e18` |
| `--on-accent` | `#141515` (dark text on lime) |
| `--text` / `--text-2` | `#141515` / `#787c80` |
| `--pill-active`, `--active-bg` | flat `#7ed321` |
| `--feature-bg` | `#0d0e0e` (the hero card turns black) |

### Chart and category colors

Six categorical colors, `--c1` to `--c6`, defined per theme so charts recolor with the theme.

- Dark: `#c9a7c7`, `#8a6d8a`, `#58b970`, `#ead9e9`, `#5e4a66`, `#a39ea3`
- Light: `#7ed321`, `#549e18`, `#0d0e0e`, `#787c80`, `#b9e98a`, `#c5c8cc`

Rule: color is never the only cue. Every pie has a legend with names and values, and line charts also differ by dash pattern (solid, solid, `7 4`, `2 4`).

### Background light ("blobs")

Two or three large blurred circles behind the cards, so the glass has something to bend:

- `--blob-1`: accent glow at ~60% (dark) / lime at 30% (light)
- `--blob-2`: deep accent at ~70% (dark) / grey at 32% (light)
- Drawn as pseudo-elements on an absolutely positioned layer: `border-radius: 50%; filter: blur(70px)`, sized in `vw` (40–46vw) and pushed partly off the edges. A third blob is a `box-shadow` copy of the second.

---

## 2. Liquid glass

The signature effect. Four layers on one element:

```css
.glass {
  position: relative;
  /* 1. Sheen from the top-left over the translucent fill */
  background: linear-gradient(140deg, var(--glass-sheen), transparent 38%), var(--card);
  border: 1px solid var(--line);
  /* 2. Frosting: blur, plus saturation so colors behind glow through */
  backdrop-filter: blur(30px) saturate(1.9) brightness(1.06);
  /* 3. Inner light: bright top edge, faint left edge, dark bottom edge, soft inner glow */
  box-shadow:
    inset 0 1px 0 var(--spec),
    inset 1px 0 0 rgba(255, 255, 255, 0.05),
    inset 0 -1px 0 rgba(0, 0, 0, 0.14),
    inset 0 0 28px rgba(255, 255, 255, 0.035),
    var(--shadow);
}

/* 4. Rim light: a 1px gradient ring, bright at top-left and bottom-right */
.glass::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, var(--spec), transparent 34%, transparent 66%, var(--spec));
  mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  pointer-events: none;
}
```

Per-theme values: `--glass-sheen` is white at 7% (dark) / 55% (light); `--spec` is white at 26% (dark) / 90% (light).

Notes:
- Glass only reads as glass if there is color behind it. Keep the blobs.
- On phones, drop the blur to `20px`: many blurred cards scrolling at once is expensive.
- Grid libraries that position children absolutely will be broken by `.glass { position: relative }`; re-assert `position: absolute` for those items.

### Hero ("feature") card

One card per page can be the hero: a radial gradient instead of plain glass, white text in both themes.

```css
--feature-bg: radial-gradient(120% 140% at 100% 0%,
  rgba(201, 167, 199, 0.55), rgba(138, 109, 138, 0.22) 45%, rgba(14, 13, 15, 0.9) 75%);
```

In the light theme it is just solid `#0d0e0e`, which makes it pop against the white glass.

---

## 3. The theme switch (glass lens)

A small glass pill with a moon and a sun, and a round "lens" that slides between them.

- Pill: white at 8% fill, white at 16% border, `blur(14px) saturate(1.6)`, inset top highlight, inset dark bottom shading, drop shadow.
- Lens (40px circle): radial white gradient from the top-left, `inset 0 0 0 1.5px` white ring, inner highlights, drop shadow.
- Iridescent rim on the lens: a 2px masked ring with `conic-gradient(from 210deg, #ffd6a8, #ff9ad5, #a8c8ff, #b8ffd9, #fff2a8, #ffd6a8)` at 55% opacity.
- Movement: `transform: translateX(lens + gap)` with a springy `cubic-bezier(0.3, 1.5, 0.5, 1)` over 0.55s. On press it squashes: `scale: 1.08 0.94`.
- Refraction (Chromium only): `backdrop-filter: url(#lens-filter)` where the SVG filter is an `feDisplacementMap` fed by a gradient image that is neutral in the middle and bends only at the rim. Other browsers just get the blur.
- Theme change cross-fades the whole page with the View Transitions API (`document.startViewTransition`, 0.45s).
- When the sidebar collapses, or on phones, the pill stands upright (`flex-direction: column`, lens moves with `translateY`).

---

## 4. Shape, type and spacing

### Radius

| Token | Value | Used for |
| --- | --- | --- |
| `--radius-frame` | 30px | Outer frame |
| `--radius-panel` | 22px | Cards, sidebar |
| `--radius-ctl` | 13px | Inputs, nav items |
| pill | 999px | Buttons, tabs, chips, badges, progress bars |

### Typography

- Font: **Outfit** (variable), fallback `system-ui, 'Segoe UI', sans-serif`. Body 15px, line-height 1.4, antialiased.
- Weights stay light: headings 500, numbers 600, never bold 700+.
- Scale:

| Role | Size | Notes |
| --- | --- | --- |
| Page title | 30px / 500 | `letter-spacing: -0.01em` |
| Hero number (`.huge`) | 46px / 600 | `-0.02em`, `line-height: 1` |
| Big number (`.big`) | 34px / 600 | `-0.015em` |
| Card title | 16px / 500 | One line, ellipsis |
| Body | 15px | |
| Labels, legends, chips | 12.5–13px | Always `--text-2` |

- Every number uses `font-variant-numeric: tabular-nums` so values do not jiggle when they change.
- The user's name in the greeting is colored with `--accent-glow`.

### Spacing

- App frame: 16px around the page, 14px inside the frame, 14px gap between sidebar and content.
- Cards: grid gap 14px; card header `14px 16px 6px`; card body `6px 16px 16px`.
- Forms: 12px between fields, 6px between label and input.
- Lists: 6px between rows, rows padded `9px 10px 9px 12px`.

---

## 5. Layout

```
page (#09080a)
└─ frame: rounded 30px, --canvas, blobs behind
   ├─ sidebar: 232px (68px collapsed), sticky, glass, rounded 22px
   └─ content
      ├─ page head: title + subtitle left; badges, buttons, a goal widget right
      └─ grid of glass cards (12 columns, 36px rows, draggable by the header)
```

- Sidebar: brand at the top, nav items (44px tall, icon + label, 13px radius), and at the bottom the theme switch, sign-out and collapse. Collapsing fades the labels out (`opacity`, 0.18s) while the width animates (0.28s).
- Cards can be dragged by their header and resized from the corner. A grip icon and the resize corner only appear on hover. The drop placeholder is the accent at 18% opacity.

### Phones (≤ 760px)

- No outer frame radius or padding; the page uses `100dvh` and `env(safe-area-inset-*)`.
- The sidebar becomes a **floating glass bottom bar**: fixed, 10px from the edges, 64px tall, four equal tabs with icon over a small label (11.5px).
- A top bar holds the brand, the theme switch and sign out.
- Cards stack in one column, as tall as their content, in the desktop order (top to bottom, left to right). No dragging.
- Charts get a fixed 230px height; long lists scroll inside their card (max 62vh).
- Touch sizes: inputs 46px with 16px text (stops iOS zooming), buttons 44px, chips 36px, icon buttons 40px.
- The blobs switch to `position: fixed` so the light stays put while you scroll.
- The browser's `theme-color` meta follows `--canvas`, so the phone status bar matches the theme.

---

## 6. Components

| Component | Recipe |
| --- | --- |
| **Primary button** | Pill, 40px tall, `--pill-active` fill, `--on-accent` text, weight 500. Dark theme adds a glow: `0 6px 22px rgba(201,167,199,0.35)` plus an inset top highlight. Hover: `brightness(1.07)`. Press: `scale(0.98)`. |
| **Secondary button** | Pill, transparent, `--line-strong` border; hover fills `--surface-2`. |
| **Segmented control** (Today / Monthly / Yearly) | Track: pill in `--surface-2`, 3px padding. Options: 28px pills, grey text; the active one gets `--pill-active`. |
| **Chips** (filters) | 30px pills with a `--line-strong` border; active = accent fill, no border. |
| **Input** | 42px, 13px radius, `--surface-2` fill, transparent border that turns `--accent-glow` on focus. No outline. Placeholder is `--text-2` at 70%. |
| **Select** | Same as input, with a CSS-drawn chevron (two rotated gradients) instead of the native arrow. |
| **Range slider** | Native `<input type=range>` with `accent-color: var(--accent-glow)`; value printed on the right in bold tabular numbers. |
| **Progress bar** | 12px (or 6px "thin") pill track in `--track`, fill is `--pill-active`, minimum width 6px so 0% still shows a dot. Dark theme adds `0 0 14px` accent glow to the fill. Width animates over 0.6s. |
| **List row** | `--surface-2` rounded 14px, title with ellipsis, small grey subtitle, right-aligned amount in bold tabular numbers, small icon buttons. Done items: strikethrough, grey. |
| **Tag** | 22px outlined pill with a colored 8px dot before the text. |
| **Stat tile** | `--surface-2`, 14px radius: big value (17px / 600) over a small grey label. Two per row. |
| **Badge** | 28px pill in `--surface-2`, grey 12.5px text. |
| **Tooltip** | Solid `--card-solid`, 12px radius, `--line-strong` border, card shadow. |
| **Donut** | Inner radius 58%, outer 92%, 3px gaps, 5px corner radius, no stroke, a number and a word in the middle. |
| **Empty state** | Centered grey text in the card, saying what to do next ("Save a few days to see the lines"). |

---

## 7. Motion

- Colors and backgrounds: 0.2–0.4s ease.
- Layout changes (sidebar width): 0.28s `cubic-bezier(0.3, 0.7, 0.2, 1)`.
- Playful bits (theme lens): springy `cubic-bezier(0.3, 1.5, 0.5, 1)`.
- Cards do not animate into place on first load, only when the user moves them.
- `prefers-reduced-motion: reduce` turns every transition and animation off.

---

## 8. Rules that keep it coherent

1. **One accent.** If something is highlighted, it uses the accent. Green and red are only for gain/loss and success/error.
2. **Tokens only.** Components never contain a hex value; a new theme is a new block of variables.
3. **Numbers first.** The biggest thing in a card is the number; the label explains it in small grey text.
4. **Pills for actions, rounded rectangles for content.** Buttons, tabs, chips and bars are pills; cards, inputs and rows are rounded rectangles.
5. **Glass needs light behind it.** Without the blobs the cards look like flat grey boxes.
6. **Visible focus.** `:focus-visible` gets a 2px `--accent-glow` outline with 2px offset; selection uses the accent too.
7. **Charts follow the theme.** Axis text in `--text-2` at 12px, grid lines in `--line`, no vertical grid lines, no axis lines or ticks.

## Stack used

React + Vite, plain CSS with variables (no CSS framework), `@fontsource-variable/outfit`, `lucide-react` icons, Recharts for charts, react-grid-layout for draggable cards.
