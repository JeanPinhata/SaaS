import { ClinicShell } from "@/components/clinic-shell";
export default async function AgendaLayout({ children }: { children: React.ReactNode }) { return <ClinicShell active="Agenda">{children}</ClinicShell>; }
