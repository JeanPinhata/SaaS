"use server";

import { revalidatePath } from "next/cache";
import { requireOrganizationContext } from "@/lib/auth";
import { requireRole } from "@/lib/authorization";
import { savePatient, updatePatientStatus } from "@/services/records";
import { PatientSchema } from "@/validations/records";

export type RecordState = { error?: string; success?: string };

export async function savePatientAction(_: RecordState, formData: FormData): Promise<RecordState> {
  const context = requireRole(await requireOrganizationContext(), ["OWNER", "ADMIN", "MANAGER", "SECRETARY"]);
  const parsed = PatientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Confira os campos." };
  try { await savePatient(context, parsed.data); revalidatePath("/patients"); revalidatePath("/dashboard"); return { success: parsed.data.id ? "Paciente atualizado." : "Paciente cadastrado." }; } catch { return { error: "Não foi possível salvar o paciente." }; }
}

export async function togglePatientStatusAction(id: string, current: "ACTIVE" | "INACTIVE") {
  const context = requireRole(await requireOrganizationContext(), ["OWNER", "ADMIN", "MANAGER", "SECRETARY"]);
  await updatePatientStatus(context, id, current === "ACTIVE" ? "INACTIVE" : "ACTIVE");
  revalidatePath("/patients");
}
