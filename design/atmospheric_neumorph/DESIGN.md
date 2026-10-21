---
name: Atmospheric Neumorph
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#434653'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#737685'
  outline-variant: '#c3c6d6'
  surface-tint: '#1e57c7'
  primary: '#1955c5'
  on-primary: '#ffffff'
  primary-container: '#3d6fdf'
  on-primary-container: '#fefcff'
  inverse-primary: '#b2c5ff'
  secondary: '#8f4e00'
  on-secondary: '#ffffff'
  secondary-container: '#fc9d41'
  on-secondary-container: '#6b3900'
  tertiary: '#8d4b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#b15f00'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#b2c5ff'
  on-primary-fixed: '#001848'
  on-primary-fixed-variant: '#0040a2'
  secondary-fixed: '#ffdcc2'
  secondary-fixed-dim: '#ffb77a'
  on-secondary-fixed: '#2e1500'
  on-secondary-fixed-variant: '#6d3a00'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77e'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
  ice-white: '#F8F9FA'
  atmospheric-blue: '#4B7BEC'
  sunset-amber: '#FF9F43'
  deep-navy: '#0F172A'
  shadow-dark: rgba(15, 23, 42, 0.06)
  shadow-light: '#FFFFFF'
  border-hairline: rgba(15, 23, 42, 0.05)
  surface-inset: '#EFF1F5'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 44px
    fontWeight: '700'
    lineHeight: 52px
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  title-sm:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Outfit
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: 0em
  body-md:
    fontFamily: Outfit
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  label-md:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Space Grotesk
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.06em
  mono-metric:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: -0.01em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
  space-3xl: 4rem
  gutter-mobile: 1rem
  gutter-desktop: 1.5rem
  margin-mobile: 1.25rem
  margin-desktop: 3rem
  max-width: 1200px
---

## Brand & Style

This design system delivers a tactile, minimalist olfactory and fragrance discovery experience. It strips away ornate decoration in favor of physical softness, sculptural surface relief, and crisp geometric precision. The visual world is defined by soft extruded volumes, recessed wells, and crisp air, evoking clean evaporation, mist, and the refined tactility of polished flacons.

The brand persona is analytical, serene, and sensory. The aesthetic fuses **Minimalism** with **Modern Neumorphism (Soft UI)**:
- **Sculpted Monochromatic Canvases:** Rather than sharp boundaries or floating glass, containers push out from and sink into the base canvas using paired directional light and shadow.
- **Micro-Bevels & Precise Insets:** Inputs, sliders, and unselected states recede as soft inset impressions (`box-shadow: inset ...`), while primary cards and interactive toggles extrude forward with silky gradients.
- **Airy Restraint:** Color is deployed with surgical discipline—Atmospheric Blue drives focused interaction and active states, while Sunset Amber delivers sharp energetic warmth for ratings and olfactory accords against deep navy typographic clarity.

## Colors

The color palette is derived directly from the atmospheric daylight continuum:

- **Crisp Ice White (`#F8F9FA`):** The universal physical canvas, card background, and specular reflection highlight. Surfaces match the canvas tone so that depth is communicated solely via directional light and shadow.
- **Atmospheric Blue (`#4B7BEC`):** The primary interactive accent. Embodies clean aquatic diffusion, air currents, and active system signals. Used for focal call-to-actions, focused rings, and active state indicators.
- **Sunset Amber (`#FF9F43`):** The secondary chromatic accent. Evokes base notes (amber, resins, warm spices), star ratings, dupe similarity matches, and warmth metrics.
- **Deep Navy (`#0F172A`):** The high-contrast neutral anchor. Applied to primary typography, structural icons, and deep dark toggles to preserve WCAG AAA legibility against the pale surfaces.
- **Supporting Tones:**
  - Inset Well Tint (`#EFF1F5`): Used inside pressed cards, sliders, and search troughs.
  - Secondary Text (`#64748B`): Muted slate for metadata, scent pyramid timing, and helper copy.

## Typography

Typography pairs the technical precision of **Space Grotesk** with the balanced geometric clarity of **Outfit**.

- **Display & Headlines (Space Grotesk):** Features crisp ink traps and confident geometric architecture. Delivers an authoritative editorial presence across fragrance titles, perfumer credits, and olfactory notes. Letter spacing is pulled tight (`-0.02em` to `-0.03em`) to anchor extruded surfaces.
- **Body & Continuous Text (Outfit):** Pure, circular geometry with open apertures that maximize readability on soft, low-contrast monochromatic backgrounds.
- **Labels & Metrics (Space Grotesk):** All note accords (Top, Mid, Base), projection metrics, and price points run in uppercase Space Grotesk with expanded tracking (`+0.04em` to `+0.06em`) for rapid scanability.

## Layout & Spacing

The layout is governed by an 8-point baseline grid designed to give extruded and recessed components ample breathing room, avoiding visual mud or overlapping shadow skirts.

- **Responsive Grid:**
  - **Mobile (< 640px):** 4 fluid columns with `1.25rem` (20px) margins and `1rem` (16px) gutters.
  - **Tablet (640px–1024px):** 8 fluid columns with `2rem` (32px) margins and `1.5rem` (24px) gutters.
  - **Desktop (> 1024px):** 12 fluid columns within a fixed `1200px` max-width container, centered with `3rem` (48px) margins.
- **Whitespace Strategy:** Neumorphic shadow radiuses extend between 12px and 24px around elements. Elements must maintain at least `1rem` (16px) clearance from adjacent containers to avoid shadow collisions.

## Elevation & Depth

Elevation is achieved through light source modeling: a simulated directional light originating from the top-left (`-45°`), casting a crisp white specular reflection along the top-left and an ambient dark shadow toward the bottom-right.

- **Base Canvas:** Solid `#F8F9FA`.
- **Level 1 (Extruded Surface / Default Cards):**
  - Background: `#F8F9FA`
  - Border: `1px solid rgba(15, 23, 42, 0.04)`
  - Shadow: `6px 6px 14px rgba(15, 23, 42, 0.06), -6px -6px 14px #FFFFFF`
- **Level 2 (Elevated Interactive / Hover States):**
  - Background: `#F8F9FA`
  - Border: `1px solid rgba(15, 23, 42, 0.03)`
  - Shadow: `10px 10px 22px rgba(15, 23, 42, 0.08), -10px -10px 22px #FFFFFF`
- **Level Inset (Recessed Wells / Inputs / Sliders / Active Toggle Beds):**
  - Background: `#EFF1F5`
  - Border: `1px solid rgba(15, 23, 42, 0.05)`
  - Shadow: `inset 4px 4px 8px rgba(15, 23, 42, 0.07), inset -4px -4px 8px #FFFFFF`
- **Atmospheric Glow (Active Focus & Primary Highlights):**
  - Combined with Level 2 elevation: `0 4px 18px rgba(75, 123, 236, 0.25)`

## Shapes

The shape system employs soft, organic silhouettes (`roundedness: 3`) reflecting organic perfume decanters and tactile physical switches:

- **Pills (`rounded-full`, 9999px):** Standard for all buttons, filter chips, olfactory note badges, and search bars. Neumorphic lighting looks cleanest across continuous, unsegmented curves.
- **Surface Cards (`rounded-2xl` to `rounded-3xl`, 20px–28px):** Structural cards, comparison panels, and dialogs use generous curvature to let dual-tone drop shadows feather evenly.
- **Sliders and Micro Controls (`rounded-full`):** Trough cavities and toggle switches use strict circular or pill profiles.

## Components

### Buttons
- **Extruded Pill (Standard):** Canvas match `#F8F9FA`, `box-shadow: 5px 5px 12px rgba(15, 23, 42, 0.06), -5px -5px 12px #FFFFFF`, border `1px solid rgba(15, 23, 42, 0.03)`, text `#0F172A`. Active click shifts instantly to inset: `inset 3px 3px 6px rgba(15, 23, 42, 0.08), inset -3px -3px 6px #FFFFFF`.
- **Primary Atmospheric Pill:** Gradient fill from `#4B7BEC` to `#3B6CD9`, text `#FFFFFF`, dual shadow `6px 6px 16px rgba(75, 123, 236, 0.35), -4px -4px 10px #FFFFFF`.
- **Amber Accent Button:** Used for high-intent dupe triggers and checkout actions. Solid `#FF9F43`, text `#FFFFFF`, dual shadow `6px 6px 16px rgba(255, 159, 67, 0.32), -4px -4px 10px #FFFFFF`.

### Inputs & Search Bars
- **Recessed Inset Well:** Background `#EFF1F5`, inner shadow `inset 4px 4px 8px rgba(15, 23, 42, 0.06), inset -4px -4px 8px #FFFFFF`, border `1px solid rgba(15, 23, 42, 0.04)`, `rounded-full`.
- **Focus State:** Inset shadow preserved with outer ring `0 0 0 2px rgba(75, 123, 236, 0.4)`.

### Chips & Accord Badges
- **Unselected Note Chip:** Extruded mini-pill (`#F8F9FA`), soft dual shadow `3px 3px 8px rgba(15,23,42,0.05), -3px -3px 8px #FFF`, text `#0F172A`.
- **Active Note Chip:** Inset mini-pill (`#EFF1F5`), shadow `inset 2px 2px 5px rgba(15,23,42,0.08), inset -2px -2px 5px #FFF`, with Atmospheric Blue text (`#4B7BEC`) and a 6px blue dot indicator.

### Cards & Scent Tiles
- **Extruded Card Base:** Background `#F8F9FA`, `box-shadow: 8px 8px 18px rgba(15, 23, 42, 0.05), -8px -8px 18px #FFFFFF`, subtle hairline border `1px solid rgba(15, 23, 42, 0.03)`, `rounded-2xl`.
- **Recessed Image Container:** Flacon imagery sits inside an inset cavity (`background: #EFF1F5; box-shadow: inset 3px 3px 6px rgba(15,23,42,0.05), inset -3px -3px 6px #FFF`) with `rounded-xl` geometry.

### Checkboxes & Radios
- **Unchecked:** Inset circle or rounded square (`#EFF1F5`) with `inset 2px 2px 4px rgba(15,23,42,0.08)`.
- **Checked:** Inset trough housing a centered, convex Atmospheric Blue dot (`#4B7BEC`) with a soft specular highlight.

### Scent Pyramid & Performance Meters
- **Note Pyramid:** Three horizontally stacked extruded pill layers (Top, Heart, Base). Selected tier pushes into the surface (inset state), highlighting associated olfactory ingredients.
- **Longevity / Sillage Gauges:** Recessed groove track (`#EFF1F5`) filled with a pill-ended progress bar colored in Atmospheric Blue (`#4B7BEC`) or Sunset Amber (`#FF9F43`) depending on potency.