"use server";
import { revalidatePath } from "next/cache";
import { requireOrganizationContext } from "@/lib/auth";
import { requireRole } from "@/lib/authorization";
import { createAppointment, rescheduleAppointment, updateAppointmentStatus } from "@/services/appointments";
import { CreateAppointmentSchema } from "@/validations/appointments";
import type { AppointmentStatus } from "@/lib/types";
export type AgendaState = { error?: string; success?: string };
export async function createAppointmentAction(_: AgendaState, formData: FormData): Promise<AgendaState> { const context = requireRole(await requireOrganizationContext(), ["OWNER", "ADMIN", "MANAGER", "SECRETARY"]); const parsed = CreateAppointmentSchema.safeParse(Object.fromEntries(formData)); if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Confira os campos." }; try { await createAppointment(context, parsed.data); revalidatePath("/agenda"); revalidatePath("/dashboard"); return { success: "Consulta agendada com sucesso." }; } catch (error) { return { error: error instanceof Error ? error.message : "Não foi possível agendar." }; } }
export async function setAppointmentStatusAction(id: string, status: AppointmentStatus) { const context = requireRole(await requireOrganizationContext(), ["OWNER", "ADMIN", "MANAGER", "SECRETARY", "DOCTOR"]); await updateAppointmentStatus(context, id, status); revalidatePath("/agenda"); revalidatePath("/dashboard"); }

export async function rescheduleAppointmentAction(_: AgendaState, formData: FormData): Promise<AgendaState> {
  const context = requireRole(await requireOrganizationContext(), ["OWNER", "ADMIN", "MANAGER", "SECRETARY"]);
  const data = Object.fromEntries(formData);
  const appointmentId = String(data.appointmentId);
  const date = String(data.date);
  const time = String(data.time);
  const roomId = data.roomId ? String(data.roomId) : undefined;

  if (!appointmentId || !date || !time) {
    return { error: "Informe a data e o horário para reagendar." };
  }

  try {
    await rescheduleAppointment(context, appointmentId, { date, time, roomId });
    revalidatePath("/agenda");
    revalidatePath("/dashboard");
    return { success: "Consulta reagendada com sucesso." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível reagendar." };
  }
}

