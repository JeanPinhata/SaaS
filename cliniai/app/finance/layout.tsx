import { ClinicShell } from "@/components/clinic-shell";

export default async function FinanceLayout({ children }: { children: React.ReactNode }) {
  return <ClinicShell active="Financeiro">{children}</ClinicShell>;
}
