# Database foundation

## Tenant model

`organizations` is the root tenant table. `users` are global identities and `memberships` assigns a role within an organization. All tenant-owned rows include a non-null `organization_id`; compound indexes start with that column for both isolation and query performance.

Phase 1 creates the operational backbone used by the dashboard: organizations, users, memberships, specialties, professionals, patients, services, rooms, appointments, payments, expenses, waiting-list entries and notifications. The remaining specification entities (conversations, messages, templates, automations, audit logs and AI knowledge) are scheduled in their associated phases and retain the same tenant rule.

## Integrity rules

- Organization slugs and user emails are unique.
- A user can hold one membership per organization.
- Appointments reference tenant-owned patient, professional, service and optional room records.
- The appointment migration includes indexes for the principal calendar lookups. Phase 3 will add PostgreSQL range exclusion constraints to make professional/room collisions impossible even under concurrency.
- Money uses `numeric(12,2)`, timestamps use `timestamptz`, and clinic timezone is stored per organization.
- Soft lifecycle state uses explicit status fields; auditability is added before mutable operational flows are introduced.

## Seed data

The seed uses only fictional Brazilian-style names for **Clínica Vida**. It creates a demo owner (`admin@cliniai.demo`), three professionals, appointments, payments, alerts and a waiting list. Dashboard values are calculated from those records by the repository; no presentation component owns demo metrics.

## Running the database

1. Copy `.env.example` to `.env.local` and set `DATABASE_URL`.
2. Apply SQL files in `database/migrations/` with the PostgreSQL migration tool selected for deployment.
3. Run `npm run db:seed` after configuring a PostgreSQL client adapter (the starter seed is intentionally adapter-neutral until a hosted/local database is selected).

The UI intentionally remains available through the isolated demo adapter if `DATABASE_URL` is absent, which supports design review but must not be enabled in production.
