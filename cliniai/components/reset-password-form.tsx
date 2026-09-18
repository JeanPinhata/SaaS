"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CheckCircle2, LockKeyhole } from "lucide-react";
import { resetPasswordAction, type ResetPasswordState } from "@/app/reset-password/actions";

const initialState: ResetPasswordState = {};

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, initialState);

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
            <CheckCircle2 size={18} color="#16a34a" /> Senha redefinida com sucesso!
          </div>
          Sua nova senha já está ativa. Você já pode acessar a operação da sua clínica normalmente.
        </div>

        <Link
          href="/login"
          className="primary-button full"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
            marginTop: "8px",
          }}
        >
          Ir para a tela de Login
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="login-form">
      <input type="hidden" name="token" value={token} />

      <label>
        Nova senha
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          required
          minLength={8}
        />
      </label>

      <label>
        Confirmar nova senha
        <input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Repita a nova senha"
          required
          minLength={8}
        />
      </label>

      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}

      <button className="primary-button full" type="submit" disabled={pending}>
        {pending ? "Atualizando..." : "Salvar nova senha"}
      </button>

      <div style={{ marginTop: "12px", textAlign: "center" }}>
        <Link
          href="/login"
          style={{
            color: "#61768c",
            fontSize: "12px",
            textDecoration: "none",
          }}
        >
          Cancelar e voltar ao login
        </Link>
      </div>
    </form>
  );
}
