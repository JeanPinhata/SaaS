import { ClinicShell } from "@/components/clinic-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <ClinicShell active="Dashboard">{children}</ClinicShell>;
}
