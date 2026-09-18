import { randomUUID } from "node:crypto";
import { demoDatabase } from "../database/demo-store";
import { assertTenantAccess, type OrganizationContext } from "../lib/authorization";
import type { Expense, FinancialSummary, Payment, PaymentStatus } from "../lib/types";

type Context = OrganizationContext;

const inTenant = <T extends { organizationId: string }>(records: T[], context: Context) =>
  records.filter((record) => record.organizationId === context.organizationId);

const byId = <T extends { id: string; organizationId: string }>(records: T[], id: string, context: Context) => {
  const record = records.find((candidate) => candidate.id === id);
  return record ? assertTenantAccess(context, record) : null;
};

export async function getFinancialSummary(context: Context): Promise<FinancialSummary> {
  const payments = inTenant(demoDatabase.payments, context);
  const expenses = inTenant(demoDatabase.expenses, context);

  const totalReceived = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPending = payments
    .filter((p) => p.status === "PENDING")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netBalance = totalReceived - totalExpenses;

  return {
    totalReceived,
    totalPending,
    totalExpenses,
    netBalance,
  };
}

export async function listPayments(context: Context, statusFilter?: PaymentStatus): Promise<Payment[]> {
  const payments = inTenant(demoDatabase.payments, context);
  return payments
    .filter((p) => !statusFilter || p.status === statusFilter)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listExpenses(context: Context): Promise<Expense[]> {
  const expenses = inTenant(demoDatabase.expenses, context);
  return expenses.sort((a, b) => b.dueDate.localeCompare(a.dueDate));
}

export async function markPaymentAsPaid(context: Context, paymentId: string, paymentMethod: string): Promise<Payment> {
  const payment = byId(demoDatabase.payments, paymentId, context);
  if (!payment) throw new Error("Pagamento não encontrado.");
  payment.status = "PAID";
  payment.paymentMethod = paymentMethod;
  payment.paidAt = new Date().toISOString();
  return payment;
}

export async function createExpense(
  context: Context,
  input: { description: string; category: string; amount: number; dueDate: string; isPaid?: boolean }
): Promise<Expense> {
  const expense: Expense = {
    id: `exp_${randomUUID().slice(0, 8)}`,
    organizationId: context.organizationId,
    description: input.description,
    category: input.category,
    amount: input.amount,
    dueDate: input.dueDate,
    paidAt: input.isPaid ? new Date().toISOString() : undefined,
    createdAt: new Date().toISOString(),
  };

  demoDatabase.expenses.push(expense);
  return expense;
}
