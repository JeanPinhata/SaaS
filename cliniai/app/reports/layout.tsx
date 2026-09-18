import { ClinicShell } from "@/components/clinic-shell";

export default async function ReportsLayout({ children }: { children: React.ReactNode }) {
  return <ClinicShell active="Relatórios">{children}</ClinicShell>;
}
