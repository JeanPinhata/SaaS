# Implementation plan

## Discovery completed

- The supplied workspace did not contain an existing application or stack; only project instructions and synced reference material were present.
- The provided reference establishes a premium medical SaaS interface: dark left rail, light workspace, dense operational cards, restrained blue actions, and semantic appointment states.
- The requested architecture is a modular monolith with PostgreSQL, server-side tenancy and TypeScript strict mode.

## Phase 1 — Foundation (current delivery)

- [x] Next.js + React + TypeScript strict + Tailwind project scaffold.
- [x] PostgreSQL schema migration and realistic, fictional seed definition.
- [x] Signed cookie authentication, Zod validation, role and organization context.
- [x] Tenant-scoped repository boundary and cross-tenant guard tests.
- [x] Responsive main layout, design tokens and dashboard calculated from demo repository data.
- [ ] Replace demo adapter with the selected managed/local PostgreSQL runtime (requires a `DATABASE_URL`).

## Phase 2 — Records (in progress)

- [x] Patient search, create, edit and activate/inactivate actions.
- [x] Professional, specialty, service and room catalogs with tenant-scoped server validation and creation.
- [x] Responsive empty, success and validation/error states.
- [ ] Complete edit/activate/inactivate controls for the operational catalogs.
- [ ] Persist Phase 2 writes through the configured PostgreSQL adapter.

## Phase 3 — Scheduling (in progress)

- [x] Day agenda with tenant-scoped creation, confirmation and cancellation.
- [x] Service-layer collision detection for both professional and room.
- [ ] Recurring availability, schedule blocks, rescheduling, week/month views and database exclusion constraints.

## Phase 4 — Finance

Payments, expenses, transaction projection and date-filtered dashboard charts.

## Phase 5 — Messages

Conversation inbox, messages, templates and a clearly isolated Mock WhatsApp provider.

## Phase 6 — AI

Administrative-only agent, typed tool layer, no direct database access, medical guardrails and human handoff.

## Phase 7 — Automations

Scheduled confirmations/reminders, execution records, idempotency and bounded retries.

## Phase 8 — Reports

Operational, scheduling and financial reporting with permission-aware access.

## Phase 9–10 — Quality and polish

Full end-to-end security/tenant tests, accessibility and responsive checks, observability, error treatment and release readiness.
