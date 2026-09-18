"use server";

import { requestPasswordReset } from "@/services/password-reset";
import { ForgotPasswordSchema } from "@/validations/auth";

export type ForgotPasswordState = {
  error?: string;
  success?: boolean;
  message?: string;
  previewUrl?: string;
};

export async function forgotPasswordAction(
  _: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const parsed = ForgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Informe um e-mail válido.",
    };
  }

  const result = await requestPasswordReset(parsed.data.email);
  return {
    success: true,
    message: result.message,
    previewUrl: result.previewUrl,
  };
}
