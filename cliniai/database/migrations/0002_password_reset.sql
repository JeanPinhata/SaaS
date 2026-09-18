-- Migration: 0002_password_reset.sql
-- Tabela para gerenciamento seguro de tokens de redefinição de senha

create table if not exists password_reset_tokens (
  id uuid primary key,
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_password_reset_token_hash on password_reset_tokens(token_hash);
create index if not exists idx_password_reset_user_id on password_reset_tokens(user_id);
