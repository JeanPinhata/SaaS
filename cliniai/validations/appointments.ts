import { z } from "zod";

export const CreateAppointmentSchema = z.object({
  patientId: z.string().min(1, "Selecione um paciente."),
  professionalId: z.string().min(1, "Selecione um profissional."),
  serviceId: z.string().min(1, "Selecione um serviço."),
  roomId: z.string().min(1, "Selecione uma sala."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida."),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Informe um horário válido."),
});
