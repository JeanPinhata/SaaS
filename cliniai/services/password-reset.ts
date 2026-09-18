import "server-only";

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { demoDatabase } from "@/database/demo-store";
import { getDbPool } from "@/lib/db";

export type ResetRequestResult = {
  success: boolean;
  message: string;
  previewUrl?: string;
};

export type ResetResult = {
  success: boolean;
  error?: string;
};

function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export async function requestPasswordReset(email: string): Promise<ResetRequestResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

  let foundUserId: string | null = null;
  let userName: string = "Usuário";

  const pool = getDbPool();
  if (pool) {
    try {
      const userRes = await pool.query("SELECT id, name FROM users WHERE LOWER(email) = $1 LIMIT 1", [normalizedEmail]);
      if (userRes.rows.length > 0) {
        foundUserId = userRes.rows[0].id;
        userName = userRes.rows[0].name;

        // Invalida tokens anteriores não usados para o mesmo usuário
        await pool.query(
          "UPDATE password_reset_tokens SET used_at = now() WHERE user_id = $1 AND used_at IS NULL",
          [foundUserId]
        );

        // Insere o novo token
        await pool.query(
          "INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at) VALUES ($1, $2, $3, $4)",
          [randomUUID(), foundUserId, tokenHash, expiresAt]
        );
      }
    } catch (error) {
      console.warn("Falha ao consultar banco para recuperação de senha, verificando demo store:", error);
    }
  }

  // Fallback demo store
  if (!foundUserId) {
    const demoUser = demoDatabase.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (demoUser) {
      foundUserId = demoUser.id;
      userName = demoUser.name;

      demoDatabase.passwordResetTokens = demoDatabase.passwordResetTokens.filter((t) => t.userId !== foundUserId);
      demoDatabase.passwordResetTokens.push({
        id: randomUUID(),
        userId: foundUserId,
        tokenHash,
        expiresAt,
      });
    }
  }

  // Se o usuário não existir, retornamos a mesma mensagem para segurança (anti-enumeração)
  if (!foundUserId) {
    return {
      success: true,
      message: "Se o e-mail estiver cadastrado, enviamos as instruções para redefinição de senha.",
    };
  }

  const relativeLink = `/reset-password?token=${rawToken}`;
  console.log(`🔑 [CliniAI] Link de recuperação gerado para ${userName} (${normalizedEmail}): ${relativeLink}`);

  // Se houver RESEND_API_KEY no ambiente, envia e-mail real
  if (process.env.RESEND_API_KEY) {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
      const fullLink = `${appUrl}${relativeLink}`;

      const sender = process.env.RESEND_FROM || "CliniAI <onboarding@resend.dev>";
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: sender,
          to: [normalizedEmail],
          subject: "Redefinição de Senha - CliniAI",
          html: `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #0d2137;">Redefinição de Senha</h2>
              <p>Olá, <strong>${userName}</strong>!</p>
              <p>Recebemos uma solicitação para redefinir a senha de acesso à sua clínica no CliniAI.</p>
              <p style="margin: 25px 0;">
                <a href="${fullLink}" style="background-color: #2577f4; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  Redefinir Minha Senha
                </a>
              </p>
              <p style="font-size: 12px; color: #64748b;">Este link é válido por 30 minutos. Se você não solicitou esta alteração, ignore este e-mail.</p>
            </div>
          `,
        }),
      });
    } catch (emailErr) {
      console.error("Erro ao enviar e-mail de recuperação via Resend:", emailErr);
    }
  }

  return {
    success: true,
    message: "Se o e-mail estiver cadastrado, enviamos as instruções para redefinição de senha.",
    // Em desenvolvimento ou ambiente de teste, fornece o previewUrl para facilitar
    previewUrl: process.env.NODE_ENV !== "production" ? relativeLink : undefined,
  };
}

export async function validateResetToken(rawToken: string): Promise<{ valid: boolean; error?: string; userId?: string }> {
  if (!rawToken || rawToken.trim().length < 10) {
    return { valid: false, error: "Token de recuperação inválido ou ausente." };
  }

  const tokenHash = hashToken(rawToken.trim());
  const now = new Date();

  const pool = getDbPool();
  if (pool) {
    try {
      const res = await pool.query(
        "SELECT id, user_id, expires_at, used_at FROM password_reset_tokens WHERE token_hash = $1 LIMIT 1",
        [tokenHash]
      );
      if (res.rows.length > 0) {
        const record = res.rows[0];
        if (record.used_at) {
          return { valid: false, error: "Este link de recuperação já foi utilizado." };
        }
        if (new Date(record.expires_at) < now) {
          return { valid: false, error: "Este link de recuperação expirou (validade de 30 minutos)." };
        }
        return { valid: true, userId: record.user_id };
      }
    } catch (err) {
      console.warn("Erro ao checar token no banco, buscando na demo store:", err);
    }
  }

  // Fallback demo store
  const record = demoDatabase.passwordResetTokens.find((t) => t.tokenHash === tokenHash);
  if (!record) {
    return { valid: false, error: "Link de recuperação não encontrado ou inválido." };
  }
  if (record.usedAt) {
    return { valid: false, error: "Este link de recuperação já foi utilizado." };
  }
  if (new Date(record.expiresAt) < now) {
    return { valid: false, error: "Este link de recuperação expirou (validade de 30 minutos)." };
  }

  return { valid: true, userId: record.userId };
}

export async function resetPasswordWithToken(rawToken: string, newPassword: string): Promise<ResetResult> {
  const check = await validateResetToken(rawToken);
  if (!check.valid || !check.userId) {
    return { success: false, error: check.error ?? "Token inválido ou expirado." };
  }

  const tokenHash = hashToken(rawToken.trim());
  const newPasswordHash = await hash(newPassword, 10);
  const now = new Date();

  const pool = getDbPool();
  if (pool) {
    try {
      await pool.query("BEGIN");
      await pool.query("UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2", [
        newPasswordHash,
        check.userId,
      ]);
      await pool.query("UPDATE password_reset_tokens SET used_at = now() WHERE token_hash = $1", [tokenHash]);
      await pool.query("COMMIT");
      return { success: true };
    } catch (err) {
      await pool.query("ROLLBACK").catch(() => {});
      console.error("Erro ao atualizar senha no banco:", err);
      return { success: false, error: "Erro ao atualizar sua senha no banco de dados. Tente novamente." };
    }
  }

  // Fallback demo store
  const demoUser = demoDatabase.users.find((u) => u.id === check.userId);
  if (demoUser) {
    demoUser.passwordHash = newPasswordHash;
  }
  const demoToken = demoDatabase.passwordResetTokens.find((t) => t.tokenHash === tokenHash);
  if (demoToken) {
    demoToken.usedAt = now;
  }

  return { success: true };
}
