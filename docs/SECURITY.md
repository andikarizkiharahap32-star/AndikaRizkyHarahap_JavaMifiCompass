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
| **A07: Identification & Authentication Failures** | Brute force attacks on logins | Account lockout logic (5 failed attempts locks account for 15 minutes); Redis-backed rate limiting on `/auth/login` and checkout; optional TOTP 2FA. |
| **A08: Software and Data Integrity Failures** | Tampered payment notices or malicious packages | Midtrans notification SHA-512 signature verified in constant time; outbox webhook payloads signed with HMAC-SHA256 and verified upon reception. |
| **A09: Security Logging and Monitoring Failures** | Undetected breaches or tamperable logs | **Append-only audit log** (`audit_logs` table) with no application-level `UPDATE` or `DELETE` permissions; structured logs carrying correlation request IDs; personal data omitted from debug logs. |
| **A10: Server-Side Request Forgery (SSRF)** | Malicious URLs reaching internal infrastructure | Outbound integration clients (Open-Meteo, Frankfurter, REST Countries) strictly use hardcoded, allow-listed base URLs; external endpoints are never dynamically constructed from user input. |

---

## 2. Indonesian Personal Data Protection Law (UU 27/2022) Alignment

JavaMifi Compass is architected to comply with Indonesia's *Undang-Undang Pelindungan Data Pribadi* (UU PDP No. 27/2022):

1. **Data Minimization:** Only data strictly required for logistics delivery (recipient name, WhatsApp number, courier address) or eSIM transmission (email address) is collected.
2. **Explicit Consent & Purpose Limitation:** Traveler data is used solely for order fulfillment and return notifications.
3. **Data Retention & Soft Deletion:** Automated retention jobs purge customer shipping records 90 days after trip completion and deposit refund.
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
4. **Append-Only Financial Ledger:** Every monetary movement (charges, refunds, deposit holds, deposit releases) is recorded as an immutable row in `ledger_entries`. Balances are strictly derived.
