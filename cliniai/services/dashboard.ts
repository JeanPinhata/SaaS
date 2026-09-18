import { demoDatabase, todayInSaoPaulo } from "../database/demo-store";
import type { DashboardData } from "../lib/types";

/**
 * Repository-shaped read model. Its input is always server-verified tenant
 * context; it deliberately has no browser-provided organization parameter.
 */
export async function getDashboardData(input: { organizationId: string; userId: string }): Promise<DashboardData> {
  const { organization, users, appointments, waitingList, weeklyRevenue } = demoDatabase;
  if (input.organizationId !== organization.id) {
    throw new Error("Tenant access denied");
  }

  const today = todayInSaoPaulo();
  const todayAppointments = appointments.filter((appointment) => appointment.organizationId === input.organizationId && appointment.startsAt.startsWith(today));
  const confirmed = todayAppointments.filter((appointment) => appointment.status === "CONFIRMED");
  const pending = todayAppointments.filter((appointment) => appointment.status === "WAITING_CONFIRMATION");
  const user = users.find((candidate) => candidate.id === input.userId);

  if (!user) throw new Error("Authenticated user is unavailable in this organization");

  return {
    userName: user.name.split(" ")[0],
    organizationName: organization.name,
    appointmentCount: todayAppointments.length,
    confirmedCount: confirmed.length,
    pendingCount: pending.length,
    expectedRevenue: confirmed.reduce((sum, appointment) => sum + appointment.expectedAmount, 0),
    todaySchedule: todayAppointments.slice(0, 6),
    pendingConfirmationCount: pending.length,
    availableTomorrowCount: 2,
    waitingListCount: waitingList.length,
    weeklyRevenue: weeklyRevenue.map((value, index) => ({ label: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Hoje"][index], value })),
  };
}
