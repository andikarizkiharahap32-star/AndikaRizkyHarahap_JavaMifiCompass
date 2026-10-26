# ADR 003: Ports and Adapters (Hexagonal Architecture) for External Services

## Status
Accepted

## Context
The platform interfaces with external services: payment gateways (Midtrans), eSIM providers (Airalo), weather APIs (Open-Meteo), currency exchange (Frankfurter), and country data (REST Countries). Requiring live third-party accounts or paid API keys would prevent reviewers and CI pipelines from running the code out of the box.

## Decision
We enforce **Ports and Adapters** for every external dependency. Each external service defines a typed TypeScript interface (`Port`) with at least two implementations:
1. A **Mock Adapter** that is self-contained, deterministic, and requires zero secrets.
2. A **Live / Sandbox Adapter** that communicates with real remote endpoints.

## Consequences
- **Positive:** System runs immediately upon cloning; 100% testable without network access; swappable providers without touching business logic.
- **Trade-off:** Additional interface boilerplate for each external client.
