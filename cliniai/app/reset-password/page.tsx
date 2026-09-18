import { AlertCircle, HeartPulse, LockKeyhole, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { getSession } from "@/lib/auth";
import { validateResetToken } from "@/services/password-reset";

type Props = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: Props) {
  if (await getSession()) redirect("/dashboard");

  const params = await searchParams;
  const token = params.token;

  let validationError: string | null = null;
  if (!token) {
    validationError = "Link de recuperação incompleto. Nenhum token foi informado.";
  } else {
    const check = await validateResetToken(token);
    if (!check.valid) {
      validationError = check.error ?? "Este link de recuperação é inválido ou já expirou.";
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-brand">
        <div className="brand-mark large">
          <HeartPulse size={25} />
        </div>
        <p className="eyebrow">CLINIAI ACESSO</p>
        <h1>Crie uma nova senha de acesso.</h1>
        <p className="auth-copy">
          Escolha uma senha forte com pelo menos 8 caracteres para manter os dados dos seus pacientes e da sua clínica protegidos.
        </p>
        <div className="auth-feature">
          <ShieldCheck size={18} color="#21b575" /> Criptografia Bcrypt com Salt
        </div>
      </section>

      <section className="auth-card" aria-labelledby="reset-title">
        <div className="auth-icon red">
          <LockKeyhole size={20} color="#dc2626" />
        </div>
        <h2 id="reset-title">Nova Senha</h2>
        <p>Defina a nova senha para sua conta.</p>

        {validationError ? (
          <div style={{ display: "grid", gap: "16px", marginTop: "12px" }}>
            <div
              style={{
                padding: "16px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "10px",
                color: "#991b1b",
                fontSize: "13px",
                lineHeight: "1.5",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, marginBottom: "4px" }}>
                <AlertCircle size={18} color="#dc2626" /> Link Inválido ou Expirado
              </div>
              {validationError}
            </div>

            <Link
              href="/forgot-password"
              className="primary-button full"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
              }}
            >
              Solicitar novo link de recuperação
            </Link>

            <div style={{ textAlign: "center" }}>
              <Link href="/login" style={{ fontSize: "12px", color: "#61768c", textDecoration: "none" }}>
                Voltar para o Login
              </Link>
            </div>
          </div>
        ) : (
          <ResetPasswordForm token={token!} />
        )}
      </section>
    </main>
  );
}
