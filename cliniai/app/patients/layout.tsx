import { ClinicShell } from "@/components/clinic-shell";

export default async function PatientsLayout({ children }: { children: React.ReactNode }) { return <ClinicShell active="Pacientes">{children}</ClinicShell>; }
