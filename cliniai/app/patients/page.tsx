import { PatientDirectory } from "@/components/patient-directory";
import { requireOrganizationContext } from "@/lib/auth";
import { listPatients } from "@/services/records";

export const dynamic = "force-dynamic";
export default async function PatientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) { const context = await requireOrganizationContext(); const query = (await searchParams).q ?? ""; return <PatientDirectory patients={await listPatients(context, query)} query={query}/>; }
