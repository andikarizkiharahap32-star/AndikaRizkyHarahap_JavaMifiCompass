# JavaMifi Compass — Security Architecture & OWASP Top 10 Controls

Security is built into every architectural layer of JavaMifi Compass rather than added as an afterthought. This document provides the written security checklist and controls mapping.

---

## 1. OWASP Top 10 (2021) Mitigation Matrix

| OWASP Category | Threat Description | Controls Implemented in Compass |
|---|---|---|
| **A01: Broken Access Control** | Unauthorized access to orders, trips, or admin tools | Permission-based RBAC enforced in API route guards (`RolesGuard`); ownership checks on all orders and trips; deny by default. Guest checkout utilizes unguessable crypto UUID tokens. |
| **A02: Cryptographic Failures** | Exposed credentials or weak hashing algorithms | Passwords hashed using memory-hard `argon2id`; short-lived JWT access tokens (15m) paired with rotating refresh tokens stored in hashed DB sessions; HMAC-SHA256 with timestamp replay protection for webhooks; constant-time string comparison (`constantTimeCompare`) preventing timing attacks. |
| **A03: Injection** | SQL injection or command injection | Object-Relational Mapping (Prisma) guarantees parameterized queries end-to-end; zero raw concatenated SQL queries. Input validation via Zod and class-validator DTOs at every controller boundary. |
| **A04: Insecure Design** | Price manipulation or duplicate charge abuse | **Server-side pricing**: Clients submit plan IDs and quantities, never amounts. Unique idempotency keys per payment attempt; unique constraints on `WebhookEvent.eventId` reject replay notifications. |
| **A05: Security Misconfiguration** | Leaked stack traces, insecure headers | Helmet HTTP security headers enabled; strict CORS allow-listing; no default passwords; only `.env.example` committed to git. |
| **A06: Vulnerable & Outdated Components** | Unpatched npm packages | Pinned versions in lockfile; pnpm workspace isolation; automated dependency audits in CI. |
| **A07: Identification & Authentication Failures** | Brute force attacks on logins | Account lockout logic (5 failed attempts locks account for 15 minutes); global `ThrottlerGuard` rate limiting (120 req/min per IP via `@nestjs/throttler`); protected authentication routes; optional TOTP 2FA. |
| **A08: Software and Data Integrity Failures** | Tampered payment notices or malicious packages | Midtrans notification SHA-512 signature verified in constant time; outbox webhook payloads signed with HMAC-SHA256 and verified upon reception. |
| **A09: Security Logging and Monitoring Failures** | Undetected breaches or tamperable logs | **Append-only audit log** (`audit_logs` table) with no application-level `UPDATE` or `DELETE` permissions; structured logs carrying correlation request IDs; personal data omitted from debug logs. |
| **A10: Server-Side Request Forgery (SSRF)** | Malicious URLs reaching internal infrastructure | Outbound integration clients (Open-Meteo, Frankfurter, REST Countries) strictly use hardcoded, allow-listed base URLs; external endpoints are never dynamically constructed from user input. |

---

## 2. Indonesian Personal Data Protection Law (UU 27/2022) Alignment

JavaMifi Compass is architected to comply with Indonesia's *Undang-Undang Pelindungan Data Pribadi* (UU PDP No. 27/2022):

1. **Data Minimization:** Only data strictly required for logistics delivery (recipient name, WhatsApp number, courier address) or eSIM transmission (email address) is collected.
2. **Explicit Consent & Purpose Limitation:** Traveler data is used solely for order fulfillment and return notifications.
3. **Data Retention & Soft Deletion:** Automated retention service (`RetentionService`) purges customer shipping addresses (`Prisma.DbNull`) 90 days after order completion and deposit refund, executing via scheduled daily cron.
4. **Secure Encryption:** Sensitive fields (tokens, secrets, passwords) are encrypted or hashed at rest.

---

## 3. Payment Gateway Security Architecture

1. **Zero Cardholder Data Scope:** No credit card numbers, CVVs, or bank credentials touch JavaMifi servers. Payments are handled via Midtrans Snap hosted popup or redirect.
2. **Webhook Verification (Midtrans):**
   ```
   Signature = SHA512(order_id + status_code + gross_amount + ServerKey)
   ```
   Verified using `constantTimeCompare` against timing attacks.
3. **Double-Spend & Duplicate Rejection:** The `WebhookEvent` table enforces a `@unique` index on `eventId`. Duplicate notifications trigger a fast 200 OK without double-crediting the ledger.
4. **Append-Only Financial Ledger:** Every monetary movement (charges, refunds, deposit holds, deposit releases) is recorded as an immutable row in `ledger_entries`. Balances are strictly derived. Accessible strictly by authorized roles via `GET /payments/ledger/:orderId` guarded by `JwtAuthGuard` and `RolesGuard(['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'OPS'])`.
5. **Sandbox & Mock Payment Guarding:** The `POST /payments/mock/callback` testing endpoint is strictly blocked in production environments (`NODE_ENV === 'production'`), validates order existence in PostgreSQL, enforces `PENDING_PAYMENT` state, and strictly validates the gross amount against `order.totalIdr`.

---

## 4. Route-Level Authentication & Authorization Enforcement Matrix

Every mutating or operational route is strictly gated by NestJS guards (`AuthGuard('jwt')`, `RolesGuard`) with fail-closed default posture:

| Route Path | HTTP Method | Guard / Auth Mechanism | Allowed Roles / Callers | Security Purpose |
|---|---|---|---|---|
| `/admin/*` | ALL | `JwtAuthGuard`, `RolesGuard` | `SUPER_ADMIN`, `ADMIN`, `OPS` | Protects operations dashboard, device inventory mutations, audit log views |
| `/orders` | GET | `JwtAuthGuard`, `RolesGuard` | `SUPER_ADMIN`, `ADMIN`, `OPS` | Prevents unauthorized listing of customer orders |
| `/orders/pending-recovery-candidates` | GET | `JwtAuthGuard`, `RolesGuard` | `SUPER_ADMIN`, `ADMIN`, `OPS` | Protected recovery candidate feed for automated recovery cron |
| `/orders/:id/status` | PATCH | `JwtAuthGuard`, `RolesGuard` | `SUPER_ADMIN`, `ADMIN`, `OPS` | Enforces state machine; strictly prevents callers from manually forging `PAID` transitions |
| `/payments/ledger/:orderId` | GET | `JwtAuthGuard`, `RolesGuard` | `SUPER_ADMIN`, `ADMIN`, `FINANCE`, `OPS` | Protects immutable ledger inspection |
| `/fulfillment/*` | ALL | `JwtAuthGuard`, `RolesGuard` | `SUPER_ADMIN`, `ADMIN`, `OPS` | Protects digital eSIM provisioning, modem logistics queues, and deposit release |
| `/content/pages/:id/publish` | POST | `JwtAuthGuard`, `RolesGuard` | `SUPER_ADMIN`, `ADMIN`, `EDITOR` | Protects CMS block publishing and n8n broadcast distribution triggers |
| `/support/tickets` | GET, PATCH | `JwtAuthGuard`, `RolesGuard` | `SUPER_ADMIN`, `ADMIN`, `SUPPORT` | Protects traveler support inquiries and priority triage updates |
| `/v1/dining/admin/*` | ALL | `JwtAuthGuard`, `RolesGuard` | `SUPER_ADMIN`, `ADMIN` | Protects Halal review queue overrides, kill-switches, and golden-set runs |
| `/payments/webhook/*` | POST | Cryptographic Gateway Signature | Payment Gateway Webhook | Validated using constant-time comparison; idempotent deduplication on `eventId` |
| `/automation/callback/*` | POST | Webhook Secret HMAC-SHA256 | n8n Orchestrator | Validates timestamp (≤ 5-minute replay window) and HMAC signature |

---

## 5. Transactional Outbox Background Daemon & Resiliency

To prevent lost events between database mutations and workflow dispatch:
1. **Atomic Dual-Write Guarantee:** Outbox rows are inserted within the same PostgreSQL ACID transaction as order state changes (`OrderStatus.PAID`).
2. **Background Poller Daemon:** `OutboxService` implements NestJS `OnApplicationBootstrap` to start a background poller (configurable via `OUTBOX_POLL_INTERVAL_MS`, default 5s).
3. **Exponential Backoff & Dead-Letter Queue:** Events failing HTTP delivery to n8n are rescheduled with exponential backoff (`Math.pow(2, attempts) * 1000ms`). After reaching max retry attempts (default 5), events transition to `DEAD_LETTER` status, creating a trackable entry in `automation_runs` for operator remediation in the Automation Console.
4. **Inbound Webhook Verification:** Workflows such as `01-order-fulfilment.json` verify the inbound `X-Javamifi-Signature` HMAC-SHA256 signature against the shared secret before processing.
