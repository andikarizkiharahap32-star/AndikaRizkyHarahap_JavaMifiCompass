# Design System Master File — JavaMifi Compass

> **LOGIC:** When building or modifying a specific page, first check `design-system/pages/[page-name].md`. If that file exists, its rules override this Master file. If not, strictly follow the rules below.

- **Project:** JavaMifi Compass
- **Category:** Global Connectivity & Travel Wayfinding
- **Design Dials:** Variance 3/10 (Centered / Minimal) | Motion 3/10 (Subtle) | Density 7/10 (Standard)
- **Governing Standard:** `docs/DESIGN.md` and `GEMINI.md`

---

## 1. Global Governance & Hard Rules

1. **No Arbitrary Literals:** Never use hex colors, px/rem literals, or arbitrary Tailwind values (`[...]`) in components. Use defined design tokens only.
2. **Forbidden Patterns:**
   - Drop shadows on cards (`shadow-*`) are strictly forbidden. Use tactile paper edge lips (`border-b-2 border-paper-edge`).
   - Backdrop-blur (`backdrop-blur-*`) and glassmorphic blurs are strictly forbidden.
   - Ambient, radial, or neon gradients are forbidden.
   - Emoji as interface icons are forbidden. Use Lucide SVG icons or explicit text glyphs.
   - Purple/neon accents, stock-photo placeholders, and lorem ipsum are forbidden.
3. **Strict Color Semantics:**
   - Product-line colors (`#F27B2A` WiFi orange, `#4C97FF` eSIM blue, `#E96BB0` SIM pink) are reserved exclusively for connectivity products.
   - **Never** use connectivity colors for food, dining, or halal status.
   - Dining / Compass Rasa is exclusively assigned Transit Line Jade (`#059669`, stroke `#047857`, surface `#D1FAE5`).
4. **Touch Targets & Type Constraints:**
   - Minimum interactive touch target is 48px × 48px across all mobile and desktop controls.
   - Minimum body text is 14px (`body-sm`), minimum label is 12px (`label-sm`).
5. **Tabular Numerics:** Force tabular figures (`tnum` / `font-feature-settings: "tnum" 1`) on all numbers, currencies, dates, and metric values.
6. **Fail-Closed Halal Tiers:** Deterministic code assigns tiers (`CERTIFIED`, `CLAIMED`, `OPTIONS`, `NOT_HALAL`, `UNKNOWN`). `UNKNOWN` and conflicting evidence never appear under the Halal filter.
7. **AI Text Safety:** Render AI/scraped text as plain text only. Never use `dangerouslySetInnerHTML` or markdown rendering for untrusted evidence.
8. **Deterministic Calculation:** Never compute currency conversion, halal tier status, or price sanity in UI code. The UI only displays deterministic fields provided by the API.

---

## 2. Color Palette & Token Architecture

| Semantic Role | Token Name | Value | Description |
| :--- | :--- | :--- | :--- |
| **Canvas Ground** | `ground.base` | `#EDF0EE` | Cool tactile architectural paper ground. Never pure white background. |
| **Paper Surface** | `ground.paper` | `#FFFFFF` | Card stock representation for bounded cards, tickets, and chits. |
| **Paper Edge** | `paper-edge` | `#CDD4D0` | 1px border with 2px lower lip simulating tactile card stock. |
| **Sunken Surface** | `sunken` | `#E1E6E3` | Recessed utility beds, meter tracks, code blocks. |
| **Primary Ink** | `primary` / `nilaLight` | `#18215A` | Deep Nila Indigo: headers, body copy, route rails. |
| **Secondary Ink** | `secondary` | `#454E7A` | Captions, timestamps, secondary metadata. |
| **Line — WiFi** | `transitLine.wifi` | `#F27B2A` | Pocket WiFi rental hardware line. |
| **Line — eSIM** | `transitLine.esim` | `#4C97FF` | Digital eSIM line. |
| **Line — SIM** | `transitLine.sim` | `#E96BB0` | Physical SIM card line. |
| **Line — PRO** | `transitLine.pro` | `#18215A` | Corporate / VIP priority line. |
| **Line — Dining** | `transitLine.dining` | `#059669` | Compass Rasa / Halal dining wayfinding line. |
| **Line — Dining Stroke** | `transitLine.diningStroke` | `#047857` | Dining border & active stroke. |
| **Line — Dining Surface**| `transitLine.diningSurface`| `#D1FAE5` | Dining badge & container surface. |

### Halal Tier Token Scale (Fail-Closed)
- **`CERTIFIED`:** Fill `#D1FAE5`, Text `#047857`, Border `#10B981` (Verified by recognized certifier).
- **`CLAIMED`:** Fill `#E0F2FE`, Text `#0284C7`, Border `#38BDF8` (Self-declared by owner, uncertified).
- **`OPTIONS`:** Fill `#FEF3C7`, Text `#B45309`, Border `#F59E0B` (Halal meat options available, shared kitchen).
- **`NOT_HALAL`:** Fill `#FEE2E2`, Text `#B91C1C`, Border `#EF4444` (Serves pork/non-halal items).
- **`UNKNOWN`:** Fill `#E1E6E3`, Text `#6B7570`, Border `#CBD5E1` (Unverified / conflicting / fails closed).

---

## 3. Typography Scale & Hierarchy

- **Display & Transit Signage:** `Barlow Condensed` (tight letter spacing, condensed width for rapid flight-board and transit scanning).
- **Interface & Running Body:** `Plus Jakarta Sans` (high-legibility geometric sans-serif for forms, tickets, buttons).
- **Machine Strings:** `JetBrains Mono` / monospace (ICCID, order numbers, tokens, lat/long, hashes).
- **Tabular Figures:** Applied universally via `tnum` font features on numeric data.

---

## 4. Spacing, Geometry & Density (7/10)

- **Base Rhythm:** 8px rhythm with 4px micro half-step.
- **Corner Radii:**
  - `0px`: Table cells, flush boundaries.
  - `4px`: Trip cards, boarding passes, receipt plates, station code plates.
  - `6px`: Text inputs, selects, monospace plates.
  - `10px`: Interactive buttons, bulk action docks.
  - `999px`: Bullet emblems, status badges, chips.
- **Physical Elevation:**
  - Standard card elevation: `border border-paper-edge border-b-2`.
  - Ticket notch: 10px circular punch-outs with dashed perforation line.
  - Customs stamp: 2px distressed border, official stamp seal, tabular audit code.

---

## 5. Motion (3/10 Subtle)

- Smooth mechanical transitions only: `duration-150` to `duration-200` with ease-out curves.
- Zero bouncing, zero looping animations (except micro pulse on live status indicator).
- Modal entries: clean opacity fade + 4px upward translation.

---

## 6. Page-Specific Override Resolution

Before modifying or implementing any page:
1. Look for `design-system/pages/[page-name].md`.
2. Apply the page-specific layout, component selection, and metric integrations.
3. If no page-specific override file exists, follow this `MASTER.md` file unconditionally.
