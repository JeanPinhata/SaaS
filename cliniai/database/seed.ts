import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";
import { demoDatabase } from "./demo-store";

// Carrega .env.local
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx > -1) {
        const key = trimmed.slice(0, idx).trim();
        let value = trimmed.slice(idx + 1).trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (!process.env[key]) process.env[key] = value;
      }
    }
  }
}

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

export function toUUID(str: string): string {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) {
    return str;
  }
  const hash = crypto.createHash("md5").update(str).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

async function seed() {
  if (!connectionString) {
    console.error("❌ ERRO: DATABASE_URL ou DIRECT_URL não configurada no .env.local.");
    process.exit(1);
  }

  console.log("🌱 Iniciando seed idempotente no Supabase PostgreSQL...");
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("🔌 Conectado ao Supabase.");

    await client.query("BEGIN;");

    const orgId = toUUID(demoDatabase.organization.id);
    const userId = toUUID(demoDatabase.users[0].id);
    const membershipId = toUUID(demoDatabase.memberships[0].id);

    // 1. Organização
    console.log("🏢 Semeando organização...");
    await client.query(
      `INSERT INTO organizations (id, name, slug, timezone, status)
       VALUES ($1, $2, $3, $4, 'ACTIVE')
       ON CONFLICT (id) DO UPDATE 
       SET name = EXCLUDED.name, status = EXCLUDED.status;`,
      [orgId, demoDatabase.organization.name, demoDatabase.organization.slug, demoDatabase.organization.timezone]
    );

    // 2. Usuário Administrador
    console.log("👤 Semeando usuário admin...");
    await client.query(
      `INSERT INTO users (id, name, email, password_hash, status)
       VALUES ($1, $2, $3, $4, 'ACTIVE')
       ON CONFLICT (id) DO UPDATE 
       SET password_hash = EXCLUDED.password_hash;`,
      [userId, demoDatabase.users[0].name, demoDatabase.users[0].email, demoDatabase.users[0].passwordHash]
    );

    // 3. Vínculo de Membership (OWNER)
    console.log("🛡️ Semeando membership...");
    await client.query(
      `INSERT INTO memberships (id, organization_id, user_id, role, status)
       VALUES ($1, $2, $3, 'OWNER', 'ACTIVE')
       ON CONFLICT (id) DO UPDATE 
       SET role = EXCLUDED.role;`,
      [membershipId, orgId, userId]
    );

    // 4. Especialidades
    console.log("🩺 Semeando especialidades...");
    for (const spec of demoDatabase.specialties) {
      await client.query(
        `INSERT INTO specialties (id, organization_id, name, status)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;`,
        [toUUID(spec.id), orgId, spec.name, spec.status]
      );
    }

    // 5. Profissionais
    console.log("👨‍⚕️ Semeando profissionais...");
    for (const prof of demoDatabase.professionals) {
      await client.query(
        `INSERT INTO professionals (id, organization_id, specialty_id, name, professional_registration, phone, email, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, phone = EXCLUDED.phone;`,
        [
          toUUID(prof.id),
          orgId,
          toUUID(prof.specialtyId),
          prof.name,
          prof.registration,
          prof.phone,
          prof.email,
          prof.status,
        ]
      );
    }

    // 6. Salas
    console.log("🚪 Semeando salas...");
    for (const room of demoDatabase.rooms) {
      await client.query(
        `INSERT INTO rooms (id, organization_id, name, description, status)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET description = EXCLUDED.description;`,
        [toUUID(room.id), orgId, room.name, room.description || null, room.status]
      );
    }

    // 7. Serviços
    console.log("💼 Semeando serviços...");
    for (const serv of demoDatabase.services) {
      await client.query(
        `INSERT INTO services (id, organization_id, name, duration_minutes, price, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price;`,
        [toUUID(serv.id), orgId, serv.name, serv.durationMinutes, serv.price, serv.status]
      );
    }

    // 8. Pacientes
    console.log("📋 Semeando pacientes...");
    for (const pat of demoDatabase.patients) {
      await client.query(
        `INSERT INTO patients (id, organization_id, full_name, phone, email, cpf, insurance_name, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone;`,
        [
          toUUID(pat.id),
          orgId,
          pat.fullName,
          pat.phone,
          pat.email || null,
          pat.cpf || null,
          pat.insuranceName || null,
          pat.status,
        ]
      );
    }

    // 9. Agendamentos
    console.log("📅 Semeando agendamentos...");
    for (const apt of demoDatabase.appointments) {
      const patientId = toUUID(apt.patientId || "patient_1");
      const professionalId = toUUID(apt.professionalId || "professional_1");
      const serviceId = toUUID(apt.serviceId || "service_1");
      const roomId = toUUID(apt.roomId || "room_1");

      await client.query(
        `INSERT INTO appointments (id, organization_id, patient_id, professional_id, service_id, room_id, starts_at, ends_at, status, source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'MANUAL')
         ON CONFLICT (id) DO UPDATE SET starts_at = EXCLUDED.starts_at, status = EXCLUDED.status;`,
        [
          toUUID(apt.id),
          orgId,
          patientId,
          professionalId,
          serviceId,
          roomId,
          apt.startsAt,
          apt.endsAt || apt.startsAt,
          apt.status,
        ]
      );
    }

    // 10. Pagamentos
    console.log("💰 Semeando pagamentos...");
    for (const pay of demoDatabase.payments) {
      await client.query(
        `INSERT INTO payments (id, organization_id, patient_id, appointment_id, amount, status, payment_method, paid_at, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, payment_method = EXCLUDED.payment_method;`,
        [
          toUUID(pay.id),
          orgId,
          toUUID(pay.patientId),
          pay.appointmentId ? toUUID(pay.appointmentId) : null,
          pay.amount,
          pay.status,
          pay.paymentMethod,
          pay.paidAt || null,
          pay.notes || null,
        ]
      );
    }

    // 11. Despesas
    console.log("📉 Semeando despesas...");
    for (const exp of demoDatabase.expenses) {
      await client.query(
        `INSERT INTO expenses (id, organization_id, description, category, amount, due_date, paid_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET amount = EXCLUDED.amount, paid_at = EXCLUDED.paid_at;`,
        [
          toUUID(exp.id),
          orgId,
          exp.description,
          exp.category,
          exp.amount,
          exp.dueDate,
          exp.paidAt || null,
        ]
      );
    }

    await client.query("COMMIT;");
    console.log("✨ Seed concluído com sucesso e 100% idempotente!");
  } catch (error) {
    await client.query("ROLLBACK;").catch(() => {});
    console.error("❌ Erro durante o seed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

void seed();
