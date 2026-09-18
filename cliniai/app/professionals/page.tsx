import { CatalogManager } from "@/components/catalog-manager";
import { requireOrganizationContext } from "@/lib/auth";
import { listRecords } from "@/services/records";

export const dynamic = "force-dynamic";
export default async function ProfessionalsPage() { return <CatalogManager {...await listRecords(await requireOrganizationContext())}/>; }
