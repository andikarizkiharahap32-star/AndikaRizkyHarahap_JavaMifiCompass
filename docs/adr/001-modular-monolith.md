# ADR 001: Modular Monolith Architecture

## Status
Accepted

## Context
JavaMifi Compass spans 13 backend modules including auth, catalog, planner, orders, payments, fulfillment, and integrations. A microservice architecture would introduce distributed transactions, RPC overhead, service discovery, and complex local deployment for reviewers.

## Decision
We adopt a **modular monolith** within a single NestJS application. Each module has strict boundaries, owns its business rules, and communicates with other modules only through exported service interfaces or asynchronous events.

## Consequences
- **Positive:** Starts with a single `docker compose up` command; shared transaction boundaries; zero microservice operational tax.
- **Trade-off:** Strict discipline required to prevent cross-module table joins. Enforced by repository patterns and code reviews.
