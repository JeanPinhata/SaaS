import { describe, expect, it } from "vitest";
import { RegisterTenantSchema } from "../validations/auth";

describe("tenant registration validation", () => {
  it("accepts a valid tenant registration payload", () => {
    const parsed = RegisterTenantSchema.safeParse({
      clinicName: "Clínica Nova Vida",
      name: "Dr. Roberto Carlos",
      email: "roberto@novavida.med.br",
      password: "MinhaSenhaForte2026",
      phone: "(11) 98888-7777",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects short clinic names or invalid emails", () => {
    const invalidEmail = RegisterTenantSchema.safeParse({
      clinicName: "Cl",
      name: "Dr. Roberto",
      email: "email-invalido",
      password: "123",
    });

    expect(invalidEmail.success).toBe(false);
    if (!invalidEmail.success) {
      expect(invalidEmail.error.issues.length).toBeGreaterThan(0);
    }
  });

  it("enforces minimum password length", () => {
    const shortPassword = RegisterTenantSchema.safeParse({
      clinicName: "Clínica Vida",
      name: "Dra. Ana",
      email: "ana@vida.com",
      password: "123",
    });

    expect(shortPassword.success).toBe(false);
  });
});
