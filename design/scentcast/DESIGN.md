---
name: ScentCast
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#434653'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
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
  tertiary: '#545c72'
  on-tertiary: '#ffffff'
  tertiary-container: '#6c748b'
  on-tertiary-container: '#fefcff'
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
  tertiary-fixed: '#dae2fd'
  tertiary-fixed-dim: '#bec6e0'
  on-tertiary-fixed: '#131b2e'
  on-tertiary-fixed-variant: '#3f465c'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 24px
  body-lg:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-md:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 32px
  headline-xl-mobile:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
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
  grid-margin: 1.5rem
  grid-gutter: 1.25rem
---

## Brand & Style

This design system merges minimalist clarity with a tactile neumorphic aesthetic, creating a serene, sensory-driven digital environment for atmospheric and olfactory forecasting. The design evokes the calm precision of meteorological tracking combined with the evocative, emotional resonance of ambient fragrances. 

### Brand Personality & Target Audience
- **Personality:** Ethereal, refined, grounding, and intuitive.
- **Audience:** Fragrance enthusiasts, lifestyle explorers, and mindful consumers seeking context-aware atmospheric insights.
- **Emotional Response:** Tranquility, anticipation, and deep sensory connection.

### Design Style: Neumorphic Minimalism
The interface utilizes soft, extruded surface geometry driven by dual light and dark shadows. Elements appear physically embossed into or debossed out of the canvas, reducing hard lines in favor of organic, tactile gradients and subtle depth transitions. Generous whitespace ensures cognitive ease, allowing atmospheric data and scent profiles to take center stage.

## Colors

The color palette directly mirrors atmospheric transitions, combining icy expanses with warm horizon glows and deep night skies.

- **Crisp Ice White (`#F8F9FA`):** The foundational canvas color, providing an airy, clean background optimized for soft shadow casting.
- **Atmospheric Blue (`#4B7BEC`):** The primary accent used for active states, key interactive elements, and meteorological indicators.
- **Sunset Amber (`#FF9F43`):** The vibrant highlight tone reserved for warm scent notes, notifications, and critical alerts.
- **Deep Navy (`#0F172A`):** The primary structural and typographic color, ensuring high legibility and anchoring the ethereal surface tones.

## Typography

Typography relies on a modern geometric sans-serif to mirror the clean, technical precision of weather instrumentation combined with editorial luxury. 

- **Scale & Hierarchy:** Font sizes maintain a strict modular scale. Display sizes above 32px adapt to mobile constraints to prevent layout breakage.
- **Optical Weight:** Medium weights are reserved for structural headings and interactive labels, while regular weights drive readability across dense atmospheric data feeds.

## Layout & Spacing

The layout employs a fluid 12-column grid system paired with an 8px base spacing rhythm. 

- **Containers & Margins:** Content is organized within breathable layout containers that scale gracefully from mobile viewports (16px margins) to expansive desktop displays (32px+ margins).
- **Whitespace Density:** Generous spacing units (`space-lg` to `space-2xl`) are applied between functional modules to reinforce the minimalist, uncluttered atmosphere.

## Elevation & Depth

Depth is the cornerstone of the neumorphic aesthetic, replacing stark borders with soft dual-shadow casting.

- **Extruded Surfaces:** Elevated cards and interactive buttons feature a combination of a light-source highlight (top-left) and a diffuse shadow (bottom-right) against the Crisp Ice White background.
- **Depressed Wells:** Input fields, sliders, and container insets utilize inverted shadows (inner shadows) to create a physically carved, tactile impression.
- **Shadow Tokens:** Default elevation uses `-6px -6px 16px rgba(255, 255, 255, 0.9), 6px 6px 16px rgba(15, 23, 42, 0.08)`.

## Shapes

A softly rounded organic geometry (`roundedness` level 2) defines all structural containers and interactive elements, avoiding sharp geometric corners to mimic polished stones or droplets.

- **Standard Radius:** Base elements use a `0.5rem` border radius.
- **Large Containers:** Cards and major panels utilize `1rem` to `1.5rem` radii to maintain soft, continuous curvature that harmonizes with neumorphic shadow casting.

## Components

All components are engineered to honor the tactile neumorphic style while ensuring maximum clarity and accessibility.

- **Buttons:** Feature soft outer shadows. Active or pressed states transition to an inset shadow (`inset`) with Atmospheric Blue fills for primary actions and Ice White surfaces for secondary actions.
- **Chips & Tags:** Pill-shaped indicators used for scent notes (e.g., "Bergamot", "Cedarwood") with subtle soft-raised surfaces and Sunset Amber accents.
- **Input Fields:** Rendered as depressed wells with inset shadows and Deep Navy placeholder text, transitioning to Atmospheric Blue focus rings.
- **Cards:** Spacious container blocks holding daily scent forecasts, weather metrics, and olfactory profiles, styled with dual-layer ambient shadows.
- **Checkboxes & Radios:** Circular or softly squared wells that depress when checked, illuminated by a vivid Sunset Amber or Atmospheric Blue inner core.
- **Scent Sliders:** Specialized atmospheric dials featuring a tracked inset groove and a raised neumorphic thumb handle for adjusting humidity and fragrance intensity.