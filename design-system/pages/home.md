# Page Governance: Home Page (Transit Wayfinding Core)

- **Target Route:** `/[locale]`
- **Component Base:** `apps/web/src/components/DepartureBoardHero.tsx`
- **Core Archetype:** Public Transit Guide (Product 155, UI-UX Pro Max) & Swiss Modernism 2.0 (Style 50)
- **Line Identity:** Transit Wayfinding Primary Indigo (`#18215A`), Pocket WiFi Orange (`#F27B2A`), eSIM Cyan (`#4C97FF`), SIM Pink (`#E96BB0`), Emerald Jade (`#059669`)
- **Motion Dial:** **Motion 3/10 (Subtle)** — strictly aligned with `design-system/MASTER.md`

---

## 1. Brand Identity & Rejection of Sci-Fi Metaphors

1. **Rejection of "Warp Drive / Into the Ether":**
   - 3D warp tunnels, cosmic perspective corridors, radial glow sequences, and camera fly-throughs belong to a sci-fi/gaming brand archetype and fundamentally conflict with the JavaMifi Compass brand.
   - JavaMifi Compass is built upon tactile public transit wayfinding: high-contrast departure schedules, structural route spines, station interchange line bullets, and tactile card-stock paper tickets.
   - Introducing an immersive warp tunnel causes immediate brand dissonance and breaks visual continuity between Home, the Trip Planner (`/planner`), and the Eat screens (`/dining`).

2. **Unified Archetype Across All Screens:**
   - **Home (`/`):** Tactile Departure Board &rarr; Curated Journey Presets &rarr; Trust Waypoint Grid.
   - **Planner (`/planner`):** Step-by-step transit spine, break-even cost analysis chits, group expense split meters.
   - **Eat (`/dining`):** Halal customs stamp verification slips, dietary phrase cards, taxi wayfinding chits.
   - **Trip Hub (`/trip-hub`):** Physical boarding passes, real-time signal meters, return logistics timeline.

3. **Content Semantics & Internationalization (i18n) Mandate:**
   - **Rejection of Abstract Art & Irrelevant Content:** External widgets displaying abstract art titles (e.g., "Chroma I", "Nebula VI", "Prism III", "Cyber VII") communicate zero domain utility about overseas travel or international connectivity. JavaMifi Compass strictly demands domain-concrete visual artifacts: physical Pocket WiFi chits, eSIM QR activation passes, and transit wayfinding routes.
   - **Zero Hard-Coded Copy (Mandatory EN/ID i18n Keys):** Hard-coded English copy (e.g., "Warp Drive Sequence", "Into the Ether", "Engage Fold Drive") violates the core architecture. Every user-visible string must resolve through `messages/en.json` and `messages/id.json`. Any component with embedded English literals breaks Indonesian localization (`/id`) and fails automated quality gates.
   - **Prohibition of Unvetted Stock Placeholders:** All imagery must come from approved, vetted asset domains with strict aspect ratios, accessible alt text, and zero decorative noise.

4. **WCAG AA Accessibility Mandate & Anti-Patterns:**
   - **Prohibition of Scroll-Jacking & Wheel Trapping (`preventDefault`):** Hijacking normal wheel events with `e.preventDefault()` creates severe scroll entrapment (WCAG 2.1.2 No Keyboard Trap & Guideline 2.1). Users must never be trapped inside an artificial animation corridor or forced to scroll through an entire animation sequence before reaching downstream content.
   - **Vestibular Disorder & Nausea Mitigation (WCAG 2.3.3):** The `ui-ux-pro-max` framework explicitly flags scroll-jacking and rapid 3D z-axis parallax as primary triggers for vestibular disorientation and motion sickness.
   - **Rigorous Reduced Motion Compliance:** Merely pausing pointer/mouse parallax while cards still zoom towards the camera fails WCAG 2.3.3 (Animation from Interactions). Under `prefers-reduced-motion: reduce`, all 3D flight and spatial displacement must be completely replaced with static, accessible, and easily readable layouts.
   - **Prohibition of Pseudo-Interactive Elements:** Applying `cursor-pointer` to `<div>` elements without semantic interactive elements (`<button>` or `<a>`), keyboard navigation, `tabIndex`, and visible focus rings violates WCAG 2.1.1 (Keyboard Accessible), WCAG 2.4.7 (Focus Visible), and WCAG 4.1.2 (Name, Role, Value).

5. **Conversion Architecture & Information Hierarchy:**
   - **Above-The-Fold Value Clarity:** The hero must never be an opaque 100vh full-screen animation canvas that obscures the product offerings. Roaming travelers arriving on the site must immediately comprehend what JavaMifi provides within seconds: Pocket WiFi rentals, travel eSIMs, and international SIM cards.
   - **Deterministic Transparent Pricing:** Above-the-fold surfaces must expose upfront daily rates and per-person split pricing in tabular figures (`tnum`). Users must never be left guessing what services cost.
   - **Direct Conversion Pathways (Planner & Catalog):** The Departure Board hero must feature a prominently visible primary CTA labeled "Plan my trip" ("Rencanakan Perjalanan Saya" in ID) routing directly to the Trip Planner (`/planner`) with prepopulated trip parameters (destination, pax, duration) and a secondary CTA to the destination catalog (`/destinations`).

6. **Mobile Hardware Budget & Performance Engineering:**
   - **Low-End Mobile Persona Target:** The core Indonesian traveler demographic books connectivity on mid-to-low-tier mobile hardware (often over throttled airport Wi-Fi or roaming links).
   - **Prohibition of 3D Compositor Thrashing:** Stacking 9 continuous `translate3d` and `rotateZ` layers forces expensive GPU render passes, triggers thermal throttling, causes severe frame stutter (<24fps), and drains traveler battery.
   - **Prohibition of Raw `<img>` Anti-Pattern:** Using raw `<img>` tags bypasses Next.js image optimization (`next/image`), wasting roaming mobile bandwidth by downloading uncompressed, un-resized external assets without responsive breakpoints or WebP/AVIF format negotiation.
   - **Bundle Weight Budget:** Bloating the Home route with heavy animation runtime libraries (`framer-motion` adds ~30-40kB gzipped) violates the lean travel footprint. JavaMifi Compass requires micro-mechanical CSS transitions and lightweight semantic DOM, keeping the Home route First Load JS under 5kB.

7. **Meaningful Destination Photography Policy:**
   - **Real Destination Photos Only Where Meaningful:** Photography is reserved strictly for concrete destination waypoints (Makkah for Umrah, Kyoto Pagoda for Japan, Great Wall for China, Paris architecture for Europe) where visual landmarks carry genuine travel context.
   - **Zero Abstract Art:** Abstract artistic imagery ("Chroma I", "Nebula VI", cosmic fractals, chrome spheres) is permanently prohibited.
   - **Mandatory `next/image` Optimization:** All destination imagery must be served via `next/image` using the preconfigured `images.unsplash.com` domain, standard `aspect-video` ratio, responsive `sizes`, automatic WebP/AVIF format conversion, and accessible `alt` text to eliminate layout shift and preserve roaming bandwidth.

---

## 2. Page-Specific Rules & Tactile Semantics

1. **Linear Transit Flow:**
   - The Home page flows naturally from the Departure Board Hero directly into curated journey presets and trust waypoints.
   - No sticky scroll corridors, no viewport hijacking, and zero long empty scroll tracks.

2. **Tactile Elevation & Forbidden Patterns:**
   - Drop shadows on cards (`shadow-*`) are strictly forbidden.
   - Tactile depth is simulated exclusively via paper edge lips (`border border-paper-edge border-b-2`), circular ticket punch-notches, and dashed perforation lines.
   - Radial glows, neon accents, gradient text, and backdrop blurs remain strictly forbidden.

3. **Motion Governance (3/10 Subtle) & Tactile Depth Kinematics:**
   - **Subtle 4px to 8px Micro-Mechanical Lift:** Tactile ticket and journey preset cards express physical paper depth via a 4px to 8px lift on hover (`motion-safe:hover:-translate-y-1.5` / -6px) combined with micro-fade transitions (`transition-all duration-200 ease-out`).
   - **Prefers-Reduced-Motion Fallback:** Strict accessibility compliance via `motion-reduce:transform-none motion-reduce:transition-none`, completely suppressing translation for users with motion sensitivity.
   - **Zero Scroll Hijacking:** Movement is driven exclusively by native CSS hover and focus states. Wheel events, page scroll, and touch gestures remain 100% natural and unhindered.
   - **Retirement of Experimental Motion Dial Override (3/10 -> 5/10):** The previous experimental `OctilinearTicketTunnel` motion override (raising motion from 3/10 to 5/10 for Controlled Wayfinding Kinematics) was evaluated and retired to preserve the unified transit identity. Motion across the entire Home route remains locked to Master 3/10 (Subtle).

4. **Deterministic i18n & Tabular Numerics:**
   - All user-visible copy resolves through `messages/en.json` and `messages/id.json` under `"home"`, `"hero"`, and `"nav"`.
   - All numeric rates, currencies, dates, and durations strictly enforce tabular figures (`tnum`).
