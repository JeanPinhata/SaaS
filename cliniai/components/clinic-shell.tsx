import { AppSidebar } from "@/components/app-sidebar";
import { demoDatabase } from "@/database/demo-store";
import { requireOrganizationContext } from "@/lib/auth";

export async function ClinicShell({ active, children }: { active: string; children: React.ReactNode }) {
  const context = await requireOrganizationContext();
  return <div className="app-shell"><AppSidebar organizationName={demoDatabase.organization.name} userName={context.name} active={active} />{children}</div>;
}
