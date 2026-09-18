import { randomUUID } from "node:crypto";
import { demoDatabase } from "../database/demo-store";
import { assertTenantAccess, type OrganizationContext } from "../lib/authorization";
import type { EntityStatus, Patient, Professional, Room, Service, Specialty } from "../lib/types";

type Context = OrganizationContext;
const inTenant = <T extends { organizationId: string }>(records: T[], context: Context) => records.filter((record) => record.organizationId === context.organizationId);
const byId = <T extends { id: string; organizationId: string }>(records: T[], id: string, context: Context) => {
  const record = records.find((candidate) => candidate.id === id);
  return record ? assertTenantAccess(context, record) : null;
};

export async function listPatients(context: Context, query = "") {
  const normalized = query.trim().toLocaleLowerCase("pt-BR");
  return inTenant(demoDatabase.patients, context).filter((patient) => !normalized || [patient.fullName, patient.phone, patient.cpf].filter(Boolean).some((value) => value?.toLocaleLowerCase("pt-BR").includes(normalized))).sort((a, b) => a.fullName.localeCompare(b.fullName, "pt-BR"));
}
export async function savePatient(context: Context, input: Omit<Patient, "id" | "organizationId" | "status" | "createdAt"> & { id?: string }) {
  if (input.id) { const patient = byId(demoDatabase.patients, input.id, context); if (!patient) throw new Error("Paciente não encontrado."); Object.assign(patient, input); return patient; }
  const record: Patient = { ...input, id: randomUUID(), organizationId: context.organizationId, status: "ACTIVE", createdAt: new Date().toISOString() };
  demoDatabase.patients.push(record); return record;
}
export async function updatePatientStatus(context: Context, id: string, status: EntityStatus) { const patient = byId(demoDatabase.patients, id, context); if (!patient) throw new Error("Paciente não encontrado."); patient.status = status; }

export async function listRecords(context: Context) { return { specialties: inTenant(demoDatabase.specialties, context), professionals: inTenant(demoDatabase.professionals, context), services: inTenant(demoDatabase.services, context), rooms: inTenant(demoDatabase.rooms, context) }; }
function saveRecord<T extends { id: string; organizationId: string; status: EntityStatus }>(records: T[], context: Context, input: Omit<T, "id" | "organizationId" | "status"> & { id?: string }): T {
  const existing = input.id ? byId(records, input.id, context) : null;
  if (input.id && !existing) throw new Error("Cadastro não encontrado.");
  if (existing) return Object.assign(existing, input) as T;
  const record = { ...input, id: randomUUID(), organizationId: context.organizationId, status: "ACTIVE" } as T; records.push(record); return record;
}
export async function saveSpecialty(context: Context, input: Omit<Specialty, "id" | "organizationId" | "status"> & { id?: string }) { return saveRecord(demoDatabase.specialties, context, input); }
export async function saveService(context: Context, input: Omit<Service, "id" | "organizationId" | "status"> & { id?: string }) { return saveRecord(demoDatabase.services, context, input); }
export async function saveRoom(context: Context, input: Omit<Room, "id" | "organizationId" | "status"> & { id?: string }) { return saveRecord(demoDatabase.rooms, context, input); }
export async function saveProfessional(context: Context, input: Omit<Professional, "id" | "organizationId" | "status"> & { id?: string }) { if (!byId(demoDatabase.specialties, input.specialtyId, context)) throw new Error("Especialidade inválida."); return saveRecord(demoDatabase.professionals, context, input); }
export async function updateRecordStatus(context: Context, type: "specialty" | "professional" | "service" | "room", id: string, status: EntityStatus) { const collection = { specialty: demoDatabase.specialties, professional: demoDatabase.professionals, service: demoDatabase.services, room: demoDatabase.rooms }[type]; const record = byId(collection, id, context); if (!record) throw new Error("Cadastro não encontrado."); record.status = status; }
