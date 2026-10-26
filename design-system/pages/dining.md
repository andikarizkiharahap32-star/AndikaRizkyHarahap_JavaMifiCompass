# Page Override: Dining & Halal Discovery (Compass Rasa)

- **Target Route:** `/[locale]/dining`
- **Component Base:** `apps/web/src/components/DiningDiscovery.tsx`
- **Line Identity:** Transit Line Dining (Emerald Jade `#059669`)

---

## 1. Page-Specific Rules & Semantics

1. **Halal Customs Stamp Verification Slip:**
   - Instead of a generic web badge, venues must offer a physical "Halal Customs Stamp" verification slip (`HalalCustomsStamp.tsx`) showing:
     - Inspection seal header (`REPUBLIK JAVAMIFI • VERIFIED ENTRY`)
     - Status Tier (`CERTIFIED`, `CLAIMED`, `OPTIONS`, `NOT_HALAL`, `UNKNOWN`)
     - Certifier name, cert registration number, expiry date
     - Orthogonal flags: `COMMUNITY_TAGGED`, `CONFLICTING_EVIDENCE`, `PORK_FREE_COOKWARE`
     - Perforated chit edge with notch tear-lines.
2. **Fail-Closed Filter Guard:**
   - When filter is set to `Halal Only`, API results containing `UNKNOWN` or `CONFLICTING_EVIDENCE` must never be rendered.
3. **Alcohol Status Transparency:**
   - Japanese washoku/yakiniku venues must strictly display:
     - `Bebas Alkohol` ONLY when explicitly certified/proven (`CERTIFIED_FREE`).
     - `Alkohol: Tidak Disebut` when not verified (due to mirin/cooking sake risk).
4. **Data-Aware Roaming Concierge:**
   - Display roaming footprint estimate (e.g., `Data Footprint: ~1.8 MB`) on searches and image loads to prevent unexpected data drain for travelers on 1GB–3GB eSIM/pocket WiFi roaming packages.
5. **Dual Currency Tabular Display:**
   - Always display local currency + estimated IDR using daily bank rate (`tnum`).
   - If no fresh daily FX rate exists, show `Kurs belum tersedia` instead of calculating a fake rate.
6. **Airport Booth Proximity:**
   - Venues within 500m of the JavaMifi pickup/return counter (e.g., Narita, Haneda, Changi, Shibuya) must show a direct booth transit badge with walking distance.
