import { ClinicShell } from "@/components/clinic-shell";

export default async function ProfessionalsLayout({ children }: { children: React.ReactNode }) { return <ClinicShell active="Profissionais">{children}</ClinicShell>; }
