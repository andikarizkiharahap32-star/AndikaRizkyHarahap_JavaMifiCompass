---
name: Transit Wayfinding
colors:
  surface: '#f7faf8'
  surface-dim: '#d7dbd9'
  surface-bright: '#f7faf8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f4f2'
  surface-container: '#ebefed'
  surface-container-high: '#e6e9e7'
  surface-container-highest: '#e0e3e1'
  on-surface: '#181c1b'
  on-surface-variant: '#464650'
  inverse-surface: '#2d3130'
  inverse-on-surface: '#eef1ef'
  outline: '#6B7570'
  outline-variant: '#c6c5d1'
  surface-tint: '#515a95'
  primary: '#000846'
  on-primary: '#EDF0EE'
  primary-container: '#18215a'
  on-primary-container: '#818ac9'
  inverse-primary: '#bbc3ff'
  secondary: '#535c89'
  on-secondary: '#ffffff'
  secondary-container: '#c1c9fd'
  on-secondary-container: '#4b5480'
  tertiary: '#0b1411'
  on-tertiary: '#ffffff'
  tertiary-container: '#202925'
  on-tertiary-container: '#86908b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dfe0ff'
  primary-fixed-dim: '#bbc3ff'
  on-primary-fixed: '#0a144e'
  on-primary-fixed-variant: '#39427c'
  secondary-fixed: '#dde1ff'
  secondary-fixed-dim: '#bbc4f7'
  on-secondary-fixed: '#0e1841'
  on-secondary-fixed-variant: '#3b446f'
  tertiary-fixed: '#dbe5df'
  tertiary-fixed-dim: '#bfc9c3'
  on-tertiary-fixed: '#141d1a'
  on-tertiary-fixed-variant: '#3f4944'
  background: '#f7faf8'
  on-background: '#181c1b'
  surface-variant: '#e0e3e1'
  primary-hover: '#2B3A8C'
  primary-pressed: '#0E1440'
  paper: '#FFFFFF'
  paper-edge: '#CDD4D0'
  sunken: '#E1E6E3'
  selection: '#D3D9F0'
  line-wifi: '#F27B2A'
  line-wifi-stroke: '#C95A0A'
  line-esim: '#4C97FF'
  line-esim-stroke: '#2468E0'
  line-sim: '#E96BB0'
  line-sim-stroke: '#C23A86'
  line-pro: '#18215A'
  success: '#176B40'
  success-surface: '#D7EBDF'
  warning: '#7A4F00'
  warning-surface: '#F7E8C2'
  danger: '#A8231B'
  danger-surface: '#F6D9D6'
  night-ground: '#0E1438'
  night-raised: '#171F54'
  night-edge: '#2B357A'
  night-ink: '#E9ECF8'
  night-ink-soft: '#A7AFD6'
typography:
  display-xl:
    fontFamily: Barlow Condensed
    fontSize: 5rem
    fontWeight: '700'
    lineHeight: '0.92'
    letterSpacing: -0.01em
  display-lg:
    fontFamily: Barlow Condensed
    fontSize: 3.5rem
    fontWeight: '700'
    lineHeight: '0.95'
    letterSpacing: -0.01em
  display-lg-mobile:
    fontFamily: Barlow Condensed
    fontSize: 2.75rem
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: -0.01em
  display-md:
    fontFamily: Barlow Condensed
    fontSize: 2.5rem
    fontWeight: '700'
    lineHeight: '1'
  headline:
    fontFamily: Barlow Condensed
    fontSize: 2rem
    fontWeight: '600'
    lineHeight: '1.1'
  numeric-xl:
    fontFamily: Barlow Condensed
    fontSize: 4rem
    fontWeight: '600'
    lineHeight: '1'
  numeric-md:
    fontFamily: Barlow Condensed
    fontSize: 1.75rem
    fontWeight: '600'
    lineHeight: '1.1'
  bullet-letter:
    fontFamily: Barlow Condensed
    fontSize: 1rem
    fontWeight: '700'
    lineHeight: '1'
  title:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.25rem
    fontWeight: '700'
    lineHeight: '1.35'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: '1.7'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: '1.625'
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: '1.5'
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 1rem
    fontWeight: '700'
    lineHeight: '1.25'
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.875rem
    fontWeight: '600'
    lineHeight: '1.25'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 0.8125rem
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.01em
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 0.9375rem
    fontWeight: '500'
    lineHeight: '1.5'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
  space-2xl: 4rem
  space-3xl: 6rem
---

## Brand & Style

### Design Narrative & Personality
This design system adapts public transit wayfinding—channeling the mechanical clarity of Tokyo Metro schematics, airport boarding passes, and municipal line maps—to global travel connectivity. It is utilitarian, deliberate, calm, and structurally rigorous. In stressful travel contexts (airports, border crossings, terminal stations), users require immediate legibility and predictability, not decorative flair. 

The aesthetic is grounded in **Tactile Wayfinding Minimalism**:
- Pure white (`#FFFFFF`) is reserved exclusively as a physical material—simulated card stock or paper tickets—resting on a cool grey-green paper ground (`#EDF0EE`).
- High-contrast, dense typographic signage is paired with structured transit lines (spines) that visually organize workflows into linear journeys.
- Color functions strictly as semantic data: deep Nila indigo serves as structural ink, while vivid transit line tones identify connection modes (WiFi, eSIM, SIM, PRO).

### Visual Metaphors
1. **The Wayfinding Spine**: Journeys, configurations, and checkouts are represented as transit lines punctuated by circular "stations."
2. **Paper Ticketry**: Actionable items and critical receipts behave like physical boarding passes, complete with simulated edge lips, perforation marks, and tear stubs.
3. **Octilinear Precision**: Schematic paths, maps, and connectors bend strictly at 0°, 45°, and 90° angles.

## Colors

### Surface Hierarchy & Contrast
- **Base Ground (`#EDF0EE`)**: Cool, tactile grey-green foundation mimicking architectural paper. Never pure white.
- **Paper Surface (`#FFFFFF`)**: Card stock representation. Confined to bounded objects (Trip Cards, station code plates, QR blocks, input surfaces).
- **Sunken Surface (`#E1E6E3`)**: Recessed utility beds, table headers, code blocks, and unlit meter tracks.
- **Primary Ink (`#18215A`)**: Deep Nila indigo. The authoritative anchor for body text, primary actions, and transit spine tracks.
- **De-emphasized Ink (`#454E7A`)**: Secondary metadata, timestamps, and captions.

### Product Lines
Product colors signify connectivity products and must occupy less than 2% of the total viewport area. They are applied to bullet letters, route strokes, and data meters:
- **WiFi**: Fill `#F27B2A` (`line-wifi`), stroke `#C95A0A` (`line-wifi-stroke`).
- **eSIM**: Fill `#4C97FF` (`line-esim`), stroke `#2468E0` (`line-esim-stroke`).
- **SIM**: Fill `#E96BB0` (`line-sim`), stroke `#C23A86` (`line-sim-stroke`).
- **PRO**: Fill/Stroke `#18215A` (`line-pro`).

### Night Theme Rules
When color mode switches to dark/night:
- Base canvas shifts to deep indigo `#0E1438` (`night-ground`).
- Raised paper objects shift to `#171F54` (`night-raised`) with edges bound by `#2B357A` (`night-edge`).
- Primary copy shifts to `#E9ECF8` (`night-ink`), secondary copy to `#A7AFD6` (`night-ink-soft`).
- Product line accents retain their light-mode hue values for cross-environment recognizability.
- QR code backgrounds remain immutable `#FFFFFF` with `#000000` modules across all modes.

## Typography

### Architectural Hierarchy
- **Barlow Condensed (Transit Signage)**: Used for station announcements, flight-board headers, airport codes, wayfinding indicators, and tabular metrics. The condensed width allows rapid scanning of dense operational information.
- **Plus Jakarta Sans (Wayfinding Body & UI)**: Clean, high-legibility geometric sans-serif serving all general interface roles, form inputs, button labels, and instructional text.
- **Monospace Stack (Machine Strings)**: Formatted via `code-md` for tabular ICCIDs, order numbers, IMEI keys, and hex records.

### Implementation Rules
- **Tabular Figures**: Force tabular figures (`font-feature-settings: "tnum" 1`) on `numeric-xl`, `numeric-md`, `body-sm`, and `code-md`.
- **Measure Limits**: Restrict `body-lg` editorial running copy to `72ch`; default `body-md` interface blocks to `64ch`.
- **Currency Styling**: Prefix currency identifiers (e.g., `Rp`) using Plus Jakarta Sans sized at `0.6x` of the numeric value, aligned to the cap height of the Barlow Condensed numeral with a thin space separator (`&thinsp;`).

## Layout & Spacing

### Layout Model & Grid System
The layout is organized around an 8px base rhythm with a 4px half-step for micro-elements:
- **Mobile (<768px)**: 4 columns, 16px outer margins (`margin-mobile`), 16px gutters (`gutter-mobile`). Left spine lane occupies a fixed 40px width.
- **Tablet (768px - 1119px)**: 8 columns, 24px margins, 24px gutters. Left spine lane expands to 64px width.
- **Desktop (≥1120px)**: 12 columns, 24px gutters, 1200px max container width. Left spine lane maintains 64px width.

### Fixed Dimensions & Targets
- Minimum touch target: 48px × 48px across all interactive targets.
- Primary navigation bars: 64px height.
- Form inputs and standard CTA buttons: 52px height.
- Side sheets (Admin/Checkout): 480px fixed width on desktop; 100% width slide-over on mobile.
- Separation between major sections must use vertical whitespace (64px–96px) rather than arbitrary rule dividers.

## Elevation & Depth

### Tactile Paper Layering
Visual hierarchy is communicated through structural paper edges rather than drop shadows or atmospheric blur:
- **Flat Ground**: Background elements sit directly on the neutral ground (`#EDF0EE`) with zero elevation.
- **Paper Surface Elevation**: Raised surfaces (Trip Cards, modal tickets, receipts, input fields) achieve tactile separation through an explicit border configuration:
  - 1px continuous outline in `paper-edge` (`#CDD4D0`).
  - 2px reinforced bottom lip in `paper-edge` (`#CDD4D0`) to simulate the cast edge of card stock.
  - Night theme replaces these with `night-edge` (`#2B357A`).
- **Modal Scrim**: Modals and side sheets sit above the canvas separated by a solid tinted ink scrim: `rgba(24, 33, 90, 0.48)`.
- **Floating Overlays (Menus / Popovers Only)**: Subtle elevation reserved strictly for dynamic overlays: `0 8px 24px rgba(24, 33, 90, 0.18)`.
- **Prohibitions**: Ambient drop shadows on cards, glassmorphic blurs, and radial skeuomorphic gradients are forbidden.

## Shapes

### Corner Radii Definitions
The design system operates with disciplined, industrial geometry:
- **0px (`none`)**: Data table cells, unclipped edge containers.
- **2px (`segment`)**: Meter indicators, usage bar ticks.
- **4px (`paper`)**: Trip cards, receipt plates, QR containers, station code plates.
- **6px (`field`)**: Text input fields, select dropdowns, monospace machine-code plates.
- **10px (`button`)**: Action buttons, bulk action dock, toast containers.
- **20px (`sheet`)**: Mobile slide-up sheet top corners.
- **999px (`pill`)**: Product line bullet emblems, station dot beads, chips, status tags.

### Borders & Linework
- **Transit Spine Rail**: 6px continuous stroke with rounded caps. Dashed variant for future/unconfirmed paths (12px dash, 8px gap).
- **Secondary Route Connectors**: 4px or 3px stroke.
- **Input Boundaries**: 1.5px solid stroke in `outline` (`#6B7570`).
- **Secondary Button**: 2px solid stroke in `primary` (`#18215A`).
- **Perforations**: 1px dashed line in `paper-edge` (`#CDD4D0`) anchored with 10px circular punch-outs on both lateral edges.

## Components

### Buttons
- **Primary CTA**: Height 52px, corner radius 10px (`button`). Background `#18215A`, text `#EDF0EE` (label-lg). Hover state shifts to `#2B3A8C`; pressed state to `#0E1440`.
- **Secondary Button**: Height 52px, corner radius 10px (`button`). Background `#EDF0EE`, border 2px solid `#18215A`, text `#18215A`.
- **Tertiary Action**: Height 44px, no border, text `#18215A` underline on hover.
- **Disabled State**: Background `#E1E6E3`, border none, text `#6B7570`.

### Form Fields & Inputs
- **Base Input**: Height 52px, radius 6px (`field`). Background `#FFFFFF`, border 1.5px solid `#6B7570`, text `#18215A` (body-md).
- **Focus State**: Border 2px solid `#18215A` with an external focus outline offset by 3px.
- **Error State**: Border 2px solid `#A8231B`, accompanied by error message in `#A8231B` (label-md).

### Station Spine & Station Beads
- **Spine Rail**: Vertical 6px track in `#18215A` running down the left boundary.
- **Standard Station**: 20px diameter circular bead, fill `#FFFFFF`, border 4px solid `#18215A`.
- **Active Station**: 24px diameter solid `#18215A` bead with an outer 4px ring in `#EDF0EE`.
- **Transfer / Interchange Station**: 28px double concentric ring in `#18215A`.

### Product Bullets
- Circular badges (diameter: 28px in tables/spine, 56px in headers, 20px inline).
- Filled with designated product line color (`line-wifi`, `line-esim`, `line-sim`, `line-pro`).
- Contains a centered, bold Barlow Condensed uppercase glyph (`W`, `E`, `S`, `P`) in contrasting `#FFFFFF` or `#EDF0EE`.

### Trip Cards & Receipts
- **Trip Card**: Tactile paper container with 4px border radius. Perimeter 1px outline with 2px lower lip in `#CDD4D0`. Header displays destination airport code (Barlow Condensed display-lg) paired with departure and connection status.
- **Receipt Perforation**: Divider line dashed in `#CDD4D0` terminated at left and right card edges with 10px semi-circular inward cutouts.

### Chips & Status Badges
- **Shape**: Pill-shaped (`rounded-full`), height 28px, horizontal padding 12px.
- **Success (Active / Connected)**: Background `#D7EBDF`, text and icon `#176B40`.
- **Warning (Low Balance / Test Mode)**: Background `#F7E8C2`, text and icon `#7A4F00`.
- **Danger (Overdue / Disconnected)**: Background `#F6D9D6`, text and icon `#A8231B`.

### Data Meters & Signal Glyphs
- **Signal Bar Indicator**: 4 vertical bars (4px width, 2px gap, 2px radius) scaling at 25%, 50%, 75%, 100% height. Lit segments use the product line stroke tone; unlit segments use `#E1E6E3`.
- **Usage Meter**: Segmented progress bar. Each active segment uses the dedicated product accent stroke; inactive segments sit on `#E1E6E3`.