# Written Decision Record: Premium Brand Direction Without a Rebrand (P01)

**Project:** JavaMifi Compass  
**Stream:** 01 Ui Ux  
**Phase:** P01 — Premium brand direction without a rebrand  
**Status:** Approved / Invariant Contract Established  
**Date:** 2026-10-27  
**Governing Standard:** `GEMINI.md`, `docs/DESIGN.md`, `design-system/MASTER.md`, `design-system/pages/home.md`

---

## 1. Executive Strategy: Premium Transit Wayfinding

Rather than introducing an expensive corporate rebranding or chasing generic consumer-tech fads (glassmorphism, gradient blobs, or sci-fi warp tunnels), JavaMifi Compass achieves a premium feel through:
- **Spatial Restraint:** High whitespace ratio, clear information hierarchy, and calm layout rhythm.
- **Architectural Wayfinding Metaphor:** High-contrast departure flight-boards, linear transit route spines, physical paper tickets, and official customs stamps.
- **Precision Typography:** Swiss Modernism typographic hierarchy combining Barlow Condensed for rapid display scanning, Plus Jakarta Sans for interface clarity, and JetBrains Mono with universal tabular numerics (`tnum`) for machine and price strings.

---

## 2. Transit Line Colorways & Semantic Boundaries

### A. Connectivity Product Lines (Strictly Reserved)
These colors are exclusively assigned to telecommunication hardware and data lines. They must **never** be used for food, dining, or halal verification status:
- **Pocket WiFi Line:** `#F27B2A` (stroke `#C95A0A`) — Rental hardware line.
- **Digital eSIM Line:** `#4C97FF` (stroke `#2468E0`) — Instant digital download line.
- **Physical SIM Line:** `#E96BB0` (stroke `#C23A86`) — Physical SIM card delivery line.
- **JavaMifi PRO Line:** `#18215A` — Priority / enterprise VIP transit corridor.

### B. Compass Rasa Halal Dining Line (Strictly Isolated Jade)
- **Dining Transit Line:** `#059669` (`var(--color-line-dining)` / `line-dining`)
- **Dining Active Stroke:** `#047857` (`var(--color-line-dining-stroke)` / `line-dining-stroke`)
- **Dining Container Surface:** `#D1FAE5` (`var(--color-line-dining-surface)` / `line-dining-surface`)
- *Rationale:* Isolating emerald jade strictly to dining ensures instant cognitive distinction between telecommunication products and dietary waypoints.

---

## 3. Paper & Ink Contrast System

| Material Layer | Token | Value | Purpose |
| :--- | :--- | :--- | :--- |
| **Canvas Ground** | `ground.base` | `#EDF0EE` | Cool tactile paper ground. Eliminates harsh digital glare under bright sunlight. |
| **Paper Stock** | `ground.paper` | `#FFFFFF` | Bounded physical cards, tickets, and boarding passes. |
| **Tactile Edge Lip** | `paper-edge` | `#CDD4D0` | 1px border with 2px lower lip simulating tactile card stock thickness (`border-b-2`). |
| **Sunken Utility Bed** | `sunken` | `#E1E6E3` | Recessed meter tracks, machine code blocks, code chips. |
| **Primary Ink** | `primary` | `#18215A` | Deep Nila Indigo: authoritative structural ink for body copy, titles, route rails. |
| **Secondary Ink** | `secondary` | `#454E7A` | Slate Indigo: timestamps, itinerary metadata, secondary captions. |

---

## 4. Tactile Shape Language & Geometry

- **0px Corner Radius:** Table cells, flush containers, data grids.
- **4px Corner Radius:** Wayfinding cards, tickets, boarding passes, station code plates (`rounded`).
- **6px Corner Radius:** Text inputs, selects, monospace machine plates (`rounded-md`).
- **10px Corner Radius:** Interactive buttons, bulk action docks (`rounded-lg`).
- **999px Corner Radius:** Bullet emblems, status badges, chips (`rounded-full`).
- **Ticket Punch-Outs:** 10px circular punch-outs with dashed perforation lines (`TripBoardingPass`).
- **Customs Stamp:** Distressed 2px double border with official inspection code (`HalalCustomsStamp`).

---

## 5. Anti-Pattern Catalogue & Gated Elements

1. **Forbidden Drop Shadows (`shadow-*`):**
   - Floating drop shadows are completely prohibited on cards.
   - Physical tactile elevation is achieved solely through crisp borders and the 2px paper edge lower lip (`border border-paper-edge border-b-2`).
2. **Forbidden Backdrop Blur (`backdrop-blur-*`):**
   - Glassmorphic blurs are prohibited due to legibility failure in outdoor travel environments.
3. **Forbidden Gradients:**
   - Radial, ambient, or neon gradients are prohibited.
4. **Forbidden Emojis as Icons:**
   - Emojis (e.g. 🍜, 📍, 📞) are strictly prohibited as interface icons. All icons must be scalable Lucide SVG icons.
5. **3D Intentional Gating:**
   - 3D runtimes are strictly gated to spatial comprehension tasks and isolated exclusively to `/[locale]/design-system/lab`.
   - Core transactional routes (Home, Planner, Checkout, Dining, FAQ, Admin) use high-performance semantic DOM with zero 3D overhead.

---

## 6. Rollback & Verification Procedures

- **Tokens Rollback:** All visual attributes derive from centralized design tokens in `packages/ui/src/styles/tokens.css` and `packages/ui/src/preset.js`. Reverting a token value updates all consuming apps simultaneously without touching component markup.
- **Quality Gate:** Automated Vitest test suite (`packages/shared/tests/brand-direction-p01.test.ts`) verifies token consistency and ensures zero forbidden patterns exist in production components.
