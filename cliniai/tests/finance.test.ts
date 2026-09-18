import { describe, expect, it } from "vitest";
import { assertTenantAccess, requireRole } from "../lib/authorization";
import { createExpense, getFinancialSummary, listExpenses, listPayments, markPaymentAsPaid } from "../services/finance";

const ownerContext = { userId: "user_ana_souza", organizationId: "org_clinica_vida", role: "OWNER" as const };
const foreignContext = { userId: "user_other", organizationId: "org_other_clinic", role: "OWNER" as const };

describe("finance module", () => {
  it("calculates financial summary correctly for the tenant", async () => {
    const summary = await getFinancialSummary(ownerContext);
    expect(summary.totalReceived).toBeGreaterThan(0);
    expect(summary.totalExpenses).toBeGreaterThan(0);
    expect(summary.netBalance).toBe(summary.totalReceived - summary.totalExpenses);
  });

  it("isolates payments and expenses between different clinics", async () => {
    const payments = await listPayments(foreignContext);
    const expenses = await listExpenses(foreignContext);
    expect(payments).toHaveLength(0);
    expect(expenses).toHaveLength(0);
  });

  it("marks a pending payment as paid", async () => {
    const payments = await listPayments(ownerContext, "PENDING");
    expect(payments.length).toBeGreaterThan(0);
    const pendingId = payments[0].id;

    const updated = await markPaymentAsPaid(ownerContext, pendingId, "PIX");
    expect(updated.status).toBe("PAID");
    expect(updated.paymentMethod).toBe("PIX");
    expect(updated.paidAt).toBeDefined();
  });

  it("creates an operational expense scoped to the tenant", async () => {
    const newExpense = await createExpense(ownerContext, {
      description: "Manutenção de Ar-condicionado",
      category: "Infraestrutura",
      amount: 450,
      dueDate: "2025-06-15",
      isPaid: true,
    });

    expect(newExpense.id).toBeDefined();
    expect(newExpense.organizationId).toBe("org_clinica_vida");
    expect(newExpense.amount).toBe(450);

    const allExpenses = await listExpenses(ownerContext);
    expect(allExpenses.some((e) => e.id === newExpense.id)).toBe(true);
  });

  it("rejects non-manager roles from recording expenses", () => {
    const doctorContext = { ...ownerContext, role: "DOCTOR" as const };
    expect(() => requireRole(doctorContext, ["OWNER", "ADMIN", "MANAGER"])).toThrow("Você não tem permissão");
  });
});
