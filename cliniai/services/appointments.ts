import { randomUUID } from "node:crypto";
import { demoDatabase, todayInSaoPaulo } from "../database/demo-store";
import { assertTenantAccess, type OrganizationContext } from "../lib/authorization";
import type { AppointmentStatus, DemoAppointment } from "../lib/types";

const active = (status: AppointmentStatus) => !["CANCELLED", "NO_SHOW"].includes(status);
const recordById = <T extends { id: string; organizationId: string }>(records: T[], id: string, context: OrganizationContext) => { const record = records.find((item) => item.id === id); return record ? assertTenantAccess(context, record) : null; };

export async function listAppointments(context: OrganizationContext, date = todayInSaoPaulo()) {
  return demoDatabase.appointments.filter((item) => item.organizationId === context.organizationId && item.startsAt.startsWith(date)).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export async function createAppointment(context: OrganizationContext, input: { patientId: string; professionalId: string; serviceId: string; roomId: string; date: string; time: string }) {
  const patient = recordById(demoDatabase.patients, input.patientId, context); const professional = recordById(demoDatabase.professionals, input.professionalId, context); const service = recordById(demoDatabase.services, input.serviceId, context); const room = recordById(demoDatabase.rooms, input.roomId, context);
  if (!patient || !professional || !service || !room) throw new Error("Os dados selecionados não pertencem à clínica.");
  if (patient.status !== "ACTIVE" || professional.status !== "ACTIVE" || service.status !== "ACTIVE" || room.status !== "ACTIVE") throw new Error("Selecione somente cadastros ativos.");
  const startsAt = `${input.date}T${input.time}:00-03:00`; const start = new Date(startsAt); const endsAt = new Date(start.getTime() + service.durationMinutes * 60_000).toISOString();
  const conflict = demoDatabase.appointments.some((appointment) => appointment.organizationId === context.organizationId && active(appointment.status) && ((appointment.professionalId === professional.id) || (appointment.roomId === room.id)) && start < new Date(appointment.endsAt ?? appointment.startsAt) && new Date(appointment.startsAt) < new Date(endsAt));
  if (conflict) throw new Error("Este horário conflita com a agenda do profissional ou da sala.");
  const created: DemoAppointment = { id: randomUUID(), organizationId: context.organizationId, patientId: patient.id, professionalId: professional.id, serviceId: service.id, roomId: room.id, patientName: patient.fullName, professionalName: professional.name, startsAt, endsAt, status: "SCHEDULED", expectedAmount: service.price };
  demoDatabase.appointments.push(created); return created;
}

export async function updateAppointmentStatus(context: OrganizationContext, id: string, status: AppointmentStatus) { const appointment = recordById(demoDatabase.appointments, id, context); if (!appointment) throw new Error("Consulta não encontrada."); appointment.status = status; return appointment; }

export async function rescheduleAppointment(
  context: OrganizationContext,
  appointmentId: string,
  input: { date: string; time: string; roomId?: string }
) {
  const appointment = recordById(demoDatabase.appointments, appointmentId, context);
  if (!appointment) throw new Error("Consulta não encontrada.");
  if (["CANCELLED", "COMPLETED", "NO_SHOW"].includes(appointment.status)) {
    throw new Error("Não é possível reagendar uma consulta finalizada ou cancelada.");
  }

  const service = appointment.serviceId
    ? recordById(demoDatabase.services, appointment.serviceId, context)
    : demoDatabase.services[0];
  const duration = service?.durationMinutes ?? 30;

  const targetRoomId = input.roomId ?? appointment.roomId ?? demoDatabase.rooms[0]?.id;
  const startsAt = `${input.date}T${input.time}:00-03:00`;
  const start = new Date(startsAt);
  const endsAt = new Date(start.getTime() + duration * 60_000).toISOString();

  const conflict = demoDatabase.appointments.some(
    (other) =>
      other.id !== appointment.id &&
      other.organizationId === context.organizationId &&
      active(other.status) &&
      (other.professionalId === appointment.professionalId || other.roomId === targetRoomId) &&
      start < new Date(other.endsAt ?? other.startsAt) &&
      new Date(other.startsAt) < new Date(endsAt)
  );

  if (conflict) throw new Error("Este novo horário conflita com a agenda do profissional ou da sala.");

  appointment.startsAt = startsAt;
  appointment.endsAt = endsAt;
  if (input.roomId) appointment.roomId = input.roomId;
  appointment.status = "SCHEDULED";

  return appointment;
}

