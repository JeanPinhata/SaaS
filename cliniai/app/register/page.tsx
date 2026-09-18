import { Building2, CheckCircle2, HeartPulse } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/register-form";
import { getSession } from "@/lib/auth";

export default async function RegisterPage() {
  if (await getSession()) redirect("/dashboard");

  return (
    <main className="auth-shell">
      <section className="auth-brand">
        <div className="brand-mark large">
          <HeartPulse size={25} />
        </div>
        <p className="eyebrow">CLINIAI SAAS</p>
        <h1>Cadastre sua clínica em menos de 1 minuto.</h1>
        <p className="auth-copy">
          Crie seu espaço exclusivo e comece a gerenciar agenda médica, prontuários, finanças e atendimentos com total isolamento e segurança.
        </p>
        <div style={{ display: "grid", gap: "10px", marginTop: "10px" }}>
          <div className="auth-feature">
            <CheckCircle2 size={18} color="#21b575" /> Banco de dados isolado e seguro
          </div>
          <div className="auth-feature">
            <CheckCircle2 size={18} color="#21b575" /> Agenda inteligente sem conflitos
          </div>
          <div className="auth-feature">
            <CheckCircle2 size={18} color="#21b575" /> Gestão financeira e prontuários
          </div>
        </div>
      </section>

      <section className="auth-card" aria-labelledby="register-title">
        <div className="auth-icon">
          <Building2 size={20} />
        </div>
        <h2 id="register-title">Criar nova clínica</h2>
        <p>Preencha os dados abaixo para criar seu tenant exclusivo.</p>

        <RegisterForm />

        <div style={{ marginTop: "20px", textAlign: "center", fontSize: "12px", color: "#61768c" }}>
          Já possui uma clínica cadastrada?{" "}
          <Link href="/login" style={{ color: "#2577f4", fontWeight: 700, textDecoration: "none" }}>
            Fazer login
          </Link>
        </div>
      </section>
    </main>
  );
}
