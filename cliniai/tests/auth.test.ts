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

describe("password reset validation", () => {
  it("accepts valid email for password recovery request", async () => {
    const { ForgotPasswordSchema } = await import("../validations/auth");
    const parsed = ForgotPasswordSchema.safeParse({ email: "medico@clinica.com.br" });
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid email for password recovery request", async () => {
    const { ForgotPasswordSchema } = await import("../validations/auth");
    const parsed = ForgotPasswordSchema.safeParse({ email: "email-invalido" });
    expect(parsed.success).toBe(false);
  });

  it("accepts valid reset password payload with matching passwords", async () => {
    const { ResetPasswordSchema } = await import("../validations/auth");
    const parsed = ResetPasswordSchema.safeParse({
      token: "abcdef1234567890abcdef",
      password: "NovaSenhaForte2026",
      confirmPassword: "NovaSenhaForte2026",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects mismatched passwords during reset", async () => {
    const { ResetPasswordSchema } = await import("../validations/auth");
    const parsed = ResetPasswordSchema.safeParse({
      token: "abcdef1234567890abcdef",
      password: "NovaSenhaForte2026",
      confirmPassword: "OutraSenhaDiferente",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toBe("As senhas não coincidem.");
    }
  });

  it("rejects password shorter than 8 characters", async () => {
    const { ResetPasswordSchema } = await import("../validations/auth");
    const parsed = ResetPasswordSchema.safeParse({
      token: "abcdef1234567890abcdef",
      password: "12345",
      confirmPassword: "12345",
    });
    expect(parsed.success).toBe(false);
  });
});

