"use server";

import { createSession, authenticate } from "@/lib/auth";
import { LoginSchema } from "@/validations/auth";
import { redirect } from "next/navigation";

export type LoginState = { error?: string };

export async function loginAction(_: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Confira seus dados." };

  const session = await authenticate(parsed.data.email, parsed.data.password);
  if (!session) return { error: "E-mail ou senha inválidos." };

  await createSession(session);
  redirect("/dashboard");
}
