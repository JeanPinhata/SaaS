import { demoDatabase, todayInSaoPaulo } from "../database/demo-store";
import { getDbPool } from "../lib/db";
import { toUUID } from "../lib/uuid";
import type { DashboardData, Role } from "../lib/types";

const roleLabels: Record<string, string> = {
  OWNER: "Administradora",
  ADMIN: "Administradora",
  MANAGER: "Gerente",
  DOCTOR: "Médica",
  SECRETARY: "Recepcionista",
};

/**
 * Repository-shaped read model. Its input is always server-verified tenant
 * context; it deliberately has no browser-provided organization parameter.
 */
export async function getDashboardData(input: {
  organizationId: string;
  userId: string;
  role?: Role;
  name?: string;
  organizationName?: string;
}): Promise<DashboardData> {
  const pool = getDbPool();

  let userFullName = input.name;
  let userRole = input.role ? (roleLabels[input.role] || "Administradora") : undefined;
  let organizationName = input.organizationName;

  if (pool) {
    try {
      const memRes = await pool.query(
        `SELECT m.role, u.name as user_name, o.name as org_name
         FROM memberships m
         JOIN users u ON u.id = m.user_id
         JOIN organizations o ON o.id = m.organization_id
         WHERE m.user_id = $1 AND m.organization_id = $2`,
        [toUUID(input.userId), toUUID(input.organizationId)]
      );

      if (memRes.rows.length > 0) {
        const row = memRes.rows[0];
        userFullName = row.user_name || userFullName;
        userRole = roleLabels[row.role] || userRole || "Administradora";
        organizationName = row.org_name || organizationName;

        const today = todayInSaoPaulo();
        const apptRes = await pool.query(
          `SELECT a.id, a.starts_at, a.status, p.full_name as patient_name, pr.name as professional_name, s.price as expected_amount
           FROM appointments a
           LEFT JOIN patients p ON p.id = a.patient_id
           LEFT JOIN professionals pr ON pr.id = a.professional_id
           LEFT JOIN services s ON s.id = a.service_id
           WHERE a.organization_id = $1 AND a.starts_at::text LIKE $2
           ORDER BY a.starts_at ASC`,
          [toUUID(input.organizationId), `${today}%`]
        );

        const todayAppointments = apptRes.rows.map((row) => ({
          id: row.id,
          organizationId: input.organizationId,
          patientName: row.patient_name || "Paciente",
          professionalName: row.professional_name || "Profissional",
          startsAt: row.starts_at ? new Date(row.starts_at).toISOString() : new Date().toISOString(),
          status: row.status,
          expectedAmount: Number(row.expected_amount) || 0,
        }));

        const confirmed = todayAppointments.filter((a) => a.status === "CONFIRMED");
        const pending = todayAppointments.filter((a) => a.status === "WAITING_CONFIRMATION" || a.status === "SCHEDULED");

        return {
          userName: (userFullName || "Usuário").split(" ")[0],
          userFullName: userFullName || "Usuário",
          userRole: userRole || "Administradora",
          organizationName: organizationName || "Minha Clínica",
          appointmentCount: todayAppointments.length,
          confirmedCount: confirmed.length,
          pendingCount: pending.length,
          expectedRevenue: confirmed.reduce((sum, a) => sum + a.expectedAmount, 0),
          todaySchedule: todayAppointments.slice(0, 6),
          pendingConfirmationCount: pending.length,
          availableTomorrowCount: 0,
          waitingListCount: 0,
          weeklyRevenue: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Hoje"].map((label) => ({ label, value: 0 })),
        };
      }
    } catch (e: any) {
      if (e.message === "Tenant access denied") throw e;
    }
  }

  // Fallback demoDatabase
  const membership = demoDatabase.memberships.find(
    (m) => m.userId === input.userId && m.organizationId === input.organizationId
  );
  if (!membership) {
    throw new Error("Tenant access denied");
  }

  const today = todayInSaoPaulo();
  const todayAppointments = demoDatabase.appointments.filter(
    (appointment) => appointment.organizationId === input.organizationId && appointment.startsAt.startsWith(today)
  );
  const confirmed = todayAppointments.filter((appointment) => appointment.status === "CONFIRMED");
  const pending = todayAppointments.filter((appointment) => appointment.status === "WAITING_CONFIRMATION");
  const user = demoDatabase.users.find((candidate) => candidate.id === input.userId);

  if (!user && !userFullName) throw new Error("Authenticated user is unavailable in this organization");

  const resolvedFullName = userFullName || user?.name || "Usuário";
  const org = (demoDatabase as any).organizations?.find((o: any) => o.id === input.organizationId) ||
    (input.organizationId === demoDatabase.organization.id ? demoDatabase.organization : null);

  const orgName = organizationName || org?.name || "Minha Clínica";

  return {
    userName: resolvedFullName.split(" ")[0],
    userFullName: resolvedFullName,
    userRole: userRole || (membership ? roleLabels[membership.role] : "Administradora"),
    organizationName: orgName,
    appointmentCount: todayAppointments.length,
    confirmedCount: confirmed.length,
    pendingCount: pending.length,
    expectedRevenue: confirmed.reduce((sum, appointment) => sum + appointment.expectedAmount, 0),
    todaySchedule: todayAppointments.slice(0, 6),
    pendingConfirmationCount: pending.length,
    availableTomorrowCount: input.organizationId === demoDatabase.organization.id ? 2 : 0,
    waitingListCount: input.organizationId === demoDatabase.organization.id ? demoDatabase.waitingList.length : 0,
    weeklyRevenue: input.organizationId === demoDatabase.organization.id
      ? demoDatabase.weeklyRevenue.map((value, index) => ({ label: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Hoje"][index], value }))
      : ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Hoje"].map((label) => ({ label, value: 0 })),
  };
}

