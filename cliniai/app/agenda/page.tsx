import { AgendaView } from "@/components/agenda-view";
import { requireOrganizationContext } from "@/lib/auth";
import { listAppointments } from "@/services/appointments";
import { listPatients, listRecords } from "@/services/records";
import { todayInSaoPaulo } from "@/database/demo-store";
export const dynamic="force-dynamic";
export default async function AgendaPage({searchParams}:{searchParams:Promise<{date?:string}>}){const context=await requireOrganizationContext();const date=(await searchParams).date??todayInSaoPaulo();const [appointments,patients,records]=await Promise.all([listAppointments(context,date),listPatients(context),listRecords(context)]);return <AgendaView appointments={appointments} patients={patients} date={date} {...records}/>}
