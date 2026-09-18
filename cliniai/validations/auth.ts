import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido."),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
});

export const RegisterTenantSchema = z.object({
  clinicName: z.string().trim().min(3, "O nome da clínica deve ter pelo menos 3 caracteres.").max(100),
  name: z.string().trim().min(3, "Informe seu nome completo.").max(100),
  email: z.string().trim().email("Informe um e-mail válido."),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.").max(100),
  phone: z.string().trim().optional(),
});
export const ForgotPasswordSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido."),
});

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(10, "Token de recuperação inválido."),
    password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.").max(100),
    confirmPassword: z.string().min(8, "Confirme sua senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });
