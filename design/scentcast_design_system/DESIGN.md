---
name: ScentCast Design System
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3f4850'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#707881'
  outline-variant: '#bfc7d2'
  surface-tint: '#006398'
  primary: '#006194'
  on-primary: '#ffffff'
  primary-container: '#007bb9'
  on-primary-container: '#fdfcff'
  inverse-primary: '#93ccff'
  secondary: '#a93349'
  on-secondary: '#ffffff'
  secondary-container: '#fe7488'
  on-secondary-container: '#730425'
  tertiary: '#4651b9'
  on-tertiary: '#ffffff'
  tertiary-container: '#606ad4'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cce5ff'
  primary-fixed-dim: '#93ccff'
  on-primary-fixed: '#001d31'
  on-primary-fixed-variant: '#004b73'
  secondary-fixed: '#ffdadc'
  secondary-fixed-dim: '#ffb2b9'
  on-secondary-fixed: '#400010'
  on-secondary-fixed-variant: '#891933'
  tertiary-fixed: '#e0e0ff'
  tertiary-fixed-dim: '#bdc2ff'
  on-tertiary-fixed: '#000767'
  on-tertiary-fixed-variant: '#2f3aa3'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 44px
    fontWeight: '800'
    lineHeight: 52px
    letterSpacing: -0.03em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.015em
  title-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
  currency-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
  gutter-mobile: 1rem
  gutter-desktop: 1.5rem
  margin-mobile: 1rem
  margin-desktop: 2.5rem
  max-width: 1240px
---

## Brand & Style

This design system powers a tropical fragrance intelligence platform engineered for Malaysian youth and young working professionals (aged 18–35). The sensory experience balances scientific olfactory categorization with the vibrant, sun-drenched daily atmosphere of Southeast Asia.

The design movement merges **Modern Glassmorphism** with **Atmospheric Layering**:
- **Clarity & Freshness:** Translucent, frosted cards evoke light mist, dew, and clean evaporation under high heat.
- **Warm Micro-Gradients:** Subtle sunset hues (coral, amber, and twilight lavender) blend against cool sky blues to simulate changing daylight and humidity shifts across Kuala Lumpur, George Town, and Johor Bahru.
- **Youthful Precision:** Tactile pill tags, crisp geometric typography, and analytical scent meters communicate fragrance performance (projection, sillage, longevity) in heavy humidity without feeling sterile or clinically pharmaceutical.

## Colors

The palette simulates the Malaysian atmosphere—shifting between clear morning downpours, intense midday UV index, and golden sunset streetscapes.

- **Primary (`#0284C7` Sky Aura / `#38BDF8` Light Breeze):** Represents freshness, aquatic notes, airy diffusion, and clarity. Used for primary interactive actions, high match indicators, and active navigation states.
- **Secondary (`#FB7185` Sunset Coral / `#F59E0B` Tropical Amber):** Reflects warm base notes (vanilla, amber, musk) and weather states like high heat index or spicy daytime wear.
- **Tertiary (`#818CF8` Scent Twilight / `#C084FC` Petal Lavender):** Applied to floral, powdery, or evening fragrance pyramids, AI recommendations, and luxury highlight markers.
- **Neutral (`#64748B` Slate Gray):** Balances UI chrome, secondary metadata, and border treatments.
- **Surfaces & Canvases:** Base background is `#F8FAFC` to `#EEF2F6` (a faint sky-indigo wash). Glass card fills utilize `rgba(255, 255, 255, 0.78)` to keep legibility pristine beneath tropical-tinted glows.
- **Semantic Statuses:**
  - Tropical Rain/Humid: Sky Indigo (`#38BDF8` / `#6366F1`)
  - Warm/Sunny: Golden Amber (`#F59E0B`)
  - Match Indicator (Dupe engine): Emerald Green (`#10B981`) for matches ≥ 85%, Amber (`#F59E0B`) for 70–84%.

## Typography

**Plus Jakarta Sans** is the single typographic voice across the design system. Its geometric foundation provides legibility on mobile viewports while its warm, rounded apexes and terminals echo fragrance mist droplets.

- **Display & Headlines:** Set in bold and extra-bold weights with snug negative letter spacing for punchy editorial product titles, scent personality hooks, and weather alerts.
- **Body:** Neutral weights (400) optimized with relaxed line-heights to explain complex scent chemistry, climate tips, and longevity insights without visual fatigue.
- **Labels & Microcopy:** Badges, olfactory note tags (Top, Mid, Base), and Malaysian Ringgit values (`RM 120 - RM 450`) utilize semi-bold and bold weights with uppercase tracking for rapid legibility on small handheld screens.

## Layout & Spacing

The layout model is built on an **8pt rhythmic base** using a 12-column responsive fluid grid for desktop and an adaptive 4-column system for mobile.

- **Breakpoints:**
  - Mobile: `< 640px` (4 columns, 16px margins, 12px gutters)
  - Tablet: `640px – 1024px` (8 columns, 24px margins, 16px gutters)
  - Desktop: `> 1024px` (12 columns, max 1240px container, centered, 24px gutters)
- **Hierarchy & Densities:**
  - Compact cards (scent note tags, weather pills) employ `space-xs` and `space-sm` for agile tapping.
  - Multi-column dupe comparison matrices and scent pyramids utilize `space-lg` to create clear separation between contrasting accords and performance ratings.

## Elevation & Depth

Visual hierarchy uses **Glassmorphic Tonal Layers** and **Tinted Ambient Glows** to communicate the diffusion of scent:

- **Surface Level 0 (Canvas):** Soft ambient tint `#F8FAFC` accented with subtle, static radial color washes (top-right sky blue `#38BDF8` at 8% opacity, bottom-left warm coral `#FB7185` at 6% opacity).
- **Surface Level 1 (Default Glass Cards):** Background `rgba(255, 255, 255, 0.72)` paired with `backdrop-filter: blur(16px)`, a structural border `1px solid rgba(226, 232, 240, 0.8)`, and a diffuse drop shadow: `0 8px 32px -4px rgba(15, 23, 42, 0.05), 0 2px 8px -2px rgba(15, 23, 42, 0.03)`.
- **Surface Level 2 (Interactive Floating & Weather Cards):** Background `rgba(255, 255, 255, 0.88)` with `backdrop-filter: blur(20px)`, border `1px solid rgba(255, 255, 255, 0.9)`, and an ambient shadow tinted with primary sky blue: `0 16px 40px -8px rgba(2, 132, 199, 0.12), 0 4px 12px -2px rgba(15, 23, 42, 0.04)`.
- **Surface Level 3 (AI Floating Assistant & Modals):** High-clarity glass `rgba(255, 255, 255, 0.94)`, double border (inner `1px solid rgba(255, 255, 255, 1)`, outer `1px solid rgba(192, 132, 252, 0.3)`), and high elevation: `0 24px 48px -12px rgba(99, 102, 241, 0.2)`.

## Shapes

The interface embraces organic fluid geometry inspired by perfume bottles, flacons, and mist droplets:

- **Cards & Surfaces:** Standardized to `1rem` (16px) and `1.5rem` (24px, `rounded-2xl`). This produces soft boundaries that complement the glass blur effects.
- **Pills & Status Indicators:** Use full rounded pill geometry (`9999px`) for note badges (Citrus, Amber, Woody), weather chips, and pricing tags.
- **Interactive Inputs & Buttons:** Radius set to `0.75rem` (12px) to provide defined, tap-friendly affordance without becoming overly bulbous.

## Components

### Buttons
- **Primary:** Gradient fill from Sky Blue (`#0284C7`) to Light Cyan (`#0EA5E9`), white text, `0 4px 14px rgba(2, 132, 199, 0.3)` shadow, `rounded-xl`, 12px 24px padding.
- **Secondary / Soft:** Translucent surface `rgba(255, 255, 255, 0.8)` with `1px solid #E2E8F0`, text in Slate 800 (`#1E293B`), hover state lifting with subtle sunset coral tint `rgba(251, 113, 133, 0.08)`.
- **Dupe Match Action:** Pill-shaped, featuring an inner pill percentage tag alongside an actionable "Find Dupe" prompt.

### Chips & Note Badges
- **Olfactory Accord Pills:** Small, full-radius pills (`rounded-full`) with category-mapped pastel colorways:
  - *Citrus / Fresh:* Pale lime-sky background, teal border, slate-800 text.
  - *Woody / Earthy:* Warm sand/amber tint, amber border.
  - *Floral:* Soft lavender tint, purple border.
  - *Gourmand:* Pale coral tint, coral border.
- **Weather Badges:** Compact glass pills hosting an icon, temperature, condition, and locality: e.g., `[Sun Icon] 32°C Lembap • Kuala Lumpur`.

### Scent Pyramid Component
- A stacked, tiered pyramid visualization:
  - **Top Notes:** Light sky blue glass segment showing fastest evaporating ingredients (Bergamot, Pink Pepper).
  - **Heart / Mid Notes:** Soft lavender glass tier (Jasmine, Cardamom, Lavender).
  - **Base Notes:** Warm amber glass foundation (Patchouli, Vanilla, Cedarwood).
- Each tier displays note duration metrics specifically calibrated for humid climates (e.g., "Top: 15–30 mins in 32°C").

### Dupe Match Comparison Card
- Split-screen comparison card featuring the reference luxury fragrance vs. budget-friendly alternative with Malaysian pricing (`RM 650` vs. `RM 65`).
- **Match Meter:** Circular or progress bar gauge with animated gradient fill (Sky Blue to Sunset Coral) indicating percentage similarity (e.g. `94% Match`).
- **Climate Endurance Index:** Badge showing performance under local humidity levels (e.g. `6h+ Sweat Resistance`).

### Weather Fragrance Advisory Card
- Glass card anchored at the top of discovery feeds: displays live API-driven Malaysian weather (KL, Penang, JB, Kuching) with customized scent suggestions ("High humidity today: Avoid heavy ouds; reach for crisp aquatics or tea florals").

### Interactive Rating Stars
- Custom star glyphs filled with sunset amber (`#F59E0B`), unfilled with translucent slate (`#E2E8F0`), accompanied by numerical scores and localized review tags ("Lasts entire LRT commute").

### Floating AI Fragrance Assistant Bot
- Positioned floating at the bottom right. A frosted, spherical orb with an animated pulsing twilight lavender border (`#818CF8`). Displays micro-prompts: *"Cari perfume tahan panas RM150?"* (Find heat-resistant perfumes under RM150).