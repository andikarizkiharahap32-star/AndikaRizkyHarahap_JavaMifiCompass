# JavaMifi Compass — n8n Orchestration Architecture & Specification

## 1. Executive Summary & Boundaries

In accordance with JAVAMIFI architectural governance:
- **n8n's Role**: **Orchestration Only** (cron schedules, retries with exponential backoff, worker fan-out, alert webhooks, chat bot routing).
- **API's Role**: **Deterministic Core** (LLM provider adapters, 6-stage validation pipeline, HMAC-SHA256 security, currency calculations, database persistence, and fail-closed tier assignment).
- **Rule of Thumb**: n8n never computes currency conversions, never evaluates halal tiers via JavaScript code blocks, and never generates unquoted halal claims. n8n calls **only** the API (`https://api.compass.javamifi.com/v1/dining`) and Gemini 3.8 Flash.

```
       +-----------------------------------------------------------+
       |                  n8n Orchestration Engine                 |
       +-----------------------------+-----------------------------+
                                     |
               +---------------------+---------------------+
               |                     |                     |
     [Workflow 1: Cron]    [Workflow 2: Chat]    [Workflow 3: Dispute]
       Daily Re-Audit        WhatsApp / Telegram   Incident Slack Alerts
               |                     |                     |
               v                     v                     v
+------------------------------------------------------------------+
|                    JavaMifi Compass Dining API                   |
|                                                                  |
|  - GET  /v1/dining/orchestration/expiring-venues                 |
|  - POST /v1/dining/orchestration/chat-webhook                    |
|  - POST /v1/dining/callbacks/enrichment (HMAC-SHA256 Signed)     |
|  - POST /v1/dining/reports                                       |
|  - 6-Stage Deterministic Validation Pipeline                     |
|  - Daily FX Rate Engine (IDR Conversion)                         |
|  - Fail-Closed Halal Tier Engine (UNKNOWN Never Under Halal)     |
+------------------------------------------------------------------+
                               |
                               v
               +-------------------------------+
               |     Gemini 3.8 Flash Adapter  |
               | (High-Thinking Signal & Menu) |
               +-------------------------------+
```

---

## 2. Orchestration Workflows

### Workflow 1: Daily Certification Expiry Audit & Enrichment Fan-Out
- **Trigger**: Cron node at `02:00 UTC` every day.
- **Step 1 (Fetch Candidates)**:
  `GET /v1/dining/orchestration/expiring-venues?daysAhead=90`
- **Step 2 (Fan-Out & Rate Limiting)**:
  Splits candidate venues into batches of 5 with 2-second rate-limiting delays to respect external quota limits.
- **Step 3 (Gemini Flash Extraction)**:
  Calls Gemini 3.8 Flash high-thinking adapter with venue official registry evidence.
- **Step 4 (HMAC-SHA256 Signed Callback)**:
  Dispatches to `POST /v1/dining/callbacks/enrichment`:
  - Header `x-javamifi-timestamp`: ISO 8601 unix timestamp.
  - Header `x-javamifi-signature`: `HMAC-SHA256(payload, secret)`.
  - The API's 6-stage pipeline validates verbatim quotes and assigns the new deterministic tier.

### Workflow 2: Safe Conversational Chat Assistant (WhatsApp / Telegram)
- **Trigger**: Inbound Webhook from WhatsApp Cloud API or Telegram Bot.
- **Step 1 (Security Filter)**:
  Validates sender token and strips binary attachments.
- **Step 2 (API Safe Intent Search)**:
  `POST /v1/dining/orchestration/chat-webhook`
  ```json
  {
    "userMessage": "Cari ramen halal di Tokyo di bawah 2000 yen",
    "channel": "telegram",
    "userId": "tg_user_99214"
  }
  ```
- **Step 3 (Deliver Deterministic Response)**:
  Sends back the formatted plain-text response containing verified restaurant cards, dual prices in local currency + IDR, and the airport WiFi pickup booth location. **Zero hallucinations or unquoted halal claims.**

### Workflow 3: User Dispute & Halal Flag Alert Triage
- **Trigger**: Webhook from `POST /v1/dining/reports` when a traveler flags pork or alcohol.
- **Step 1 (Urgency Gate)**:
  If reason is `PORK_DETECTED` or `ALCOHOL_SERVED`, routes to Emergency Priority.
- **Step 2 (Slack / PagerDuty Notification)**:
  Sends rich ticket card to `#javamifi-halal-trust` Slack channel with one-click buttons linking to `/admin/review-queue`.

---

## 3. Production n8n Workflow Definitions

The following workflows reside in [`automation/n8n/`](file:///c:/JavaMifiProject/automation/n8n/):
- [`07-support-intake.json`](file:///c:/JavaMifiProject/automation/n8n/07-support-intake.json): Support intake and automated keyword-urgency triage (`pork`, `babi`, `mirin`, `expired`, `kadaluwarsa` automatically bump priority to `CRITICAL_SAFETY`).
- [`09-dining-enrichment.json`](file:///c:/JavaMifiProject/automation/n8n/09-dining-enrichment.json): Async AI enrichment workflow with HMAC signature verification, Gemini 1.5/3.8 Flash quote-or-abstain extraction, and deterministic API callback.
- [`10-dining-concierge-chat.json`](file:///c:/JavaMifiProject/automation/n8n/10-dining-concierge-chat.json): Threat-safe travel concierge chat workflow converting queries into structured parameters, querying the deterministic dining search API, and returning structured results with `Data Footprint: ~1.8 MB`.
