# Page Override: Trip Planner & Break-Even Calculator

- **Target Route:** `/[locale]/planner`
- **Component Base:** `packages/ui/src/components/BreakEvenSchematicCard.tsx`, `apps/web/src/components/PlannerWizard.tsx`
- **Line Identity:** Wayfinding Blue (`#0284C7`), Pocket WiFi Orange (`#F27B2A`), eSIM Cyan (`#4C97FF`)

---

## 1. Page-Specific Rules & Semantics

1. **Break-Even Analysis Schematics:**
   - Display the cost curve between 1 Pocket WiFi rental router vs multiple eSIM profiles for group trips.
   - Use tabular figures (`tnum`) for all cost breakdowns per person per day.
2. **Unified Trip Food Budget Integration:**
   - Merge estimated dining cash needs into the connectivity planner card:
     - Connectivity Rental Cost (IDR) + Estimated Dining Cash Spend (IDR) = Total Trip Cash in IDR.
     - Calculations are based on traveler count, trip duration in days, and destination country price index.
3. **Tactile Ticket Architecture:**
   - Use the perforated receipt chit design (`border border-paper-edge border-b-2`) with card-stock tactile ground.
   - Prohibit drop shadows, backdrop blurs, or gradients.
