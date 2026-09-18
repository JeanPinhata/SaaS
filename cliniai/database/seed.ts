/**
 * Phase 1 seed contract. The production adapter will execute this payload in a
 * transaction after a PostgreSQL client is configured. It intentionally owns no
 * UI values; dashboard projections are derived by services/dashboard.ts.
 */
import { demoDatabase } from "./demo-store";

async function seed() {
  // The first PostgreSQL adapter will persist this tenant-scoped fixture.
  // Keeping the seed object shared with the local demo adapter prevents drift.
  console.info(`Prepared ${demoDatabase.appointments.length} appointments for ${demoDatabase.organization.name}.`);
}

void seed();
