import { z } from "zod";

export const CreateExpenseSchema = z.object({
  description: z.string().trim().min(3, "Informe uma descrição válida.").max(120),
  category: z.string().trim().min(2, "Informe a categoria.").max(50),
  amount: z.coerce.number().positive("O valor deve ser maior que zero."),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe uma data válida no formato AAAA-MM-DD."),
  isPaid: z.preprocess((val) => val === "true" || val === "on" || val === true, z.boolean().optional()),
});

export const MarkPaymentPaidSchema = z.object({
  paymentId: z.string().min(1, "ID do pagamento obrigatório."),
  paymentMethod: z.string().trim().min(2, "Selecione o método de pagamento.").max(40),
});
