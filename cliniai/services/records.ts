import { randomUUID } from "node:crypto";
import { demoDatabase } from "../database/demo-store";
import { assertTenantAccess, type OrganizationContext } from "../lib/authorization";
import { getDbPool } from "../lib/db";
import type { EntityStatus, Patient, Professional, Room, Service, Specialty } from "../lib/types";
import { toUUID } from "../lib/uuid";

type Context = OrganizationContext;

const inTenant = <T extends { organizationId: string }>(records: T[], context: Context) =>
  records.filter((record) => record.organizationId === context.organizationId);

const byId = <T extends { id: string; organizationId: string }>(records: T[], id: string, context: Context) => {
  const record = records.find((candidate) => candidate.id === id);
  return record ? assertTenantAccess(context, record) : null;
};

export async function listPatients(context: Context, query = ""): Promise<Patient[]> {
  const pool = getDbPool();
  if (pool) {
    try {
      const orgId = toUUID(context.organizationId);
      const res = await pool.query(
        `SELECT id, organization_id as "organizationId", full_name as "fullName", phone, email, cpf, insurance_name as "insuranceName", status, created_at as "createdAt"
         FROM patients
         WHERE organization_id = $1
         ORDER BY full_name ASC`,
        [orgId]
      );
      if (res.rows.length > 0) {
        const normalized = query.trim().toLocaleLowerCase("pt-BR");
        return res.rows.filter(
          (patient: any) =>
            !normalized ||
            [patient.fullName, patient.phone, patient.cpf].filter(Boolean).some((value) =>
              value?.toLocaleLowerCase("pt-BR").includes(normalized)
            )
        );
      }
    } catch (e) {
      console.warn("DB listPatients fallback:", e);
    }
  }

  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  return inTenant(demoDatabase.patients, context)
    .filter(
      (patient) =>
        !normalized ||
        [patient.fullName, patient.phone, patient.cpf].filter(Boolean).some((value) =>
          value?.toLocaleLowerCase("pt-BR").includes(normalized)
        )
    )
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "pt-BR"));
}

export async function savePatient(
  context: Context,
  input: Omit<Patient, "id" | "organizationId" | "status" | "createdAt"> & { id?: string }
): Promise<Patient> {
  const pool = getDbPool();
  const id = input.id ? toUUID(input.id) : toUUID(randomUUID());
  const orgId = toUUID(context.organizationId);

  if (pool) {
    try {
      await pool.query(
        `INSERT INTO patients (id, organization_id, full_name, phone, email, cpf, insurance_name, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE')
         ON CONFLICT (id) DO UPDATE
         SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, email = EXCLUDED.email, cpf = EXCLUDED.cpf, insurance_name = EXCLUDED.insurance_name`,
        [id, orgId, input.fullName, input.phone, input.email || null, input.cpf || null, input.insuranceName || null]
      );
    } catch (e) {
      console.warn("DB savePatient fallback:", e);
    }
  }

  if (input.id) {
    const patient = byId(demoDatabase.patients, input.id, context);
    if (!patient) throw new Error("Paciente não encontrado.");
    Object.assign(patient, input);
    return patient;
  }

  const record: Patient = {
    ...input,
    id,
    organizationId: context.organizationId,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
  };
  demoDatabase.patients.push(record);
  return record;
}

export async function updatePatientStatus(context: Context, id: string, status: EntityStatus): Promise<void> {
  const pool = getDbPool();
  if (pool) {
    try {
      await pool.query(`UPDATE patients SET status = $1, updated_at = now() WHERE id = $2 AND organization_id = $3`, [
        status,
        toUUID(id),
        toUUID(context.organizationId),
      ]);
    } catch (e) {
      console.warn("DB updatePatientStatus fallback:", e);
    }
  }

  const patient = byId(demoDatabase.patients, id, context);
  if (!patient) throw new Error("Paciente não encontrado.");
  patient.status = status;
}

export async function listRecords(context: Context) {
  const pool = getDbPool();
  if (pool) {
    try {
      const orgId = toUUID(context.organizationId);
      const [specRes, profRes, servRes, roomRes] = await Promise.all([
        pool.query(`SELECT id, organization_id as "organizationId", name, status FROM specialties WHERE organization_id = $1`, [orgId]),
        pool.query(
          `SELECT id, organization_id as "organizationId", name, specialty_id as "specialtyId", professional_registration as "registration", phone, email, status FROM professionals WHERE organization_id = $1`,
          [orgId]
        ),
        pool.query(
          `SELECT id, organization_id as "organizationId", name, duration_minutes as "durationMinutes", price::numeric::float as "price", status FROM services WHERE organization_id = $1`,
          [orgId]
        ),
        pool.query(`SELECT id, organization_id as "organizationId", name, description, status FROM rooms WHERE organization_id = $1`, [orgId]),
      ]);

      if (specRes.rows.length > 0 || profRes.rows.length > 0 || servRes.rows.length > 0 || roomRes.rows.length > 0) {
        return {
          specialties: specRes.rows,
          professionals: profRes.rows,
          services: servRes.rows,
          rooms: roomRes.rows,
        };
      }
    } catch (e) {
      console.warn("DB listRecords fallback:", e);
    }
  }

  return {
    specialties: inTenant(demoDatabase.specialties, context),
    professionals: inTenant(demoDatabase.professionals, context),
    services: inTenant(demoDatabase.services, context),
    rooms: inTenant(demoDatabase.rooms, context),
  };
}

function saveRecord<T extends { id: string; organizationId: string; status: EntityStatus }>(
  records: T[],
  context: Context,
  input: Omit<T, "id" | "organizationId" | "status"> & { id?: string }
): T {
  const existing = input.id ? byId(records, input.id, context) : null;
  if (input.id && !existing) throw new Error("Cadastro não encontrado.");
  if (existing) return Object.assign(existing, input) as T;
  const record = { ...input, id: randomUUID(), organizationId: context.organizationId, status: "ACTIVE" } as T;
  records.push(record);
  return record;
}

export async function saveSpecialty(context: Context, input: Omit<Specialty, "id" | "organizationId" | "status"> & { id?: string }) {
  const pool = getDbPool();
  const id = input.id ? toUUID(input.id) : toUUID(randomUUID());
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO specialties (id, organization_id, name, status)
         VALUES ($1, $2, $3, 'ACTIVE')
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
        [id, toUUID(context.organizationId), input.name]
      );
    } catch (e) {
      console.warn("DB saveSpecialty fallback:", e);
    }
  }
  return saveRecord(demoDatabase.specialties, context, input);
}

export async function saveService(context: Context, input: Omit<Service, "id" | "organizationId" | "status"> & { id?: string }) {
  const pool = getDbPool();
  const id = input.id ? toUUID(input.id) : toUUID(randomUUID());
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO services (id, organization_id, name, duration_minutes, price, status)
         VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, duration_minutes = EXCLUDED.duration_minutes, price = EXCLUDED.price`,
        [id, toUUID(context.organizationId), input.name, input.durationMinutes, input.price]
      );
    } catch (e) {
      console.warn("DB saveService fallback:", e);
    }
  }
  return saveRecord(demoDatabase.services, context, input);
}

export async function saveRoom(context: Context, input: Omit<Room, "id" | "organizationId" | "status"> & { id?: string }) {
  const pool = getDbPool();
  const id = input.id ? toUUID(input.id) : toUUID(randomUUID());
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO rooms (id, organization_id, name, description, status)
         VALUES ($1, $2, $3, $4, 'ACTIVE')
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description`,
        [id, toUUID(context.organizationId), input.name, input.description || null]
      );
    } catch (e) {
      console.warn("DB saveRoom fallback:", e);
    }
  }
  return saveRecord(demoDatabase.rooms, context, input);
}

export async function saveProfessional(
  context: Context,
  input: Omit<Professional, "id" | "organizationId" | "status" | "specialtyId"> & {
    id?: string;
    specialtyId?: string;
    specialty?: string;
  }
) {
  let finalSpecialtyId = input.specialtyId;

  if (input.specialty && input.specialty.trim()) {
    const specName = input.specialty.trim();
    const pool = getDbPool();
    if (pool) {
      try {
        const found = await pool.query(
          `SELECT id FROM specialties WHERE organization_id = $1 AND LOWER(name) = LOWER($2) LIMIT 1`,
          [toUUID(context.organizationId), specName]
        );
        if (found.rows.length > 0) {
          finalSpecialtyId = found.rows[0].id;
        }
      } catch (e) {
        console.warn("DB find specialty query fallback:", e);
      }
    }

    if (!finalSpecialtyId) {
      const foundInDemo = demoDatabase.specialties.find(
        (s) => s.organizationId === context.organizationId && s.name.toLowerCase() === specName.toLowerCase()
      );
      if (foundInDemo) {
        finalSpecialtyId = foundInDemo.id;
      }
    }

    if (!finalSpecialtyId) {
      const created = await saveSpecialty(context, { name: specName });
      finalSpecialtyId = created.id;
    }
  }

  if (!finalSpecialtyId) {
    throw new Error("Especialidade obrigatória.");
  }

  const pool = getDbPool();
  const id = input.id ? toUUID(input.id) : toUUID(randomUUID());
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO professionals (id, organization_id, specialty_id, name, professional_registration, phone, email, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE')
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, specialty_id = EXCLUDED.specialty_id, phone = EXCLUDED.phone, email = EXCLUDED.email`,
        [
          id,
          toUUID(context.organizationId),
          toUUID(finalSpecialtyId),
          input.name,
          input.registration,
          input.phone,
          input.email,
        ]
      );
    } catch (e) {
      console.warn("DB saveProfessional fallback:", e);
    }
  }

  let specInDemo = demoDatabase.specialties.find((s) => s.id === finalSpecialtyId);
  if (!specInDemo && input.specialty) {
    specInDemo = {
      id: finalSpecialtyId,
      organizationId: context.organizationId,
      name: input.specialty.trim(),
      status: "ACTIVE",
    };
    demoDatabase.specialties.push(specInDemo);
  }

  const { specialty: _specialtyText, ...professionalData } = input;
  return saveRecord(demoDatabase.professionals, context, {
    ...professionalData,
    specialtyId: finalSpecialtyId,
  });
}


export async function updateRecordStatus(
  context: Context,
  type: "specialty" | "professional" | "service" | "room",
  id: string,
  status: EntityStatus
) {
  const pool = getDbPool();
  if (pool) {
    try {
      const tableMap = { specialty: "specialties", professional: "professionals", service: "services", room: "rooms" };
      const tableName = tableMap[type];
      await pool.query(`UPDATE ${tableName} SET status = $1, updated_at = now() WHERE id = $2 AND organization_id = $3`, [
        status,
        toUUID(id),
        toUUID(context.organizationId),
      ]);
    } catch (e) {
      console.warn("DB updateRecordStatus fallback:", e);
    }
  }
  const collection = {
    specialty: demoDatabase.specialties,
    professional: demoDatabase.professionals,
    service: demoDatabase.services,
    room: demoDatabase.rooms,
  }[type];
  const record = byId(collection, id, context);
  if (!record) throw new Error("Cadastro não encontrado.");
  record.status = status;
}
