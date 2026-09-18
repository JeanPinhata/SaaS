import { describe, expect, it } from "vitest";
import { assertTenantAccess, requireRole } from "../lib/authorization";
import { getDashboardData } from "../services/dashboard";
import { updatePatientStatus } from "../services/records";
import { createAppointment } from "../services/appointments";
import { todayInSaoPaulo } from "../database/demo-store";

const ownerContext = { userId: "user_ana_souza", organizationId: "org_clinica_vida", role: "OWNER" as const };

describe("tenant isolation", () => {
  it("allows a member to read only their own tenant dashboard", async () => {
    const dashboard = await getDashboardData(ownerContext);
    expect(dashboard.organizationName).toBe("Clínica Vida");
    expect(dashboard.appointmentCount).toBe(28);
    expect(dashboard.expectedRevenue).toBe(3840);
  });

  it("rejects a cross-tenant record even when its ID is known", () => {
    expect(() => assertTenantAccess(ownerContext, { organizationId: "org_other_clinic" })).toThrow("Tenant access denied");
  });

  it("rejects a request made with a mismatched organization context", async () => {
    await expect(getDashboardData({ ...ownerContext, organizationId: "org_other_clinic" })).rejects.toThrow("Tenant access denied");
  });

  it("centralizes role enforcement", () => {
    expect(() => requireRole({ ...ownerContext, role: "DOCTOR" }, ["OWNER", "ADMIN"])).toThrow("Você não tem permissão");
  });

  it("rejects a direct cross-tenant patient mutation", async () => {
    await expect(updatePatientStatus({ ...ownerContext, organizationId: "org_other_clinic" }, "patient_1", "INACTIVE")).rejects.toThrow("Tenant access denied");
  });

  it("rejects an overlapping professional or room booking at the service layer", async () => {
    await expect(createAppointment(ownerContext, { patientId: "patient_2", professionalId: "professional_1", serviceId: "service_1", roomId: "room_1", date: todayInSaoPaulo(), time: "08:00" })).rejects.toThrow("conflita");
  });
});
