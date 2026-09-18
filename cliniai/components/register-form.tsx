"use client";

import { useActionState } from "react";
import { registerAction, type RegisterState } from "@/app/register/actions";

const initialState: RegisterState = {};

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, initialState);

  return (
    <form action={action} className="login-form">
      <label>
        Nome da sua clínica ou consultório
        <input
          name="clinicName"
          type="text"
          placeholder="Ex.: Clínica Bem Estar"
          required
          minLength={3}
        />
      </label>

      <label>
        Seu nome completo (Administrador(a))
        <input
          name="name"
          type="text"
          placeholder="Ex.: Dra. Marina Souza"
          required
          minLength={3}
        />
      </label>

      <label>
        E-mail de acesso
        <input
          name="email"
          type="email"
          autoComplete="email"
          placeholder="contato@clinicabemestar.com.br"
          required
        />
      </label>

      <label>
        Telefone / WhatsApp (opcional)
        <input
          name="phone"
          type="tel"
          placeholder="(11) 98888-7777"
        />
      </label>

      <label>
        Crie uma senha de acesso
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
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
        {pending ? "Cadastrando clínica..." : "Criar clínica e acessar"}
      </button>
    </form>
  );
}
