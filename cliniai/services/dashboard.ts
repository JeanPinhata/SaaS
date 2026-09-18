import { demoDatabase, todayInSaoPaulo } from "../database/demo-store";
import type { DashboardData } from "../lib/types";

/**
 * Repository-shaped read model. Its input is always server-verified tenant
 * context; it deliberately has no browser-provided organization parameter.
 */
export async function getDashboardData(input: { organizationId: string; userId: string; organizationName?: string }): Promise<DashboardData> {
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

  if (!user) throw new Error("Authenticated user is unavailable in this organization");

  const org = (demoDatabase as any).organizations?.find((o: any) => o.id === input.organizationId) ||
    (input.organizationId === demoDatabase.organization.id ? demoDatabase.organization : null);

  const orgName = input.organizationName || org?.name || "Minha Clínica";

  return {
    userName: user.name.split(" ")[0],
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

