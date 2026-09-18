import { FinanceView } from "@/components/finance-view";
import { requireOrganizationContext } from "@/lib/auth";
import { getFinancialSummary, listExpenses, listPayments } from "@/services/finance";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const context = await requireOrganizationContext();
  const [summary, payments, expenses] = await Promise.all([
    getFinancialSummary(context),
    listPayments(context),
    listExpenses(context),
  ]);

  return <FinanceView summary={summary} payments={payments} expenses={expenses} />;
}
