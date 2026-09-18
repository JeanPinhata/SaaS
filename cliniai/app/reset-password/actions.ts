"use server";

import { resetPasswordWithToken } from "@/services/password-reset";
import { ResetPasswordSchema } from "@/validations/auth";

export type ResetPasswordState = {
  error?: string;
  success?: boolean;
};

export async function resetPasswordAction(
  _: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const parsed = ResetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const result = await resetPasswordWithToken(parsed.data.token, parsed.data.password);
  if (!result.success) {
    return {
      error: result.error ?? "Não foi possível redefinir sua senha.",
    };
  }

  return { success: true };
}
