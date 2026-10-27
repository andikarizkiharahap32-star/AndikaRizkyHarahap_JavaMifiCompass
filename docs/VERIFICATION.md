# JavaMifi Compass — Verification & Reproducibility Playbook

This document provides exact, runnable commands to independently verify every layer of JavaMifi Compass without guesswork. No subjective self-grades; every assertion is backed by executable tests and compiler checks.

---

## 1. Quick Verification Matrix

Run these commands in order from the repository root:

```bash
# 1. Monorepo TypeScript Typecheck (7 packages in scope, 0 errors expected)
pnpm typecheck

# 2. Monorepo ESLint Verification (8 packages in scope, 0 errors expected)
pnpm lint

# 3. Next.js App Router Production Build (23/23 static pages prerendered)
pnpm --filter @javamifi/web build

# 4. Full Automated Test Suite (153 tests across shared and API modules)
pnpm test
```

---

## 2. Targeted Test Verification Suites

### A. Halal Fail-Closed Adversarial Probes
Validates that text matching partial certifier names (e.g. "Naha city", "Islamic Association" with warnings, "yakitori", contradictory quotes) fails closed to `NOT_HALAL`, `OPTIONS`, or `UNKNOWN` with **0 false `CERTIFIED` results**:

```bash
pnpm --filter @javamifi/api test:unit -- src/modules/dining/adversarial-probes.spec.ts
```

*Expected Result:* 8 / 8 tests pass (100%).

### B. Payment Route Security & Sandbox Guarding
Validates that `POST /payments/mock/callback` rejects arbitrary order numbers, enforces `PENDING_PAYMENT` state, requires exact amount matching, is blocked in production, and that `GET /payments/ledger/:orderId` requires authenticated admin/finance roles:

```bash
pnpm --filter @javamifi/api test:unit -- src/modules/payments/payments-guard.spec.ts
```

*Expected Result:* 4 / 4 tests pass.

### C. Data Retention & PII Purge Service
Validates that `RetentionService` purges customer shipping addresses on completed orders older than 90 days in accordance with Indonesia's UU PDP No. 27/2022:

```bash
pnpm --filter @javamifi/api test:unit -- src/modules/admin/retention.service.spec.ts
```

*Expected Result:* 3 / 3 tests pass.

### D. Transactional Outbox Background Poller Daemon
Validates that `OutboxService` automatically polls pending events, computes exponential backoff retry delays, and dead-letters failed dispatches:

```bash
pnpm --filter @javamifi/api test:unit -- src/modules/automation/outbox.service.spec.ts
```

*Expected Result:* 3 / 3 tests pass.

### E. Idempotent Payment & Webhook Deduplication
Validates that duplicate payment notifications with identical transaction/event IDs return 200 OK without double-crediting the ledger:

```bash
pnpm --filter @javamifi/api test:unit -- src/modules/payments/payments-idempotency.spec.ts
```

*Expected Result:* 3 / 3 tests pass.

### F. Order State Machine & Matrix Transitions
Validates state machine transitions across both digital eSIM and physical Pocket WiFi lifecycles:

```bash
pnpm --filter @javamifi/api test:unit -- src/modules/orders/order.state-machine.spec.ts
pnpm --filter @javamifi/api test:unit -- src/modules/orders/order.state-machine.matrix.spec.ts
```

*Expected Result:* All matrix states pass.

### G. Architecture Boundary Verification
Validates that modular boundaries are preserved and dependency rules are respected:

```bash
pnpm --filter @javamifi/api test:unit -- src/architecture-boundaries.spec.ts
```

*Expected Result:* Clean pass.

---

## 3. End-to-End Vertical Slice Walkthrough

To verify the end-to-end slice programmatically:

1. **Planner Engine:** Input traveler count = 4, days = 7, destination = JP. Output: Pocket WiFi recommended with break-even analysis at 2.4 devices.
2. **Order Creation:** Client sends plan ID and dates. Server calculates IDR total. Client cannot set amount.
3. **Mock Payment Callback:** Initiates payment, validates order state in database, confirms exact amount, moves order to `PAID`, writes immutable `ledger_entries` row, and writes dual-write event into `outbox_events`.
4. **Outbox Polling Daemon:** Background interval picks up pending outbox event, signs HMAC-SHA256 with timestamp header, and delivers to n8n webhook.
5. **n8n Workflow Verification:** Webhook node verifies HMAC signature in constant time before downstream processing.
6. **Trip Hub:** Post-purchase view loads verified order state, displays eSIM activation QR or physical device return tracker, and renders 400m Shibuya return logistics proximity context.
