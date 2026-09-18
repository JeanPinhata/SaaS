import { Activity, HeartPulse, LockKeyhole } from "lucide-react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getSession } from "@/lib/auth";

export default async function LoginPage() {
  if (await getSession()) redirect("/dashboard");
  return (
    <main className="auth-shell">
      <section className="auth-brand">
        <div className="brand-mark large"><HeartPulse size={25} /></div>
        <p className="eyebrow">CLINIAI</p>
        <h1>A secretária inteligente da sua clínica.</h1>
        <p className="auth-copy">Agenda, pacientes, comunicação e operação em uma experiência simples e segura para sua equipe.</p>
        <div className="auth-feature"><Activity size={18} /> Visão operacional em tempo real</div>
      </section>
      <section className="auth-card" aria-labelledby="login-title">
        <div className="auth-icon"><LockKeyhole size={20} /></div>
        <h2 id="login-title">Boas-vindas</h2>
        <p>Acesse a operação da sua clínica.</p>
        <LoginForm />
        <aside className="demo-credentials">
          <strong>Ambiente de demonstração</strong>
          <span>admin@cliniai.demo · CliniAI!2026</span>
        </aside>
      </section>
    </main>
  );
}
