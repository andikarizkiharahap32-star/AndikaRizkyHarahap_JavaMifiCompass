# JavaMifi Compass

> **"Plan your connection before you pack."**  
> *#AntiSusahSinyal*

JavaMifi Compass is a unified travel connectivity and halal wayfinding platform that transforms traditional Pocket WiFi and eSIM shopping into a comprehensive trip-centric experience. Travelers plan journeys first, compare connectivity costs with mathematical break-even guarantees, discover 5-tier fail-closed halal culinary venues, and manage active trips via an airport-style digital Trip Hub.

The platform is built as a production-grade monorepo featuring a Next.js public web application, a dense React Vite Admin CMS, a modular NestJS API, PostgreSQL, Redis with BullMQ, and 12 self-hosted n8n automation workflows.

---

## Features

### 🌐 Public Traveler Web App (`apps/web`)
- **Trip Planner Wizard (`/id/planner`):** Deterministic recommendation engine comparing Pocket WiFi vs. eSIM vs. Physical SIM with transparent cost-per-person-per-day, group split breakdown, and device count break-even analysis.
- **Compass Rasa Halal Dining Discovery (`/id/dining`, `/id/destinations/[slug]/eat`):** Curated culinary discovery across 20 international destinations backed by a 5-tier fail-closed trust engine (`CERTIFIED`, `CLAIMED`, `OPTIONS`, `NOT_HALAL`, `UNKNOWN`), verbatim quote audit drawer, official certifier registration stamp (`HalalCustomsStamp`), and dual-currency display with ECB exchange rates and stale-rate indicators (`▲ Kurs >3 hari`).
- **Destination Readiness Telemetry (`/id/destinations`):** Live weather telemetries (Open-Meteo), real-time reference currency exchange vs IDR (Frankfurter), and country travel advisories (e.g., China VPN firewall guidelines).
- **Post-Purchase Trip Hub (`/id/trips/[id]`):** Boarding-pass trip chit, digital eSIM QR activation instructions, logistics timeline with courier tracking, active data usage meter (with 80% threshold alerts), and Shibuya drop-off return guide.
- **eSIM Compatibility Checker:** Searchable smartphone compatibility catalog by brand and model.
- **Cart & Sandbox Checkout (`/id/cart`, `/id/checkout`):** Server-side priced cart with promo codes (`ANTISUSAHSINYAL`, `HEMAT50K`), mock QRIS / credit card settlement simulator, and Midtrans Snap integration mode.
- **Bilingual & Transit Wayfinding Design System:** Full Indonesian and English catalogs (`id.json`, `en.json`) with strict wayfinding design tokens, tabular numerals (`tnum`), and WCAG AA 48px touch targets.

### ⚙️ Executive Admin CMS (`apps/admin`)
- **Executive Operations Dashboard:** Real-time KPI summary tracking active rentals, device return deadlines, dead-letter automation logs, and a 0.00% false-halal dining verification gate.
- **Dining Moderation & Dispute Queue:** Persistent audit dispute review with HMAC-SHA256 outbox dispatch to n8n workflows and append-only audit trail logging.
- **Order Management & Payment Ledger:** End-to-end order inspection, financial ledger tracking, and state machine transition controls.
- **Armada Modem WiFi (Fleet Management):** Pocket WiFi hardware tracking (serial numbers `JMF-WIFI-001` through `010`), battery health diagnostics, physical inspection logs, and deposit release triggers.
- **Dynamic Adapter Switches:** Live runtime toggling between Mock and Sandbox adapters (Midtrans Snap & Airalo).

### 🤖 Automation Engine with n8n (`automation/n8n/`)
- 12 production-grade n8n workflow JSON exports and voice assistants orchestrated via a **Transactional Outbox Pattern**:
  1. `01-order-fulfilment.json`: Provisions eSIM, generates QR codes, and dispatches customer notification emails upon `order.paid`.
  2. `02-checkout-recovery.json`: 30-minute cart reminders and automated 24-hour expiration releasing reserved stock.
  3. `03-device-lifecycle.json`: Return reminders 2 days prior to deadline and deposit refund pipeline.
  4. `04-usage-and-expiry-alerts.json`: Proactive alerts when data consumption reaches 80%.
  5. `05-ops-digest.json`: Daily operational digest dispatch to Slack, Telegram, or Mailpit.
  6. `06-content-publish.json`: Marketing draft and newsletter dispatch triggers.
  7. `07-support-intake.json`: Urgent keyword triage (`darurat`, `no signal`) and dietary contaminant escalation (`pork`, `mirin`).
  8. `08-error-handler.json`: Captures failed workflow runs into the dead-letter log.
  9. `09-dining-enrichment.json`: Verbatim halal evidence extraction and certificate OCR verification.
  10. `10-dining-concierge-chat.json`: Dietary natural language parser converting traveler queries into structured API parameters.
  11. `11-voice-halal-osm-google-scraper.json`: Voice-to-output scraper querying OpenStreetMap (Overpass API) and Google Places.
  12. `12-mock-payment-gateway-relay.json`: Webhook relay simulator for payment settlement confirmations.
  13. `voice-transcribe-confirm.json`: Voice assistant audio intake and transcription confirmation.
  14. `voice-query-processor.json`: Real-time voice query processor powered by NVIDIA NIM MiniMax (`minimaxai/minimax-m3.1-flash`) with intent classification and deterministic API routing.

---

## Tech Stack

- **Monorepo Architecture:** [Turborepo](https://turbo.build/) 2.1, [pnpm](https://pnpm.io/) Workspaces (`node >= 20.0.0`, `pnpm >= 9.0.0`)
- **Frontend (`apps/web`):** [Next.js](https://nextjs.org/) 14.2 (App Router), [React](https://react.dev/) 18.3, [Tailwind CSS](https://tailwindcss.com/) 3.4, [Framer Motion](https://www.framer.com/motion/) 14.7, [next-intl](https://next-intl-docs.vercel.app/) 3.20, [Lucide React](https://lucide.dev/)
- **Admin CMS (`apps/admin`):** [Vite](https://vitejs.dev/) 5.4, React 18.3, Tailwind CSS 3.4, Lucide React
- **Backend API (`apps/api`):** [NestJS](https://nestjs.com/) 10.4, [Prisma](https://www.prisma.io/) 5.20, [Drizzle ORM](https://orm.drizzle.team/), [PostgreSQL](https://www.postgresql.org/) 16, [Redis](https://redis.io/) 7 & [BullMQ](https://bullmq.io/) 5.12, Argon2, Passport JWT, SimpleWebAuthn, Helmet, Swagger OpenAPI
- **Shared Packages:**
  - `@javamifi/shared`: Zod validation schemas, business logic, money/FX helpers, crypto signatures
  - `@javamifi/ui`: Transit-inspired design system tokens, wayfinding primitives, and shared Tailwind presets
  - `@javamifi/api-client`: Type-safe REST client wrapper
  - `@javamifi/config`: Shared ESLint, Prettier, and TypeScript configurations
- **Workflow Automation:** [n8n](https://n8n.io/) self-hosted automation server
- **Local Mail Server:** [Mailpit](https://github.com/axllent/mailpit) (SMTP & Web UI)
- **Quality Assurance & Testing:** [Vitest](https://vitest.dev/) 2.1 (119 unit/integration test suites, 1,110 tests), Jest, ESLint, Prettier, Husky, Commitlint

---

## Architecture Overview

```
javamifi-compass/
├── apps/
│   ├── web/               # Next.js 14 App Router public client (:3000)
│   ├── admin/             # Vite + React Operations CMS (:3002)
│   └── api/               # NestJS modular monolith API (:3001)
├── packages/
│   ├── shared/            # Shared Zod schemas, domain models & helpers
│   ├── ui/                # Wayfinding tokens, Tailwind preset & components
│   ├── api-client/        # Type-safe API client
│   └── config/            # Workspace ESLint and TypeScript configs
├── automation/
│   └── n8n/               # 14 self-hosted n8n workflow JSON definitions
├── infra/                 # Docker Compose & service definitions
└── docs/                  # Architecture, PRD, Security & Verification docs
```

JavaMifi Compass adopts a **modular monolith** backend coupled with independent frontend applications. The public Next.js web application (`apps/web`) and the React admin application (`apps/admin`) communicate with the NestJS backend (`apps/api`) through contract-first REST endpoints validated with shared Zod schemas (`@javamifi/shared`). Server-side pricing calculations enforce zero client-side price tampering.

The backend acts as the single source of truth for all business logic, order state transitions, and fail-closed halal classification algorithms. High-volume asynchronous operations—such as payment callbacks, device lifecycle reminders, and usage alerts—are enqueued into Redis queues powered by BullMQ. Critical events are recorded into an append-only outbox table, dispatched via signed HMAC-SHA256 HTTP webhooks to an isolated self-hosted n8n instance.

The self-hosted n8n workflow engine coordinates external communication, AI voice intent extraction via NVIDIA NIM MiniMax, and scraping pipelines. Workflows communicate back to the backend through authenticated webhook endpoints; n8n never queries or writes to the database directly.

---

## Prerequisites

- **Node.js**: `>= 20.0.0`
- **Package Manager**: `pnpm >= 9.0.0`
- **Docker**: Docker Engine & Docker Compose v2 (for PostgreSQL, Redis, Mailpit, n8n)
- **Git**

---

## Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/<username>/<repo-name>.git
   cd <repo-name>
   ```

2. **Install monorepo dependencies:**
   ```bash
   pnpm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   *(Optional: Adjust values in `.env` if using custom ports or third-party sandbox credentials.)*

4. **Start infrastructure containers:**
   ```bash
   docker compose up -d
   ```
   This spins up PostgreSQL 16 (`:5432`), Redis 7 (`:6379`), Mailpit (`:8025`), and n8n (`:5678`).

5. **Generate database client and seed sample data:**
   ```bash
   pnpm --filter @javamifi/api db:generate
   pnpm --filter @javamifi/api db:seed
   ```

---

## How to Run

### Development Mode

Start all applications (Web, Admin, and API) concurrently via Turborepo:
```bash
pnpm dev
```

Or run individual applications:
```bash
# Public Web client on http://localhost:3000
pnpm --filter @javamifi/web dev

# Admin CMS on http://localhost:3002
pnpm --filter @javamifi/admin dev

# NestJS API backend on http://localhost:3001
pnpm --filter @javamifi/api dev
```

### Production Build

```bash
pnpm build
```

### Running Tests & Linting

```bash
# Run all unit and integration tests across the monorepo (119 suites, 1,110 tests)
pnpm test

# Run TypeScript type check across all 9 workspaces
pnpm typecheck

# Run ESLint across all packages
pnpm lint
```

### Access URLs & Default Credentials

| Service | URL | Credentials / Notes |
|---|---|---|
| **Public Traveler Web** | [http://localhost:3000](http://localhost:3000) | Traveler store, planner wizard, halal dining & Trip Hub |
| **Admin CMS** | [http://localhost:3002](http://localhost:3002) | `admin@javamifi.com` / `Admin12345!` |
| **NestJS API & Swagger** | [http://localhost:3001/api/docs](http://localhost:3001/api/docs) | Complete interactive OpenAPI documentation |
| **n8n Automation Studio** | [http://localhost:5678](http://localhost:5678) | User: `admin` / Pass: `admin` |
| **Mailpit Inbox** | [http://localhost:8025](http://localhost:8025) | Local SMTP inspector for sent QR codes and alerts |

### Environment Variables Template

Refer to [`.env.example`](.env.example) for all variables. Crucial values include:

```env
# Application URLs
APP_URL=http://localhost:3000
API_URL=http://localhost:3001
ADMIN_URL=http://localhost:3002

# Database & Cache
DATABASE_URL=postgresql://javamifi:javamifi_dev@localhost:5432/javamifi_compass
REDIS_URL=redis://localhost:6379

# Security & Secrets (use random strings for production)
JWT_SECRET=change-me-in-production-use-64-chars-minimum-random-string-here
WEBHOOK_SECRET=change-me-webhook-hmac-secret-minimum-32-chars

# Operational Modes
PAYMENT_GATEWAY_MODE=mock
ESIM_PROVIDER_MODE=mock
NOTIFICATION_MODE=mock

# AI / Automation (Optional)
GEMINI_API_KEY=your_gemini_api_key_here
NVIDIA_API_KEY=your_nvidia_api_key_here
```

---

## Screenshots

| View | Screenshot |
|---|---|
| **Public Home & Wayfinding** | *(Add screenshot: `docs/screenshots/home.png`)* |
| **Trip Planner Wizard** | *(Add screenshot: `docs/screenshots/planner.png`)* |
| **Compass Rasa Halal Dining** | *(Add screenshot: `docs/screenshots/halal-dining.png`)* |
| **Trip Hub Boarding Pass** | *(Add screenshot: `docs/screenshots/trip-hub.png`)* |
| **Admin Operations Dashboard** | *(Add screenshot: `docs/screenshots/admin-dashboard.png`)* |
| **n8n Voice Automation Workflow** | *(Add screenshot: `docs/screenshots/n8n-workflow.png`)* |

---

## License

Private & Confidential © JavaMifi. All rights reserved.
