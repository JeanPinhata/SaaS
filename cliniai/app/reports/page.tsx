import { ReportsView } from "@/components/reports-view";
import { requireOrganizationContext } from "@/lib/auth";
import { getClinicalAnalytics } from "@/services/reports";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const context = await requireOrganizationContext();
  const analytics = await getClinicalAnalytics(context, "30d");

  return <ReportsView data={analytics} />;
}
