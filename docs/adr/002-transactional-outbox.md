# ADR 002: Transactional Outbox Pattern for Workflow Automation

## Status
Accepted

## Context
When an order is paid or a ticket is created, automated workflows in n8n need to be triggered. If we publish HTTP webhooks directly in the controller or service method, an unexpected crash or network glitch between DB commit and webhook dispatch causes dual-write inconsistencies and lost events.

## Decision
We implement the **Transactional Outbox Pattern**. When a business entity changes state, an event is inserted into the `outbox_events` table inside the exact same database transaction. A worker dispatches events to n8n with exponential backoff retries and HMAC-SHA256 signatures.

## Consequences
- **Positive:** Guaranteed at-least-once event delivery; resilient against downstream downtime; full auditability and manual retry capability in the Admin CMS console.
- **Trade-off:** Consumers must handle duplicate events idempotently using the unique event UUID.
