"use server";

import { redirect } from "next/navigation";
import { registerTenant } from "@/lib/auth";
import { RegisterTenantSchema } from "@/validations/auth";

export type RegisterState = { error?: string };

export async function registerAction(_: RegisterState, formData: FormData): Promise<RegisterState> {
  const data = Object.fromEntries(formData);
  const parsed = RegisterTenantSchema.safeParse(data);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Confira os dados preenchidos." };
  }

  try {
    await registerTenant(parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível cadastrar a clínica." };
  }

  redirect("/dashboard");
}
