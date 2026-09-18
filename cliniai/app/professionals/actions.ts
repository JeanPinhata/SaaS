"use server";

import { revalidatePath } from "next/cache";
import { requireOrganizationContext } from "@/lib/auth";
import { requireRole } from "@/lib/authorization";
import { saveProfessional, saveRoom, saveService, saveSpecialty, updateRecordStatus } from "@/services/records";
import { ProfessionalSchema, RoomSchema, ServiceSchema, SpecialtySchema } from "@/validations/records";

export type CatalogState = { error?: string; success?: string };
const contextForCatalog = async () => requireRole(await requireOrganizationContext(), ["OWNER", "ADMIN", "MANAGER"]);
const form = (formData: FormData) => Object.fromEntries(formData);

export async function saveSpecialtyAction(_: CatalogState, formData: FormData): Promise<CatalogState> { const parsed = SpecialtySchema.safeParse(form(formData)); if (!parsed.success) return { error: "Informe uma especialidade válida." }; try { await saveSpecialty(await contextForCatalog(), parsed.data); revalidatePath("/professionals"); return { success: "Especialidade salva." }; } catch { return { error: "Não foi possível salvar." }; } }
export async function saveServiceAction(_: CatalogState, formData: FormData): Promise<CatalogState> { const parsed = ServiceSchema.safeParse(form(formData)); if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Confira os campos." }; try { await saveService(await contextForCatalog(), parsed.data); revalidatePath("/professionals"); return { success: "Serviço salvo." }; } catch { return { error: "Não foi possível salvar." }; } }
export async function saveRoomAction(_: CatalogState, formData: FormData): Promise<CatalogState> { const parsed = RoomSchema.safeParse(form(formData)); if (!parsed.success) return { error: "Informe os dados da sala." }; try { await saveRoom(await contextForCatalog(), parsed.data); revalidatePath("/professionals"); return { success: "Sala salva." }; } catch { return { error: "Não foi possível salvar." }; } }
export async function saveProfessionalAction(_: CatalogState, formData: FormData): Promise<CatalogState> { const parsed = ProfessionalSchema.safeParse(form(formData)); if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Confira os campos." }; try { await saveProfessional(await contextForCatalog(), parsed.data); revalidatePath("/professionals"); return { success: "Profissional salvo." }; } catch { return { error: "Não foi possível salvar." }; } }

export async function toggleRecordStatusAction(type: "specialty" | "professional" | "service" | "room", id: string, currentStatus: "ACTIVE" | "INACTIVE") {
  const context = await contextForCatalog();
  const nextStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  await updateRecordStatus(context, type, id, nextStatus);
  revalidatePath("/professionals");
}

