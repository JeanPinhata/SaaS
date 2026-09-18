"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, KeyRound } from "lucide-react";
import { forgotPasswordAction, type ForgotPasswordState } from "@/app/forgot-password/actions";

const initialState: ForgotPasswordState = {};

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, initialState);

  if (state.success) {
    return (
      <div style={{ display: "grid", gap: "16px", marginTop: "10px" }}>
        <div
          style={{
            padding: "16px",
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "10px",
            color: "#166534",
            fontSize: "13px",
            lineHeight: "1.5",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, marginBottom: "4px" }}>
            <CheckCircle2 size={18} color="#16a34a" /> Solicitação enviada!
          </div>
          {state.message}
        </div>

        {state.previewUrl ? (
          <div
            style={{
              padding: "12px",
              backgroundColor: "#eff6ff",
              border: "1px dashed #93c5fd",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#1e40af",
            }}
          >
            <strong>Ambiente Local / Demonstração:</strong>
            <div style={{ marginTop: "6px" }}>
              <Link
                href={state.previewUrl}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#2563eb",
                  fontWeight: 600,
                  textDecoration: "underline",
                }}
              >
                <KeyRound size={14} /> Abrir redefinição de senha com o token gerado
              </Link>
            </div>
          </div>
        ) : null}

        <Link
          href="/login"
          className="secondary-button"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            textDecoration: "none",
            marginTop: "8px",
          }}
        >
          <ArrowLeft size={16} /> Voltar para o Login
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="login-form">
      <label>
        E-mail da sua conta
        <input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="exemplo@clinica.com.br"
          required
        />
      </label>

      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}

      <button className="primary-button full" type="submit" disabled={pending}>
        {pending ? "Enviando instruções..." : "Enviar link de recuperação"}
      </button>

      <div style={{ marginTop: "12px", textAlign: "center" }}>
        <Link
          href="/login"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            color: "#61768c",
            fontSize: "12px",
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={14} /> Voltar para o login
        </Link>
      </div>
    </form>
  );
}
