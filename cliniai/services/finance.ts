import { randomUUID } from "node:crypto";
import { demoDatabase } from "../database/demo-store";
import { assertTenantAccess, type OrganizationContext } from "../lib/authorization";
import { getDbPool } from "../lib/db";
import type { Expense, FinancialSummary, Payment, PaymentStatus } from "../lib/types";
import { toUUID } from "../lib/uuid";

type Context = OrganizationContext;

const inTenant = <T extends { organizationId: string }>(records: T[], context: Context) =>
  records.filter((record) => record.organizationId === context.organizationId);

const byId = <T extends { id: string; organizationId: string }>(records: T[], id: string, context: Context) => {
  const record = records.find((candidate) => candidate.id === id);
  return record ? assertTenantAccess(context, record) : null;
};

export async function getFinancialSummary(context: Context): Promise<FinancialSummary> {
  const pool = getDbPool();
  if (pool) {
    try {
      const orgId = toUUID(context.organizationId);
      const [payRes, expRes] = await Promise.all([
        pool.query(
          `SELECT 
             COALESCE(SUM(amount) FILTER (WHERE status = 'PAID'), 0)::numeric::float as "totalReceived",
             COALESCE(SUM(amount) FILTER (WHERE status = 'PENDING'), 0)::numeric::float as "totalPending"
           FROM payments WHERE organization_id = $1`,
          [orgId]
        ),
        pool.query(
          `SELECT COALESCE(SUM(amount), 0)::numeric::float as "totalExpenses" FROM expenses WHERE organization_id = $1`,
          [orgId]
        ),
      ]);

      const totalReceived = payRes.rows[0]?.totalReceived || 0;
      const totalPending = payRes.rows[0]?.totalPending || 0;
      const totalExpenses = expRes.rows[0]?.totalExpenses || 0;

      if (totalReceived > 0 || totalPending > 0 || totalExpenses > 0) {
        return {
          totalReceived,
          totalPending,
          totalExpenses,
          netBalance: totalReceived - totalExpenses,
        };
      }
    } catch (e) {
      console.warn("DB getFinancialSummary fallback:", e);
    }
  }

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
  const pool = getDbPool();
  if (pool) {
    try {
      const orgId = toUUID(context.organizationId);
      const res = await pool.query(
        `SELECT p.id, p.organization_id as "organizationId", p.patient_id as "patientId",
                pat.full_name as "patientName", p.appointment_id as "appointmentId",
                p.amount::numeric::float as amount, p.status, p.payment_method as "paymentMethod",
                p.paid_at as "paidAt", p.created_at as "createdAt", p.notes
         FROM payments p
         JOIN patients pat ON pat.id = p.patient_id
         WHERE p.organization_id = $1 ${statusFilter ? "AND p.status = $2" : ""}
         ORDER BY p.created_at DESC`,
        statusFilter ? [orgId, statusFilter] : [orgId]
      );
      if (res.rows.length > 0) return res.rows;
    } catch (e) {
      console.warn("DB listPayments fallback:", e);
    }
  }

  const payments = inTenant(demoDatabase.payments, context);
  return payments
    .filter((p) => !statusFilter || p.status === statusFilter)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listExpenses(context: Context): Promise<Expense[]> {
  const pool = getDbPool();
  if (pool) {
    try {
      const orgId = toUUID(context.organizationId);
      const res = await pool.query(
        `SELECT id, organization_id as "organizationId", description, category,
                amount::numeric::float as amount, due_date::text as "dueDate",
                paid_at as "paidAt", created_at as "createdAt"
         FROM expenses
         WHERE organization_id = $1
         ORDER BY due_date DESC`,
        [orgId]
      );
      if (res.rows.length > 0) return res.rows;
    } catch (e) {
      console.warn("DB listExpenses fallback:", e);
    }
  }

  const expenses = inTenant(demoDatabase.expenses, context);
  return expenses.sort((a, b) => b.dueDate.localeCompare(a.dueDate));
}

export async function markPaymentAsPaid(context: Context, paymentId: string, paymentMethod: string): Promise<Payment> {
  const pool = getDbPool();
  if (pool) {
    try {
      await pool.query(
        `UPDATE payments SET status = 'PAID', payment_method = $1, paid_at = now(), updated_at = now()
         WHERE id = $2 AND organization_id = $3`,
        [paymentMethod, toUUID(paymentId), toUUID(context.organizationId)]
      );
    } catch (e) {
      console.warn("DB markPaymentAsPaid fallback:", e);
    }
  }

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
  const id = `exp_${randomUUID().slice(0, 8)}`;
  const expense: Expense = {
    id,
    organizationId: context.organizationId,
    description: input.description,
    category: input.category,
    amount: input.amount,
    dueDate: input.dueDate,
    paidAt: input.isPaid ? new Date().toISOString() : undefined,
    createdAt: new Date().toISOString(),
  };

  const pool = getDbPool();
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO expenses (id, organization_id, description, category, amount, due_date, paid_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          toUUID(id),
          toUUID(context.organizationId),
          input.description,
          input.category,
          input.amount,
          input.dueDate,
          input.isPaid ? new Date().toISOString() : null,
        ]
      );
    } catch (e) {
      console.warn("DB createExpense fallback:", e);
    }
  }

  demoDatabase.expenses.push(expense);
  return expense;
}
