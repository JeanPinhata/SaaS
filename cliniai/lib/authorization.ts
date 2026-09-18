import type { Role } from "@/lib/types";

export type OrganizationContext = { userId: string; organizationId: string; role: Role };

export function requireRole(context: OrganizationContext, allowedRoles: readonly Role[]) {
  if (!allowedRoles.includes(context.role)) {
    throw new Error("Você não tem permissão para executar esta ação.");
  }
  return context;
}

export function assertTenantAccess<T extends { organizationId: string }>(context: OrganizationContext, record: T): T {
  if (record.organizationId !== context.organizationId) {
    throw new Error("Tenant access denied");
  }
  return record;
}
