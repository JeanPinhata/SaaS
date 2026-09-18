"use server";

import { revalidatePath } from "next/cache";
import { requireOrganizationContext } from "@/lib/auth";
import { requireRole } from "@/lib/authorization";
import { createExpense, markPaymentAsPaid } from "@/services/finance";
import { CreateExpenseSchema, MarkPaymentPaidSchema } from "@/validations/finance";

export type FinanceState = { error?: string; success?: string };

export async function createExpenseAction(_: FinanceState, formData: FormData): Promise<FinanceState> {
  const context = requireRole(await requireOrganizationContext(), ["OWNER", "ADMIN", "MANAGER"]);
  const parsed = CreateExpenseSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Confira os dados da despesa." };
  }

  try {
    await createExpense(context, parsed.data);
    revalidatePath("/finance");
    revalidatePath("/dashboard");
    return { success: "Despesa lançada com sucesso." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível registrar a despesa." };
  }
}

export async function markPaymentPaidAction(paymentId: string, paymentMethod: string) {
  const context = requireRole(await requireOrganizationContext(), ["OWNER", "ADMIN", "MANAGER", "SECRETARY"]);
  const parsed = MarkPaymentPaidSchema.safeParse({ paymentId, paymentMethod });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Dados inválidos");

  await markPaymentAsPaid(context, parsed.data.paymentId, parsed.data.paymentMethod);
  revalidatePath("/finance");
  revalidatePath("/dashboard");
}
