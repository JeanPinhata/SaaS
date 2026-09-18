import { randomUUID } from "node:crypto";
import { demoDatabase, todayInSaoPaulo } from "../database/demo-store";
import { assertTenantAccess, type OrganizationContext } from "../lib/authorization";
import { getDbPool } from "../lib/db";
import type { AppointmentStatus, DemoAppointment } from "../lib/types";
import { toUUID } from "../lib/uuid";

const active = (status: AppointmentStatus) => !["CANCELLED", "NO_SHOW"].includes(status);

const recordById = <T extends { id: string; organizationId: string }>(
  records: T[],
  id: string,
  context: OrganizationContext
) => {
  const record = records.find((item) => item.id === id);
  return record ? assertTenantAccess(context, record) : null;
};

export async function listAppointments(context: OrganizationContext, date = todayInSaoPaulo()) {
  const pool = getDbPool();
  if (pool) {
    try {
      const res = await pool.query(
        `SELECT a.id, a.organization_id as "organizationId", p.full_name as "patientName", pr.name as "professionalName",
                a.patient_id as "patientId", a.professional_id as "professionalId", a.service_id as "serviceId", a.room_id as "roomId",
                a.starts_at as "startsAt", a.ends_at as "endsAt", a.status, s.price::numeric::float as "expectedAmount"
         FROM appointments a
         JOIN patients p ON p.id = a.patient_id
         JOIN professionals pr ON pr.id = a.professional_id
         JOIN services s ON s.id = a.service_id
         WHERE a.organization_id = $1 AND a.starts_at::text LIKE $2
         ORDER BY a.starts_at ASC`,
        [toUUID(context.organizationId), `${date}%`]
      );
      if (res.rows.length > 0) {
        return res.rows.map((row: any) => ({
          ...row,
          expectedAmount: Number(row.expectedAmount || 0),
        }));
      }
      return [];
    } catch (e) {
      console.warn("DB listAppointments fallback:", e);
    }
  }

  return demoDatabase.appointments
    .filter((item) => item.organizationId === context.organizationId && item.startsAt.startsWith(date))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export async function createAppointment(
  context: OrganizationContext,
  input: { patientId: string; professionalId: string; serviceId: string; roomId: string; date: string; time: string }
) {
  const pool = getDbPool();
  const startsAt = `${input.date}T${input.time}:00-03:00`;
  const start = new Date(startsAt);

  if (pool) {
    try {
      const orgId = toUUID(context.organizationId);
      const [patRes, profRes, servRes, roomRes] = await Promise.all([
        pool.query(`SELECT id, full_name as "fullName", status FROM patients WHERE id = $1 AND organization_id = $2`, [toUUID(input.patientId), orgId]),
        pool.query(`SELECT id, name, status FROM professionals WHERE id = $1 AND organization_id = $2`, [toUUID(input.professionalId), orgId]),
        pool.query(`SELECT id, name, duration_minutes as "durationMinutes", price::numeric::float as "price", status FROM services WHERE id = $1 AND organization_id = $2`, [toUUID(input.serviceId), orgId]),
        pool.query(`SELECT id, name, status FROM rooms WHERE id = $1 AND organization_id = $2`, [toUUID(input.roomId), orgId]),
      ]);

      const patient = patRes.rows[0];
      const professional = profRes.rows[0];
      const service = servRes.rows[0];
      const room = roomRes.rows[0];

      if (patient && professional && service && room) {
        if (patient.status !== "ACTIVE" || professional.status !== "ACTIVE" || service.status !== "ACTIVE" || room.status !== "ACTIVE") {
          throw new Error("Selecione somente cadastros ativos.");
        }

        const endsAt = new Date(start.getTime() + Number(service.durationMinutes) * 60_000).toISOString();

        // Checagem de conflito de agenda no banco de dados
        const conflictRes = await pool.query(
          `SELECT id FROM appointments
           WHERE organization_id = $1
             AND status NOT IN ('CANCELLED', 'NO_SHOW')
             AND (professional_id = $2 OR room_id = $3)
             AND starts_at < $4
             AND ends_at > $5
           LIMIT 1`,
          [orgId, professional.id, room.id, endsAt, startsAt]
        );

        if (conflictRes.rows.length > 0) {
          throw new Error("Este horário conflita com a agenda do profissional ou da sala.");
        }

        const apptId = randomUUID();
        await pool.query(
          `INSERT INTO appointments (id, organization_id, patient_id, professional_id, service_id, room_id, starts_at, ends_at, status, source)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'SCHEDULED', 'MANUAL')`,
          [apptId, orgId, patient.id, professional.id, service.id, room.id, startsAt, endsAt]
        );

        const created: DemoAppointment = {
          id: apptId,
          organizationId: context.organizationId,
          patientId: patient.id,
          professionalId: professional.id,
          serviceId: service.id,
          roomId: room.id,
          patientName: patient.fullName,
          professionalName: professional.name,
          startsAt,
          endsAt,
          status: "SCHEDULED",
          expectedAmount: Number(service.price || 0),
        };

        return created;
      }
    } catch (e) {
      if (e instanceof Error && (e.message.includes("conflita") || e.message.includes("ativos") || e.message.includes("pertencem"))) {
        throw e;
      }
      console.warn("DB createAppointment error, checking fallback:", e);
    }
  }

  // Fallback demoDatabase
  const patient = recordById(demoDatabase.patients, input.patientId, context);
  const professional = recordById(demoDatabase.professionals, input.professionalId, context);
  const service = recordById(demoDatabase.services, input.serviceId, context);
  const room = recordById(demoDatabase.rooms, input.roomId, context);

  if (!patient || !professional || !service || !room) throw new Error("Os dados selecionados não pertencem à clínica.");
  if (patient.status !== "ACTIVE" || professional.status !== "ACTIVE" || service.status !== "ACTIVE" || room.status !== "ACTIVE")
    throw new Error("Selecione somente cadastros ativos.");

  const endsAt = new Date(start.getTime() + service.durationMinutes * 60_000).toISOString();

  const conflict = demoDatabase.appointments.some(
    (appointment) =>
      appointment.organizationId === context.organizationId &&
      active(appointment.status) &&
      (appointment.professionalId === professional.id || appointment.roomId === room.id) &&
      start < new Date(appointment.endsAt ?? appointment.startsAt) &&
      new Date(appointment.startsAt) < new Date(endsAt)
  );
  if (conflict) throw new Error("Este horário conflita com a agenda do profissional ou da sala.");

  const created: DemoAppointment = {
    id: randomUUID(),
    organizationId: context.organizationId,
    patientId: patient.id,
    professionalId: professional.id,
    serviceId: service.id,
    roomId: room.id,
    patientName: patient.fullName,
    professionalName: professional.name,
    startsAt,
    endsAt,
    status: "SCHEDULED",
    expectedAmount: service.price,
  };

  demoDatabase.appointments.push(created);
  return created;
}

export async function updateAppointmentStatus(context: OrganizationContext, id: string, status: AppointmentStatus) {
  const pool = getDbPool();
  if (pool) {
    try {
      const res = await pool.query(
        `UPDATE appointments SET status = $1, updated_at = now() WHERE id = $2 AND organization_id = $3 RETURNING id`,
        [status, toUUID(id), toUUID(context.organizationId)]
      );
      if (res.rows.length > 0) {
        return { id, status } as any;
      }
    } catch (e) {
      console.warn("DB updateAppointmentStatus fallback:", e);
    }
  }

  const appointment = recordById(demoDatabase.appointments, id, context);
  if (!appointment) throw new Error("Consulta não encontrada.");
  appointment.status = status;
  return appointment;
}

export async function rescheduleAppointment(
  context: OrganizationContext,
  appointmentId: string,
  input: { date: string; time: string; roomId?: string }
) {
  const pool = getDbPool();
  const startsAt = `${input.date}T${input.time}:00-03:00`;
  const start = new Date(startsAt);

  if (pool) {
    try {
      const orgId = toUUID(context.organizationId);
      const apptRes = await pool.query(
        `SELECT a.*, s.duration_minutes as "durationMinutes"
         FROM appointments a
         LEFT JOIN services s ON s.id = a.service_id
         WHERE a.id = $1 AND a.organization_id = $2`,
        [toUUID(appointmentId), orgId]
      );

      if (apptRes.rows.length > 0) {
        const appt = apptRes.rows[0];
        if (["CANCELLED", "COMPLETED", "NO_SHOW"].includes(appt.status)) {
          throw new Error("Não é possível reagendar uma consulta finalizada ou cancelada.");
        }

        const duration = Number(appt.durationMinutes || 30);
        const endsAt = new Date(start.getTime() + duration * 60_000).toISOString();
        const targetRoomId = input.roomId ? toUUID(input.roomId) : appt.room_id;

        // Checagem de conflitos no banco
        const conflictRes = await pool.query(
          `SELECT id FROM appointments
           WHERE organization_id = $1
             AND id != $2
             AND status NOT IN ('CANCELLED', 'NO_SHOW')
             AND (professional_id = $3 OR room_id = $4)
             AND starts_at < $5
             AND ends_at > $6
           LIMIT 1`,
          [orgId, toUUID(appointmentId), appt.professional_id, targetRoomId, endsAt, startsAt]
        );

        if (conflictRes.rows.length > 0) {
          throw new Error("Este novo horário conflita com a agenda do profissional ou da sala.");
        }

        await pool.query(
          `UPDATE appointments SET starts_at = $1, ends_at = $2, room_id = $3, status = 'SCHEDULED', updated_at = now()
           WHERE id = $4 AND organization_id = $5`,
          [startsAt, endsAt, targetRoomId, toUUID(appointmentId), orgId]
        );

        return {
          id: appointmentId,
          startsAt,
          endsAt,
          roomId: targetRoomId,
          status: "SCHEDULED",
        } as any;
      }
    } catch (e) {
      if (e instanceof Error && (e.message.includes("conflita") || e.message.includes("Não é possível"))) {
        throw e;
      }
      console.warn("DB rescheduleAppointment fallback:", e);
    }
  }

  // Fallback demoDatabase
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
