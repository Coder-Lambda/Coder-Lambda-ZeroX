uxstyling
```markdown
# Design System Specification: Tactile Neo-Skeuomorphic UI

This document serves as the absolute visual and technical reference for building application components matching the provided **Product UI Styleguide**. 

---

## 1. Visual DNA & Design Philosophy

The aesthetic combines **Modern Skeuomorphism**, **Tactile Neumorphism**, and **visionOS-style Precision**.
* **Depth & Lighting:** Fixed overhead directional light (90° to 180°). Every element features an illuminated top edge (specular rim light) and a grounded bottom shadow.
* **Volume:** Interfaces feel physical, extruded, or recessed. Surfaces are not flat blocks of color; they feature subtle micro-gradients.
* **Contours:** High border radii (pill-shapes `9999px` and squircles `16px–24px`).
* **Tactility:** Surfaces indicate whether they are **raised (elevated)**, **flush (neutral)**, or **debossed (carved into the canvas)**.

---

## 2. Global Design Tokens (CSS Variables)

```css
:root {
  /* Canvas & Background */
  --bg-app: #F5F6F9;
  --bg-canvas-ambient: radial-gradient(circle at 90% 10%, rgba(255, 185, 160, 0.35) 0%, rgba(245, 246, 249, 0) 55%);
  --grid-line-color: rgba(0, 0, 0, 0.04);

  /* Primary Accent (Vibrant Flame Orange) */
  --accent-orange-from: #FF7338;
  --accent-orange-to: #FF4500;
  --accent-orange-glow: rgba(255, 87, 34, 0.40);

  /* Tactical Dark Tokens */
  --dark-surface-top: #23272F;
  --dark-surface-bottom: #14161B;
  --dark-surface-rim: rgba(255, 255, 255, 0.12);
  --dark-track-bg: #1A1C22;

  /* Metallic & Neutral Tokens */
  --silver-gradient-from: #E3E7ED;
  --silver-gradient-to: #B8C0CC;
  --surface-pill-white: #FFFFFF;
  --surface-pill-muted: #F0F2F6;

  /* Neon Status (Active Accent) */
  --neon-green-from: #A0F53D;
  --neon-green-to: #67D30E;
  --neon-green-glow: rgba(110, 222, 20, 0.45);

  /* Shadow Architectures */
  --elevation-low: 0 2px 4px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.03);
  --elevation-med: 0 8px 16px -2px rgba(0, 0, 0, 0.06), 0 3px 6px -1px rgba(0, 0, 0, 0.04);
  --elevation-high: 0 14px 28px -4px rgba(0, 0, 0, 0.10), 0 6px 12px -2px rgba(0, 0, 0, 0.06);
  --inset-bevel-light: inset 0 1px 0 rgba(255, 255, 255, 0.9), inset 0 -1px 1px rgba(0, 0, 0, 0.08);
  --inset-well-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.12), inset 0 1px 2px rgba(0, 0, 0, 0.08), 0 1px 0 rgba(255, 255, 255, 0.8);

  /* Radii */
  --radius-squircle: 20px;
  --radius-pill: 9999px;
}
```

---

## 3. Detailed Component Catalog

### 3.1. Primary Action Button (`Color tokens > Primary`)
* **Visual:** A pill button with a saturated orange vertical gradient, soft ambient drop shadow, and a glowing outer diffuse ring.
* **Purpose:** Main call-to-action (CTA).
* **Specifications:**
  ```css
  .btn-primary-orange {
    background: linear-gradient(180deg, var(--accent-orange-from) 0%, var(--accent-orange-to) 100%);
    border-radius: var(--radius-squircle);
    padding: 16px 32px;
    color: #FFFFFF;
    font-weight: 600;
    font-size: 15px;
    border: none;
    box-shadow: 
      inset 0 1px 1px rgba(255, 255, 255, 0.4), /* Top specular rim */
      inset 0 -2px 2px rgba(0, 0, 0, 0.2),        /* Bottom lip */
      0 8px 20px -2px var(--accent-orange-glow);  /* Colored ambient drop */
  }
  ```

---

### 3.2. Dark Tactile Squircle Button (`Typography scale > Radius`)
* **Visual:** Premium deep-slate square button with pillowy roundness and glossy specular highlight across the upper half.
* **Specifications:**
  ```css
  .btn-dark-squircle {
    background: linear-gradient(180deg, var(--dark-surface-top) 0%, var(--dark-surface-bottom) 100%);
    border-radius: 20px;
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #FFFFFF;
    font-weight: 500;
    box-shadow: 
      inset 0 1px 1px var(--dark-surface-rim),
      0 8px 16px rgba(0, 0, 0, 0.25);
  }
  ```

---

### 3.3. Multi-Segment Interconnected Ribbon (`Buttons > Elevation`)
* **Visual:** A continuous pill-shaped segmented navigation bar where each tab seamlessly morphs into the next via organic interlocking wave transitions across a continuous 5-step value gradient.
* **Steps:**
  1. `Surcing`: Dark Charcoal `#1B1E24` (White text)
  2. `Radius`: Slate Blue-Gray `#3C4452` (White text)
  3. `Elevation`: Muted Steel `#737F92` (White text)
  4. `Buttons`: Soft Ice-Silver `#BCC5D3` (Dark text `#23272F`)
  5. `Focus ring`: Off-White `#ECEFF4` (Dark text `#23272F`)
* **Specifications:**
  ```css
  .segmented-ribbon-container {
    display: flex;
    border-radius: var(--radius-pill);
    overflow: hidden;
    box-shadow: var(--elevation-med);
    border: 1px solid rgba(0, 0, 0, 0.05);
  }

  .ribbon-segment {
    padding: 14px 28px;
    font-size: 14px;
    font-weight: 500;
    position: relative;
  }
  ```

---

### 3.4. Tactile White Inputs / Pills (`Inputs` Grid)
* **Elements:** `Primary`, `Surface`, `Border`, `Focus ring`
* **Visual:** Soft, light, extruded pill buttons that look physically molded onto the page.
* **Specifications:**
  ```css
  .input-pill {
    background: linear-gradient(180deg, #FFFFFF 0%, #F5F7FA 100%);
    border-radius: var(--radius-pill);
    padding: 10px 24px;
    color: #1F242D;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 1),
      inset 0 -1px 1px rgba(0, 0, 0, 0.05),
      0 4px 10px rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(0, 0, 0, 0.04);
  }
  ```

---

### 3.5. Brushed Metallic Chip (`Chips > Surface`)
* **Visual:** A beveled chip resembling matte or brushed aluminum.
* **Specifications:**
  ```css
  .chip-metallic {
    background: linear-gradient(180deg, var(--silver-gradient-from) 0%, var(--silver-gradient-to) 100%);
    border-radius: var(--radius-pill);
    padding: 8px 24px;
    color: #14171C;
    font-weight: 500;
    font-size: 14px;
    border: 1px solid rgba(255, 255, 255, 0.6);
    box-shadow: 
      inset 0 1px 1px rgba(255, 255, 255, 0.9),
      inset 0 -1px 2px rgba(0, 0, 0, 0.15),
      var(--elevation-low);
  }
  ```

---

### 3.6. 3D Spherical Toggle Switch (`Chips > Toggle`)
* **Visual:** Recessed horizontal dark track with an extruded metallic ball that casts directional shadows onto the track.
* **Specifications:**
  ```css
  .toggle-track-dark {
    width: 64px;
    height: 32px;
    background: linear-gradient(180deg, #181A20 0%, #2D323C 100%);
    border-radius: var(--radius-pill);
    position: relative;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
  }

  .toggle-thumb-sphere {
    width: 28px;
    height: 28px;
    position: absolute;
    top: 2px;
    left: 2px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #FFFFFF 0%, #CED4DE 60%, #8A94A6 100%);
    box-shadow: 
      2px 2px 6px rgba(0, 0, 0, 0.4),
      inset 0 1px 1px rgba(255, 255, 255, 0.8);
  }
  ```

---

### 3.7. Tactical Dark Island Capsule (`Tabs` - Left)
* **Visual:** An all-in-one console capsule. Houses three integrated controls:
  1. A mini stepper toggle `[ ⌃ / ⌄ ]`
  2. A counter badge `[ 3 ]`
  3. A glowing Neon-Green active radio switch `[ (●) ]`
* **Specifications:**
  ```css
  .tactical-island {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    background: linear-gradient(180deg, #2A2E36 0%, #16181D 100%);
    border-radius: var(--radius-pill);
    box-shadow: 
      inset 0 1px 1px rgba(255, 255, 255, 0.15),
      0 10px 20px rgba(0, 0, 0, 0.3);
  }

  .tactical-island .sub-pill {
    background: #21242B;
    border-radius: var(--radius-pill);
    padding: 6px 14px;
    color: #FFFFFF;
    font-size: 13px;
    font-weight: 600;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }

  .tactical-island .neon-toggle {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, var(--neon-green-from) 0%, var(--neon-green-to) 100%);
    box-shadow: 0 0 12px var(--neon-green-glow);
  }
  ```

---

### 3.8. Floating Search Field with Integrated Icon (`Tabs` - Right)
* **Visual:** Soft pill input field with an inset divider line separating the text input area from a circular tactile search icon button on the right.
* **Specifications:**
  ```css
  .search-pill-container {
    display: flex;
    align-items: center;
    background: #FFFFFF;
    border-radius: var(--radius-pill);
    padding: 4px 6px 4px 18px;
    box-shadow: var(--elevation-med);
    border: 1px solid rgba(0, 0, 0, 0.03);
  }

  .search-pill-container input {
    border: none;
    outline: none;
    font-size: 14px;
    color: #4A5260;
  }

  .search-icon-btn {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: #F4F6F9;
    border: 1px solid rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--inset-bevel-light);
  }
  ```

---

### 3.9. Debossed Card Well (`Cards > Search invoices`)
* **Visual:** Unlike the elevated buttons, this component is **carved inward** (concave/debossed). It sits sunken inside the parent surface.
* **Specifications:**
  ```css
  .well-card-recessed {
    background: #ECEFF4;
    border-radius: 16px;
    padding: 14px 20px;
    box-shadow: var(--inset-well-shadow);
    color: #7A8494;
    font-size: 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.9);
  }
  ```

---

### 3.10. Horizontal Layout Rule & Metric Tick Bar (Bottom Ruler)
* **Visual:** A technical measurement scale marked with dots and ticks numbered 1 to 19, indicating modular columns and spatial spacing.
* **Usage:** Use an 8px base rhythm. Outer margins align to standard subdivisions (1, 2, 4, 8, 12, 16, 24, 32).

---

## 4. Claude Code Implementation Rules

When generating screens or components conforming to this design system:

1. **Never generate completely flat buttons (`background: solid-color`).** Always supply a directional top-to-bottom subtle gradient (`linear-gradient(180deg, ...)`).
2. **Every elevated component must have two shadows:**
   * One **ambient drop shadow** (`box-shadow: 0 8px 16px ...`) to lift it off the background.
   * One **inset top specular reflection** (`inset 0 1px 0 rgba(255, 255, 255, 0.8)`) to establish the light source.
3. **States & Feedback:**
   * `:hover` -> Increase ambient shadow dispersion and decrease opacity of the dark gradient stop slightly.
   * `:active` (Pressed) -> Translate down `translateY(1px)`, remove drop shadow, and add `inset 0 2px 4px rgba(0,0,0,0.15)` to convey physical compression.
4. **Font Selection:** Use modern neutral grotesques: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif`. Heavy font weight (`700–800`) for top headers; Medium (`500–600`) for all tactile controls.
```