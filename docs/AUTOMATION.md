# JavaMifi Compass — Automation with n8n

Eight n8n workflows orchestrate the order, device, and communication lifecycle. The API remains the single source of truth: **n8n orchestrates and notifies, but never reads or writes the database directly**.

---

## 1. The Eight Automation Workflows

| # | Workflow Name | Trigger | Action & Responsibilities | Written Back to API |
|---|---|---|---|---|
| **01** | **Order Fulfilment** | `order.paid` event | Calls API to provision eSIM or queues physical Pocket WiFi shipment; emails Trip Hub QR code and install guide via Mailpit. | Fulfillment status, notification log |
| **02** | **Checkout Recovery** | Cron: every 15 min | Identifies orders pending for >30m and sends reminders; expires orders past 24 hours to release reserved stock. | Order expired, inventory released |
| **03** | **Device Lifecycle** | Cron: daily 09:00 WIB | Sends return reminders 2 days before rental due date; flags overdue units for ops escalation. | Rental status updates |
| **04** | **Usage & Expiry Alerts** | Cron: every 6 hours | Polls eSIM data usage quotas; fires alert email and top-up link when consumption crosses 80%. | Usage alert log |
| **05** | **Ops Daily Digest** | Cron: daily 08:00 WIB | Sends summary of shipments due today, active rentals, overdue units, and yesterday's revenue to ops team. | Digest execution record |
| **06** | **Content Publish** | `article.published` event | Triggers marketing campaign draft and prepares newsletter distribution. | Content distribution log |
| **07** | **Support Intake & Triage** | `ticket.created` event | Evaluates inquiry text for urgent keywords (`darurat`, `no signal`, `airport`) and escalates priority to URGENT. | Ticket priority |
| **08** | **Global Error Handler** | Any node failure | Captures workflow execution errors, notifies devops, and logs dead-letter events for CMS manual retry. | Dead-letter record |

---

## 2. Transactional Outbox Pattern

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant API as NestJS API
    participant DB as PostgreSQL
    participant Worker as Outbox Worker
    participant N8N as n8n Engine
    participant Mailpit as Mailpit (SMTP)

    Customer->>API: Pay Order (Webhook / Mock)
    activate API
    API->>DB: BEGIN TX: Update Order Status = PAID<br/>INSERT INTO outbox_events ('order.paid')
    DB-->>API: COMMIT TX
    deactivate API

    Worker->>DB: Poll PENDING outbox events
    Worker->>N8N: POST /webhook/javamifi/order-paid<br/>(Header: X-Javamifi-Signature: HMAC-SHA256)
    activate N8N
    N8N->>API: POST /fulfillment/esim/provision
    N8N->>Mailpit: Send Trip Hub & QR Email
    N8N-->>Worker: 200 OK
    deactivate N8N

    Worker->>DB: UPDATE outbox_events SET status = 'DELIVERED'
```

---

## 3. Webhook Delivery & Signature Verification

All webhooks sent from the NestJS outbox worker to n8n carry security headers:
- `X-Javamifi-Event-Id`: Unique UUID of the outbox record
- `X-Javamifi-Event-Type`: e.g. `order.paid`, `ticket.created`
- `X-Javamifi-Timestamp`: UNIX timestamp string
- `X-Javamifi-Signature`: `HMAC_SHA256(timestamp + "." + payload, WEBHOOK_SECRET)`

Callbacks from n8n to the API verify the signature using `constantTimeCompare` to ensure authenticity.

---

## 4. Retries and Dead-Letter Queue

If an n8n webhook or network call fails:
1. **Exponential Backoff:** Retried up to 5 times (`delay = 2^retryCount` seconds).
2. **Dead-Letter State:** If 5 attempts fail, the record moves to `status = 'DEAD_LETTER'`.
3. **Manual Retry:** Operations staff can view failed runs in the Admin CMS Automation Console (`/automation`) and click **"Manual Retry"** to re-dispatch with a single click.
