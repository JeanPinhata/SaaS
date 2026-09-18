import { DashboardView } from "@/components/dashboard-view";
import { requireOrganizationContext } from "@/lib/auth";
import { getDashboardData } from "@/services/dashboard";

export default async function DashboardPage() {
  const context = await requireOrganizationContext();
  return <DashboardView data={await getDashboardData(context)} />;
}
