# Written Decision Record: Repository UI Audit and Baseline (P00)

**Project:** JavaMifi Compass  
**Stream:** 01 Ui Ux  
**Phase:** P00 — Repository UI audit and baseline  
**Status:** Approved / Measured Baseline Established  
**Date:** 2026-10-27  
**Governing Documents:** `GEMINI.md`, `docs/DESIGN.md`, `design-system/MASTER.md`, `.gstack/qa-reports/qa-report-javamifi-compass-2026-10-27.md`

---

## 1. Context & Architectural Problem

JavaMifi Compass unites cross-border connectivity planning (Pocket WiFi, eSIM, physical SIM), order fulfillment, Traveler Trip Hub, destination readiness, and "Compass Rasa" halal dining discovery into a transit-wayfinding interface.

Before implementing new visual styling or modifying interface behavior, this Phase P00 establishes an empirical, measured baseline across all rendered components, routes, interactive states, responsive viewports, design tokens, accessibility constraints, and client performance budgets.

---

## 2. 3D Intentional Gating Policy

> **MANDATORY POLICY RULE:**  
> **3D is intentionally gated:** Only add a 3D scene when it helps users understand spatial orientation, product choice, or journey progress. Keep a static, semantic fallback; **never** add a 3D runtime to checkout, FAQ, or admin tables merely to make the interface look expensive.

### Audit Evidence:
- **Home Route (`/[locale]`):** 0 `<canvas>` elements. High-density, high-conversion Public Transit Wayfinding with zero wheel hijacking.
- **Planner Route (`/[locale]/planner`):** 0 `<canvas>` elements. Deterministic wizard with tabular figure computation.
- **Checkout Route (`/[locale]/checkout`):** 0 `<canvas>` elements. Secure paper chit with tokenized payment relays.
- **Trip Hub Route (`/[locale]/trip-hub`):** 0 `<canvas>` elements. Transit boarding pass with customs stamp.
- **Admin CMS (`http://localhost:3002`):** 0 `<canvas>` elements. Clean operational data tables.
- **Design System Lab (`/[locale]/design-system/lab`):** Isolated 3D showcase (`OctilinearTicketTunnel.tsx`) demonstrating octilinear rail navigation using native `useScroll` with zero wheel hijacking, standard design tokens, and graceful `@media (prefers-reduced-motion: reduce)` fallbacks.

---

## 3. Current-Route Map & Delivery Mode

| Route Path | Type | First Load JS | User Problem Solved & Primary Component |
| :--- | :---: | :---: | :--- |
| `/[locale]` | SSG | 124 kB | Entry flight-board hero, destination transit cards, live connectivity presets, trust receipt chit (`DepartureBoardHero`, `TripBoardingPass`, `PerforatedReceiptChit`). |
| `/[locale]/planner` | SSG | 287 kB | 3-step connectivity recommender (Country & Dates & Data Tier) with deterministic break-even calculations (`PlannerWizard`, `BreakEvenSchematicCard`). |
| `/[locale]/destinations` | SSG | 101 kB | Country directory covering 20 destinations with dual English/Indonesian alias resolution (`DestinationReadinessCard`). |
| `/[locale]/destinations/[slug]` | Dynamic | 96.2 kB | Destination readiness portal (eSIM compatibility, visa/plug guide, network carriers, Compass Rasa entry point). |
| `/[locale]/destinations/[slug]/eat` | Dynamic | 291 kB | Destination-scoped halal culinary discovery with filterable dietary badges and Japanese/Arabic/Chinese phrases (`DiningDiscovery`). |
| `/[locale]/dining` | SSG | 291 kB | Global Compass Rasa directory with tier filter (`CERTIFIED`, `CLAIMED`, `OPTIONS`, `NOT_HALAL`, `UNKNOWN`) and robot assistant. |
| `/[locale]/products` | SSG | 98.1 kB | Connectivity product catalog (Pocket WiFi, eSIM, SIM) with strict line color semantics. |
| `/[locale]/cart` | SSG | 96.2 kB | Traveler cart with minor-unit IDR tally and order breakdown. |
| `/[locale]/checkout` | SSG | 269 kB | Order confirmation with contact details, delivery address, and payment method selection. |
| `/[locale]/checkout/mock-payment` | SSG | 267 kB | Local development payment simulation relay using opaque token references (`MockPaymentSimulator`). |
| `/[locale]/payment/callback` | SSG | 98.9 kB | Post-payment settlement callback with transactional status verification. |
| `/[locale]/trip-hub` | SSG | 89.7 kB | Lookup portal for active trip boarding passes by Order Number. |
| `/[locale]/trip-hub/[orderNumber]` | Dynamic | 278 kB | Digital Boarding Pass with customs stamp, eSIM QR/activation code, WiFi return slip, and itinerary (`TripHubView`). |
| `/[locale]/account` | SSG | 101 kB | Traveler order history and authentication portal. |
| `/[locale]/login` | SSG | 92.5 kB | Traveler authentication with OTP / email login. |
| `/[locale]/support` | SSG | 107 kB | Emergency connectivity troubleshooting, FAQ access, WhatsApp concierge. |
| `/[locale]/faq` | SSG | 96.2 kB | Searchable knowledge base for device pickup, return, APN setup, Fair Usage Policy. |
| `/[locale]/design-system` | SSG | 268 kB | Interactive styleguide presenting tokens, buttons, cards, chits, and customs stamps. |
| `/[locale]/design-system/lab` | SSG | 341 kB | Gated experimental laboratory featuring the isolated octilinear tunnel. |

**Shared First Load JS Bundle:** 87.3 kB (within the $\le 100\text{ kB}$ house performance budget).

---

## 4. Component Inventory & Design Token Audit

### A. Shared Primitives (`packages/ui/src/primitives`)
1. **`Button` (`packages/ui/src/primitives/Button.tsx`):**
   - *Target Size:* Enforces `min-h-12 min-w-12` ($\ge 48\text{px} \times 48\text{px}$) with `focus-visible:ring-2 focus-visible:ring-primary`.
   - *Variants:* Primary (`bg-primary-container text-on-primary hover:bg-primary-hover active:bg-primary-pressed`), Secondary (`border border-paper-edge hover:bg-ground-base`), Danger (`bg-danger text-on-error`), Transit Lines (`bg-line-wifi`, `bg-line-esim`, `bg-line-sim`, `bg-success`).
   - *Typography:* Plus Jakarta Sans, uppercase tracking-wide, bold, tabular numerals.
2. **`Card` (`packages/ui/src/primitives/Card.tsx`):**
   - *Elevation:* Physical tactile paper elevation (`border border-paper-edge border-b-2`).
   - *Forbidden Pattern Guard:* Strictly zero `shadow-*` utility classes. Zero `backdrop-blur-*`.
   - *Ground:* `bg-ground-paper` on `bg-ground-base`.
3. **`RouteLine` (`packages/ui/src/primitives/RouteLine.tsx`):**
   - *Visual Rail:* Transit line connector with station nodes.
   - *Color Tokens:* `line-wifi` (`#F27B2A`), `line-esim` (`#4C97FF`), `line-sim` (`#E96BB0`), `line-pro` (`#18215A`).
4. **`SignalBadge` & `SignalMeter` (`packages/ui/src/primitives/SignalBadge.tsx`, `SignalMeter.tsx`):**
   - *Semantics:* Carrier signal strength indicators (Excellent, Good, Fair, Searching) with tabular frequency display.

### B. Wayfinding Primitives (`packages/ui/src/wayfinding`)
1. **`TripBoardingPass` (`packages/ui/src/wayfinding/TripBoardingPass.tsx`):**
   - *Transit Aesthetic:* Flight/Train style boarding pass with 10px circular punch-out notches and dashed tear-off line.
   - *Data Trust:* Explicit carrier name, APN settings, IMEI/ICCID machine strings in JetBrains Mono.
2. **`PerforatedReceiptChit` (`packages/ui/src/wayfinding/PerforatedReceiptChit.tsx`):**
   - *Tactile Paper:* Receipt voucher with zigzag/perforated lower border, minor-unit IDR tally, and tabular alignment.
3. **`BreakEvenSchematicCard` (`packages/ui/src/wayfinding/BreakEvenSchematicCard.tsx`):**
   - *Comparison:* Dual WiFi vs eSIM cost crossover diagram based on traveler count and duration.
4. **`SandboxGatewaySimulator` (`packages/ui/src/wayfinding/SandboxGatewaySimulator.tsx`):**
   - *Simulation:* Mock payment card with QRIS and card simulator modes.

### C. Compass Rasa Dining Primitives (`packages/ui/src/dining`)
1. **`HalalBadge` (`packages/ui/src/dining/HalalBadge.tsx`):**
   - *Tier Governance:* Fail-closed tier rendering (`CERTIFIED`, `CLAIMED`, `OPTIONS`, `NOT_HALAL`, `UNKNOWN`).
   - *Color Tokens:* Emerald Jade `#059669` and verified certification certificates.
2. **`HalalCustomsStamp` (`packages/ui/src/dining/HalalCustomsStamp.tsx`):**
   - *Customs Stamp:* Distressed double-border stamp with official inspection code and deterministic tier stamp.
3. **`DualPrice` (`packages/ui/src/dining/DualPrice.tsx`):**
   - *Deterministic Pricing:* Displays local foreign currency (e.g. `¥1,200`) alongside deterministic IDR equivalent (`≈ Rp 126.000`) formatted in tabular figures (`tnum`).
4. **`DietaryPhraseCard` & `TaxiAddressCard` (`packages/ui/src/dining/DietaryPhraseCard.tsx`, `TaxiAddressCard.tsx`):**
   - *Traveler Utilities:* Local script (Kanji/Kana, Arabic, Simplified Chinese) for showing waitstaff or taxi drivers.

---

## 5. Viewport & Responsive Baseline (320px to 1440px)

Empirical testing conducted via Playwright on headless Chromium:

| Viewport Width | Device Persona | ScrollWidth | ClientWidth | Horizontal Overflow | Result |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **320px** | iPhone SE (Compact) | 320px | 320px | None (`overflow=False`) | PASS |
| **360px** | Android Compact | 360px | 360px | None (`overflow=False`) | PASS |
| **390px** | iPhone 14/15 Mobile | 390px | 390px | None (`overflow=False`) | PASS |
| **768px** | iPad / Tablet Portrait | 768px | 768px | None (`overflow=False`) | PASS |
| **1024px** | iPad Pro / Small Laptop | 1024px | 1024px | None (`overflow=False`) | PASS |
| **1440px** | Desktop Display | 1440px | 1440px | None (`overflow=False`) | PASS |

---

## 6. Accessibility & Touch Target Audit Matrix

| Component / Interactive Control | Observed Geometry | House Standard ($\ge 48\text{px} \times 48\text{px}$) | WCAG 2.2 Target Size | Focus Outline Visible |
| :--- | :---: | :---: | :---: | :---: |
| **Navbar Brand Link** | $177\text{px} \times 48\text{px}$ | PASS | PASS (Level AAA) | Yes (`focus-visible:ring-2`) |
| **Navbar Route Links (Planner, Destinations, Dining, etc.)** | $\ge 56\text{px} \times 64\text{px}$ | PASS | PASS (Level AAA) | Yes (`focus-visible:ring-2`) |
| **Navbar Cart Icon Link** | $48\text{px} \times 48\text{px}$ | PASS | PASS (Level AAA) | Yes (`focus-visible:ring-2`) |
| **Navbar Account Icon Link** | $48\text{px} \times 48\text{px}$ | PASS | PASS (Level AAA) | Yes (`focus-visible:ring-2`) |
| **Navbar Theme Toggle Button** | $48\text{px} \times 48\text{px}$ | PASS | PASS (Level AAA) | Yes (`focus-visible:ring-2`) |
| **Navbar Locale Switcher Buttons (ID / EN)** | $48\text{px} \times 48\text{px}$ | PASS | PASS (Level AAA) | Yes (`focus-visible:ring-2`) |
| **Navbar Planner CTA Button** | $153\text{px} \times 48\text{px}$ | PASS | PASS (Level AAA) | Yes (`focus-visible:ring-2`) |
| **Hero Booking CTA Button** | $220\text{px} \times 48\text{px}$ | PASS | PASS (Level AAA) | Yes (`focus-visible:ring-2`) |
| **Destination Cards (Transit Cards)** | $380\text{px} \times 240\text{px}$ | PASS | PASS (Level AAA) | Yes (`focus-visible:ring-2`) |
| **Dining Filter Chips** | $\ge 84\text{px} \times 48\text{px}$ | PASS | PASS (Level AAA) | Yes (`focus-visible:ring-2`) |

---

## 7. Existing Interaction States Baseline

- **Idle:** Paper surface on canvas ground, tactile paper edge border lip (`border-b-2 border-paper-edge`).
- **Hover:** Mechanical 4px lift (`-translate-y-1` or `hover:bg-primary-hover`), duration-150 ease-out curve.
- **Focus:** Visible high-contrast focus ring (`focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`).
- **Pressed:** Mechanical press (`translate-y-0.5 active:bg-primary-pressed`).
- **Loading:** Signal loader (`SignalLoader`) pulsing between transit line states; zero layout jump.
- **Empty:** Transit station "Jalur Belum Beroperasi / Route Not in Service" fallback chit with explicit action button.
- **Failure:** Red alert voucher with error code in JetBrains Mono and retry button.
- **Reduced Motion:** Global `@media (prefers-reduced-motion: reduce)` rule cancels all transitions, transforms, and animations instantly.

---

## 8. Internationalization (i18n) & Typography Tokens

- **Supported Locales:** `id` (Indonesian - Default), `en` (English).
- **Message Catalogs:** Synchronized bilingual keys across `apps/web/messages/id.json` and `apps/web/messages/en.json`.
- **Numerics:** Tabular figures (`tnum` / `font-feature-settings: "tnum" 1`) applied across all currencies, rates, and timestamps.
- **Currency:** Minor-unit arithmetic strictly calculated server-side; UI only displays formatted strings (e.g., `Rp 149.000` or `$9.99`).

---

## 9. Rollback & Disable Procedures

1. **Gated Features:**
   - 3D Lab Tunnel: Feature-flagged to `/[locale]/design-system/lab`; can be disabled via routing configuration without impacting production checkout or planner flows.
   - Mock Payment Simulator: Strictly gated to development; throws `BadRequestException` fail-closed in production.
2. **Version Control Rollback:**
   - Git commit tag `ui-baseline-p00-v1` captures the clean baseline state.
   - Fast rollback command: `git revert <commit-sha>` cleanly rolls back UI adjustments while preserving server outbox and persistence integrity.
