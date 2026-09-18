import { HeartPulse, KeyRound, ShieldCheck } from "lucide-react";
import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { getSession } from "@/lib/auth";

export default async function ForgotPasswordPage() {
  if (await getSession()) redirect("/dashboard");

  return (
    <main className="auth-shell">
      <section className="auth-brand">
        <div className="brand-mark large">
          <HeartPulse size={25} />
        </div>
        <p className="eyebrow">CLINIAI SEGURANÇA</p>
        <h1>Recuperação segura de acesso.</h1>
        <p className="auth-copy">
          Informe seu e-mail cadastrado para receber um link de redefinição protegido com criptografia de ponta a ponta.
        </p>
        <div className="auth-feature">
          <ShieldCheck size={18} color="#21b575" /> Links protegidos com expiração automática
        </div>
      </section>

      <section className="auth-card" aria-labelledby="forgot-title">
        <div className="auth-icon">
          <KeyRound size={20} />
        </div>
        <h2 id="forgot-title">Recuperar Senha</h2>
        <p>Enviaremos as instruções de acesso para seu e-mail.</p>

        <ForgotPasswordForm />
      </section>
    </main>
  );
}
