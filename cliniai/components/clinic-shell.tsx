import { AppSidebar } from "@/components/app-sidebar";
import { demoDatabase } from "@/database/demo-store";
import { requireOrganizationContext } from "@/lib/auth";

const roleLabels: Record<string, string> = {
  OWNER: "Administradora",
  ADMIN: "Administradora",
  MANAGER: "Gerente",
  DOCTOR: "Médica",
  SECRETARY: "Recepcionista",
};

export async function ClinicShell({ active, children }: { active: string; children: React.ReactNode }) {
  const context = await requireOrganizationContext();
  const orgName = context.organizationName || demoDatabase.organization.name;
  const userRole = roleLabels[context.role] || "Administradora";

  return (
    <div className="app-shell">
      <AppSidebar
        organizationName={orgName}
        userName={context.name}
        userRole={userRole}
        active={active}
      />
      {children}
    </div>
  );
}

