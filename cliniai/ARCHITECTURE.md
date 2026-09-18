# CliniAI architecture

## Decision summary

CliniAI starts as a **modular monolith**: Next.js App Router, strict TypeScript, PostgreSQL and a deliberate server-side boundary. This keeps the MVP deployable as one application while avoiding a future rewrite when the scheduling, messaging and AI modules grow.

The project lives in this `cliniai/` directory because the parent ChatGPT project folder is a read-only project mirror containing synced reference material.

## Layers

```text
app/                 Routes, server components and presentation composition
components/          Reusable visual primitives and feature UI
features/            Feature-specific use cases and views (introduced per phase)
lib/                 Auth, authorization, tenancy context and shared utilities
database/            PostgreSQL migrations, seed and repository adapters
validations/         Zod schemas shared by server actions and routes
services/            Business reads/writes; never called directly from client UI
integrations/        Provider interfaces (WhatsApp, AI, payment) in later phases
```

## Security and tenancy

`Organization` is the tenant boundary. A request derives its organization from the signed session and a membership record; it never accepts an organization ID from the browser as authority. Every repository method receives the verified organization context and scopes reads/writes by it. IDs alone are insufficient to authorize access, which prevents IDOR and cross-clinic leakage.

The current foundation ships a deterministic in-memory demo adapter so the application can be reviewed immediately without a database server. It exposes the same repository boundary used by the PostgreSQL adapter. `database/migrations/` and `database/seed.ts` define the real PostgreSQL starting point. Replacing the demo adapter is therefore an infrastructure switch, not a UI rewrite.

Roles are `OWNER`, `ADMIN`, `MANAGER`, `SECRETARY` and `DOCTOR`; authorization is centralized in `lib/authorization.ts`. Later server actions must call `requireOrganizationContext()` and `requireRole()` before any domain access.

## Authentication

The Phase 1 credential flow validates input with Zod, verifies a bcrypt password hash, and writes an HttpOnly, SameSite=Lax signed session cookie. The seed creates the demo user. A production `AUTH_SECRET` is mandatory; development has a documented demo fallback only to make the empty local environment runnable.

## Design system

The UI extracts the reference's visual language: deep navy navigation, bright neutral canvas, small high-contrast headings, rounded white cards, restrained borders, blue primary actions, and semantic green/amber/red status colors. CSS custom properties are the source of truth for tokens. Layout uses a responsive grid and swaps the desktop rail for a horizontal mobile navigation.

## Later-phase seams

- Scheduling writes will be transactional and validate overlaps at the database and service layers.
- External providers live behind adapters, with a mock provider used only in demo mode.
- AI may request typed tools only; tools receive a verified organization context and retain all business-rule enforcement server-side.
- A job abstraction will process automation executions with idempotency keys and bounded retries.
