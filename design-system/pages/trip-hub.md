# Page Override: Traveler Trip Hub

- **Target Route:** `/[locale]/trip-hub/[orderNumber]`
- **Component Base:** `apps/web/src/components/TripHubView.tsx`
- **Line Identity:** Transit Wayfinding Nila Indigo (`#18215A`), Emerald Jade (`#059669`)

---

## 1. Page-Specific Rules & Semantics

1. **Zero-Click Destination Context:**
   - Pre-populate and embed the destination's certified halal dining waypoints directly into the active trip hub without requiring navigation away from the boarding pass.
2. **Device Return Logistics & Counter Proximity:**
   - Highlight certified halal dining spots located within 500m of the airport / downtown return booth (e.g., Shibuya counter drop-off, Haneda T3 counter, Narita T1/T2 counters).
3. **Roaming Data Footprint Awareness:**
   - Display estimated data consumption (`~1.8 MB`) alongside dining search queries to preserve traveler quota.
4. **Boarding Pass & Logistics Timeline:**
   - Physical ticket styling with tear stubs, barcode/QR block, and real-time activation status.
