# JavaMifi Compass — Modular Design System Architecture

**Document Version:** 1.0.0  
**Status:** PROPOSED & READY FOR IMPLEMENTATION  
**Author:** Senior Full-Stack Engineering Team  
**Governing Documents:** [`docs/DESIGN.md`](./DESIGN.md) & [`GEMINI.md`](../GEMINI.md)

---

## 1. Executive Summary & Objective

The JavaMifi Compass design system is currently grounded in **Tactile Wayfinding Minimalism** (combining the UI-UX Pro Max **Public Transit Guide [Product 155]** and **Swiss Modernism 2.0 [Style 50]** archetypes). 

While the design tokens and UI components are functioning and visually cohesive, the code organization in `packages/ui` and consumer apps (`apps/web` and `apps/admin`) currently suffers from architectural coupling:
1. **Flat Component Dump:** 19 components reside in a single flat directory (`packages/ui/src/components/`), mixing core primitives (Buttons, Cards, Badges) with complex domain organisms (RestaurantDetailModal, BreakEvenSchematicCard, HalalCustomsStamp).
2. **Token Dispersion:** Color tokens, typography scales, and CSS variables are split across TypeScript literals (`packages/ui/src/tokens/index.ts`) and CSS custom properties (`packages/ui/src/styles/tokens.css`) without strict synchronization or category-level modular exports.
3. **Tailwind Config Redundancy:** `apps/web/tailwind.config.js` and `apps/admin/tailwind.config.js` duplicate color mappings and custom utility rules rather than inheriting an authoritative shared preset from `@javamifi/ui/preset`.

### Core Goals
- **Domain-Driven Modularity:** Reorganize `packages/ui` into 4 layered tiers: `tokens/`, `primitives/`, `wayfinding/`, and `dining/`.
- **Zero-Breaking Backward Compatibility:** Keep `packages/ui/src/index.ts` as the unified barrel export so existing imports in `apps/web` and `apps/admin` continue working seamlessly without refactoring disruption.
- **Shared Tailwind Preset:** Package design tokens into an importable Tailwind preset (`@javamifi/ui/tailwind-preset`).
- **Strict Compliance with GEMINI.md:** Enforce zero arbitrary literals, zero drop shadows, zero gradients, minimum 48px touch targets, and strict product-line color isolation.

---

## 2. Target Modular Directory Structure

```text
packages/ui/
├── src/
│   ├── tokens/                         # Layer 0: Design Tokens
│   │   ├── colors.ts                   # Raw palette & hex constants
│   │   ├── semantics.ts                # Transit lines, surfaces, ink, states
│   │   ├── typography.ts               # Signage, interface, machine font scales
│   │   ├── spacing.ts                  # 8px base rhythm & dimensions
│   │   ├── halal-tiers.ts              # Fail-closed halal tier tokens
│   │   └── index.ts                    # Consolidated token exports
│   │
│   ├── primitives/                     # Layer 1: Atomic Primitives (Atoms)
│   │   ├── Button.tsx                  # Transit CTA, secondary, ghost
│   │   ├── Card.tsx                    # Base tactile paper card
│   │   ├── SignalBadge.tsx             # Network status pill
│   │   ├── SignalMeter.tsx             # 4-tier signal bar strength meter
│   │   ├── SignalLoader.tsx            # Pulse loading indicator
│   │   ├── RouteLine.tsx               # Transit route line connector
│   │   └── index.ts
│   │
│   ├── wayfinding/                     # Layer 2: Travel Wayfinding (Molecules / Organisms)
│   │   ├── TripBoardingPass.tsx        # Perforated boarding pass ticket
│   │   ├── PerforatedReceiptChit.tsx   # Receipt chit with tear notches
│   │   ├── BreakEvenSchematicCard.tsx  # Cost curve & break-even analysis
│   │   ├── SandboxGatewaySimulator.tsx # Payment sandbox simulator modal
│   │   └── index.ts
│   │
│   ├── dining/                         # Layer 3: Compass Rasa / Halal Dining (Domain Organisms)
│   │   ├── HalalBadge.tsx              # Fail-closed halal tier badge
│   │   ├── HalalCustomsStamp.tsx       # Physical customs inspection seal
│   │   ├── DietaryPhraseCard.tsx       # Local chef dietary communication card
│   │   ├── DualPrice.tsx               # Tabular multi-currency price chit
│   │   ├── TaxiAddressCard.tsx         # Local script address card with copy
│   │   ├── MenuTicketChit.tsx          # Restaurant menu item chit
│   │   ├── RestaurantCard.tsx          # Dining card in discovery grid
│   │   ├── RestaurantDetailModal.tsx   # Detailed evidence & review modal
│   │   ├── DiningLogo.tsx              # Compass Rasa logo emblem
│   │   └── index.ts
│   │
│   ├── styles/
│   │   └── tokens.css                  # CSS Variables matching DESIGN.md
│   │
│   ├── preset.ts                       # Layer 4: Shared Tailwind Preset
│   └── index.ts                        # Master Barrel Export (All tiers)
└── package.json
```

---

## 3. Layered Architecture Specifications

### Layer 0: Atomic Token Architecture (`src/tokens/`)

Tokens are structured into independent, immutable modules:

1. **`semantics.ts`**:
   - Surface Tokens: `surface`, `surfaceDim`, `paper`, `sunken`, `paperEdge`.
   - Structural Ink: `primary` (`#000846`), `secondary` (`#535c89`), `outline` (`#6B7570`).
   - Isolated Product Lines:
     - Pocket WiFi: `#F27B2A` (`line-wifi`), stroke `#C95A0A`
     - Digital eSIM: `#4C97FF` (`line-esim`), stroke `#2468E0`
     - Physical SIM: `#E96BB0` (`line-sim`), stroke `#C23A86`
     - JavaMifi PRO: `#18215A` (`line-pro`)
     - Compass Rasa: `#059669` (`transitLine.dining`), stroke `#047857`
2. **`typography.ts`**:
   - Signage Font: `Barlow Condensed` (`font-display`)
   - Interface Font: `Plus Jakarta Sans` (`font-sans`)
   - Machine Font: `JetBrains Mono` (`font-mono`)
3. **`halal-tiers.ts`**:
   - `CERTIFIED`, `CLAIMED`, `OPTIONS`, `NOT_HALAL`, `UNKNOWN` badge background, text, and border classes.

### Layer 1: Design Primitives (`src/primitives/`)
Pure, unopinionated UI building blocks:
- **`Button`**: Enforces minimum 48px touch targets (`min-h-12`), standard active/focus states, and variant semantics (`primary`, `secondary`, `outline`, `ghost`).
- **`Card`**: Standard tactile paper card with `bg-paper border border-paper-edge border-b-2 rounded`, strictly excluding drop shadows (`shadow-*`).
- **`SignalBadge` / `RouteLine`**: Mechanical transit badges and wayfinding route connectors.

### Layer 2: Travel Wayfinding Organisms (`src/wayfinding/`)
Specialized travel connectivity components:
- **`TripBoardingPass`**: Flight/train boarding pass ticket metaphor with QR code modules, status history timeline, and tear-off stub.
- **`BreakEvenSchematicCard`**: Objective mathematical break-even cost comparison between Pocket WiFi and eSIM.
- **`PerforatedReceiptChit`**: Financial ledger chit with circular punch-outs and perforation dashed border.

### Layer 3: Halal Dining Domain (`src/dining/`)
Modularized components for the Compass Rasa culinary discovery experience:
- **`HalalCustomsStamp`**: Official inspection seal rendering verification status, certifier ID, and expiry date.
- **`DietaryPhraseCard`**: Offline-ready localized phrase card for chef communication.
- **`DualPrice`**: Tabular currency converter showing local FX alongside indicative IDR with disclaimer.
- **`TaxiAddressCard`**: Native language address plate for local taxi drivers.

### Layer 4: Shared Tailwind Preset (`preset.ts`)
Exports a canonical Tailwind configuration object that both Next.js (`apps/web`) and Vite (`apps/admin`) consume:
```typescript
import type { Config } from 'tailwindcss';
import { javamifiTailwindPreset } from '@javamifi/ui/preset';

const config: Config = {
  presets: [javamifiTailwindPreset],
  content: ['./src/**/*.{ts,tsx}'],
  // app-specific overrides only
};
export default config;
```

---

## 4. Implementation Phasing & Step-by-Step Plan

To strictly follow the **GEMINI.md workflow** (max 6 files per commit batch, zero regressions, typecheck/lint/test verification at each step), implementation is split into 3 atomic phases:

### Phase 1: Token Modularization & Primitives Extraction
1. Create `packages/ui/src/tokens/semantics.ts`, `typography.ts`, `spacing.ts`, `halal-tiers.ts`.
2. Update `packages/ui/src/tokens/index.ts` to re-export all modular tokens.
3. Organize primitives in `packages/ui/src/primitives/` (Button, Card, SignalBadge, RouteLine).
4. Run `pnpm typecheck`, `pnpm lint`, and `pnpm test`.
5. Commit Phase 1 (<= 6 files).

### Phase 2: Wayfinding & Dining Domain Component Grouping
1. Group wayfinding components into `packages/ui/src/wayfinding/`.
2. Group dining components into `packages/ui/src/dining/`.
3. Update `packages/ui/src/index.ts` with clean domain-based barrel exports.
4. Run `pnpm typecheck`, `pnpm lint`, and `pnpm test`.
5. Commit Phase 2 (<= 6 files).

### Phase 3: Shared Tailwind Preset & App Integration
1. Implement `packages/ui/src/preset.ts`.
2. Configure `apps/web/tailwind.config.js` and `apps/admin/tailwind.config.js` to inherit the preset.
3. Verify production builds: `pnpm --filter @javamifi/web build` and `pnpm --filter @javamifi/admin build`.
4. Commit Phase 3 (<= 6 files).

---

## 5. Quality Verification Criteria

- [ ] Zero arbitrary literals: no raw hex or arbitrary Tailwind syntax (`[...]`) in any refactored component.
- [ ] Backward compatibility: all existing imports from `@javamifi/ui` remain valid.
- [ ] Minimum interactive touch targets $\ge 48\text{px} \times 48\text{px}$ (`min-h-12`).
- [ ] Monorepo passes `pnpm typecheck` across all 7 packages.
- [ ] Monorepo passes `pnpm lint` across all packages.
- [ ] All 18 automated test suites (116 tests) pass without modification to existing tests.
- [ ] Next.js static production build prerenders all 31 routes without errors.
