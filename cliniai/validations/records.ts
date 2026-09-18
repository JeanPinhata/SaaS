import { z } from "zod";

const optionalText = z.string().trim().max(180).optional().or(z.literal(""));

export const PatientSchema = z.object({
  id: z.string().optional(),
  fullName: z.string().trim().min(3, "Informe o nome completo.").max(120),
  phone: z.string().trim().min(8, "Informe um telefone válido.").max(24),
  email: z.string().trim().email("Informe um e-mail válido.").optional().or(z.literal("")),
  cpf: optionalText,
  insuranceName: optionalText,
});

export const SpecialtySchema = z.object({ id: z.string().optional(), name: z.string().trim().min(3).max(80) });
export const ServiceSchema = z.object({ id: z.string().optional(), name: z.string().trim().min(3).max(100), durationMinutes: z.coerce.number().int().min(5).max(480), price: z.coerce.number().min(0).max(999999) });
export const RoomSchema = z.object({ id: z.string().optional(), name: z.string().trim().min(3).max(80), description: optionalText });
export const ProfessionalSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(3, "Informe o nome completo.").max(120),
    specialty: z.string().trim().min(2, "Informe a especialidade.").max(80).optional(),
    specialtyId: z.string().optional(),
    registration: z.string().trim().min(3, "Informe o registro profissional.").max(80),
    phone: z.string().trim().min(8, "Informe um telefone válido.").max(24),
    email: z.string().trim().email("Informe um e-mail válido."),
  })
  .refine((data) => Boolean(data.specialty || data.specialtyId), {
    message: "Informe a especialidade.",
    path: ["specialty"],
  });

