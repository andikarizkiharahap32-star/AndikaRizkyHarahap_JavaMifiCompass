# JavaMifi Compass — Product Requirements Document (PRD)

Version: 1.0.0  
Date: October 26, 2026  
Status: Approved

---

## 1. Executive Summary

JavaMifi Compass transforms a traditional rental-WiFi and eSIM store into a **trip-centric connectivity platform**: travelers plan first, buy second, and manage their entire connection across one unified Trip Hub.

---

## 2. Requirement Matrix & Verification

### Website Requirements (W1–W11)

| ID | Requirement | Priority | Implementation Location | Verification Evidence |
|---|---|---|---|---|
| **W1** | Home page with planner entry, presets and trust section | Must | `apps/web/src/app/[locale]/page.tsx` | Hero, 4 presets, signal badges, trust section |
| **W2** | Destination list and detail pages with Destination Readiness Card, SSR for SEO | Must | `apps/web/src/app/[locale]/destinations/` | Live weather (Open-Meteo), ECB rates (Frankfurter), country facts |
| **W3** | Trip Planner wizard with ranked, explainable recommendation | Must | `apps/web/src/components/PlannerWizard.tsx` | Pure unit-tested engine with break-even analysis |
| **W4** | Product pages for WiFi, eSIM, SIM and PRO, with eSIM compatibility checker | Must | `apps/web/src/app/[locale]/products/` | Product comparison grid & searchable smartphone compatibility |
| **W5** | Cart, promo codes, checkout and payment (sandbox or mock) | Must | `apps/web/src/app/[locale]/checkout/` | Server-side pricing, promo validation, sandbox simulator |
| **W6** | Accounts: sign up, log in, order history; guest checkout with tracking link | Must | `apps/web/src/app/[locale]/login/` | Argon2id auth, JWT rotation, guest token tracking |
| **W7** | Trip Hub: install guide, QR, usage meter, device timeline, top-up | Must | `apps/web/src/components/TripHubView.tsx` | Boarding pass ticket, activation QR, data gauge, timeline |
| **W8** | Blog, guides and FAQ rendered from CMS content | Should | `apps/api/src/modules/content/` | Bilingual block storage, category filtering |
| **W9** | Indonesian and English, mobile first, WCAG AA | Should | `apps/web/messages/` & `apps/web/src/i18n.ts` | next-intl message catalogs, zero hardcoded strings |
| **W10** | Contact and support form that creates a ticket | Should | `apps/web/src/app/[locale]/support/` | Support intake form connected to n8n triage |
| **W11** | Group split calculator inside the planner | Could | `apps/web/src/components/PlannerWizard.tsx` | Per-person equal cost share breakdown |
| **W12** | Compass Rasa: Halal dining explorer, fail-closed trust layer & food budget | Must | `apps/web/src/app/[locale]/destinations/[slug]/eat/` | 5-tier filter, quoted evidence drawer, customs stamp, dual currency & stale rate warning |

### Admin CMS Requirements (C1–C13)

| ID | Requirement | Priority | Implementation Location | Verification Evidence |
|---|---|---|---|---|
| **C1** | Login with role-based access (super admin, editor, ops, finance, support) | Must | `apps/admin/src/screens/LoginScreen.tsx` | Role guards, preset fast-switch buttons |
| **C2** | Pages built from blocks, blog, FAQ, banners, destination guides, SEO fields | Must | `apps/admin/src/screens/ContentEditorScreen.tsx` | Block editor with bilingual fields |
| **C3** | Media library with safe uploads | Must | `apps/api/src/modules/content/` | MIME verification, random hash naming |
| **C4** | Draft, review and publish workflow with scheduling and version history | Must | `apps/admin/src/screens/ContentEditorScreen.tsx` | Status workflow (DRAFT -> IN_REVIEW -> PUBLISHED) |
| **C5** | Catalog: products, plans, price rules, promo codes | Must | `apps/api/src/modules/catalog/` | Unified plans and promo code validation |
| **C6** | Device inventory and logistics statuses | Must | `apps/admin/src/screens/DevicesScreen.tsx` | Serial number tracking, battery health, deposit release |
| **C7** | Orders, payments and refunds | Must | `apps/admin/src/screens/OrdersScreen.tsx` | Dense orders table, payment methods, status history |
| **C8** | Customers and support tickets | Should | `apps/admin/src/screens/SupportTicketsScreen.tsx` | Automated keyword priority triage view |
| **C9** | Automation console: n8n run log, webhook delivery log, manual retry | Must | `apps/admin/src/screens/AutomationConsoleScreen.tsx` | Run logs, dead-letter monitoring, retry button |
| **C10** | Integration switches (mock or live) and system health page | Should | `apps/admin/src/screens/IntegrationsHealthScreen.tsx` | Dynamic toggles for Midtrans & Airalo adapters |
| **C11** | Append-only audit log | Must | `apps/admin/src/screens/AuditLogScreen.tsx` | Immutable audit trail with no update/delete |
| **C12** | Dashboard: sales, devices out, overdue returns, failed payments | Should | `apps/admin/src/screens/DashboardScreen.tsx` | Top KPI cards, revenue metrics, recent orders |
| **C13** | Dining Governance & Moderation Queue: review disputes, audit trail, KPIs | Must | `apps/admin/src/screens/DashboardScreen.tsx` & `apps/api/src/modules/dining/` | Quoted evidence audit, false-halal 0.00%, HMAC outbox events |

---

## 3. Compass Rasa: Halal Dining Trust Architecture

### 3.1 Core Principle: AI Extracts, Deterministic Code Decides
- **No Free-Text Hallucinations:** The LLM (Gemini 1.5 Flash via n8n workflow `09-dining-enrichment.json`) extracts verbatim evidence quotes from verified sources.
- **Fail-Closed Classification:** The NestJS deterministic tier engine (`tier-engine.ts`) assigns tiers (`CERTIFIED`, `CLAIMED`, `OPTIONS`, `NOT_HALAL`, `UNKNOWN`).
- **Contradictory Evidence:** If conflicting claims are detected (e.g. halal claim alongside pork broth mentions), the venue immediately fails closed to `UNKNOWN` with reason `CONFLICTING_EVIDENCE`.
- **Zero False-Halal:** `UNKNOWN` venues never appear under the Halal filter.

### 3.2 Visual Contract & Components
- **Perforated Halal Customs Stamp (`HalalCustomsStamp.tsx`):** Renders official certifier accreditation authority, registration number, expiry date, and alcohol transparency chips.
- **Dual Currency with Stale Rate Warning (`DualPrice.tsx`):** All venue and menu prices display in local currency and Indonesian Rupiah (IDR). If the exchange rate is older than 3 days, a `▲ Kurs >3 hari` warning chip is rendered.
- **Unified Food Budget (`BreakEvenSchematicCard.tsx`):** Integrates connectivity cost and estimated destination meal spend into a transparent total IDR cash budget.

---

## 4. n8n Automation Workflows (10 Total)

1. `01-order-fulfilment.json`: Provisions eSIM, emails Trip Hub QR, and dispatches chat alerts upon `order.paid`.
2. `02-checkout-recovery.json`: 30-minute cart reminders and automated 24-hour expiration releasing reserved stock.
3. `03-device-lifecycle.json`: Return reminders 2 days before due date and deposit refund processing.
4. `04-usage-and-expiry-alerts.json`: Proactive alerts when data consumption reaches 80%.
5. `05-ops-digest.json`: Daily 08:00 WIB operational digest to Slack, Telegram, or Mailpit.
6. `06-content-publish.json`: Newsletter and marketing draft generation upon `article.published`.
7. `07-support-intake.json`: Urgent keyword triage (`darurat`, `no signal`, `airport`) and dining contaminant safety escalation (`pork`, `babi`, `mirin`, `expired`) to `CRITICAL_SAFETY`.
8. `08-error-handler.json`: Captures workflow failures into the dead-letter log.
9. `09-dining-enrichment.json`: Webhook-driven LLM extraction of verbatim halal certificates and menu evidence with signed HMAC verification.
10. `10-dining-concierge-chat.json`: Natural language dietary request parser that converts traveler chat into structured API query parameters with zero free-text claims.
