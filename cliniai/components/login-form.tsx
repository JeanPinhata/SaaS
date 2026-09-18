"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/login/actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initialState);
  return (
    <form action={action} className="login-form">
      <label>
        E-mail
        <input name="email" type="email" autoComplete="email" placeholder="admin@cliniai.demo" required />
      </label>
      <label>
        Senha
        <input name="password" type="password" autoComplete="current-password" placeholder="Sua senha" required minLength={12} />
      </label>
      {state.error ? <p className="form-error" role="alert">{state.error}</p> : null}
      <button className="primary-button full" type="submit" disabled={pending}>
        {pending ? "Entrando..." : "Entrar na clínica"}
      </button>
    </form>
  );
}
