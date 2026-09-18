import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido."),
  password: z.string().min(12, "A senha precisa ter pelo menos 12 caracteres."),
});
