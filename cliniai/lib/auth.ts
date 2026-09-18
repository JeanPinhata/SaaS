import "server-only";

import { randomUUID } from "node:crypto";
import { compare, hash } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { demoDatabase } from "@/database/demo-store";
import { getDbPool } from "@/lib/db";
import type { Role } from "@/lib/types";

const sessionCookie = "cliniai_session";
const getSecret = () =>
  new TextEncoder().encode(process.env.AUTH_SECRET ?? "development-only-cliniai-session-secret-change-before-production");

export type Session = {
  userId: string;
  organizationId: string;
  role: Role;
  name: string;
  organizationName?: string;
};

export async function authenticate(email: string, password: string): Promise<Session | null> {
  const pool = getDbPool();
  if (pool) {
    try {
      const userRes = await pool.query("SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [email]);
      if (userRes.rows.length > 0) {
        const user = userRes.rows[0];
        if (await compare(password, user.password_hash)) {
          const memRes = await pool.query(
            "SELECT m.*, o.name as org_name FROM memberships m JOIN organizations o ON o.id = m.organization_id WHERE m.user_id = $1 LIMIT 1",
            [user.id]
          );
          if (memRes.rows.length > 0) {
            const mem = memRes.rows[0];
            return {
              userId: user.id,
              organizationId: mem.organization_id,
              role: mem.role as Role,
              name: user.name,
              organizationName: mem.org_name,
            };
          }
        }
      }
    } catch (e) {
      console.warn("DB query failed during login, falling back to demo store:", e);
    }
  }

  // Fallback demo store
  const user = demoDatabase.users.find((candidate) => candidate.email.toLowerCase() === email.toLowerCase());
  if (!user || !(await compare(password, user.passwordHash))) return null;

  const membership = demoDatabase.memberships.find((candidate) => candidate.userId === user.id);
  if (!membership) return null;

  const demoOrg = (demoDatabase as any).organizations?.find((o: any) => o.id === membership.organizationId) ||
    (membership.organizationId === demoDatabase.organization.id ? demoDatabase.organization : null);

  return {
    userId: user.id,
    organizationId: membership.organizationId,
    role: membership.role,
    name: user.name,
    organizationName: demoOrg?.name || demoDatabase.organization.name,
  };
}

export async function registerTenant(input: {
  clinicName: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<Session> {
  const email = input.email.trim().toLowerCase();
  const passwordHash = await hash(input.password, 10);
  const orgId = randomUUID();
  const userId = randomUUID();
  const membershipId = randomUUID();
  const slug = `${input.clinicName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40)}-${randomUUID().slice(0, 6)}`;

  const pool = getDbPool();
  if (pool) {
    try {
      // Check existing email
      const existing = await pool.query("SELECT id FROM users WHERE LOWER(email) = $1", [email]);
      if (existing.rows.length > 0) {
        throw new Error("Este e-mail já está cadastrado.");
      }

      await pool.query("BEGIN");
      await pool.query(
        "INSERT INTO organizations (id, name, slug, phone, timezone, status) VALUES ($1, $2, $3, $4, 'America/Sao_Paulo', 'ACTIVE')",
        [orgId, input.clinicName, slug, input.phone || null]
      );
      await pool.query(
        "INSERT INTO users (id, name, email, password_hash, phone, status) VALUES ($1, $2, $3, $4, $5, 'ACTIVE')",
        [userId, input.name, email, passwordHash, input.phone || null]
      );
      await pool.query(
        "INSERT INTO memberships (id, organization_id, user_id, role, status) VALUES ($1, $2, $3, 'OWNER', 'ACTIVE')",
        [membershipId, orgId, userId]
      );
      await pool.query("COMMIT");
    } catch (err) {
      if (pool) await pool.query("ROLLBACK").catch(() => {});
      throw err;
    }
  }

  // Sincroniza em memória para caso a demo store seja consultada em dev
  demoDatabase.users.push({ id: userId, name: input.name, email, passwordHash });
  demoDatabase.memberships.push({ id: membershipId, organizationId: orgId, userId, role: "OWNER" });
  (demoDatabase as any).organizations = (demoDatabase as any).organizations || [];
  (demoDatabase as any).organizations.push({ id: orgId, name: input.clinicName, slug });

  const session: Session = {
    userId,
    organizationId: orgId,
    role: "OWNER",
    name: input.name,
    organizationName: input.clinicName,
  };

  await createSession(session);
  return session;
}

export async function createSession(session: Session) {
  const value = await new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecret());
  const store = await cookies();
  store.set(sessionCookie, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function getSession(): Promise<Session | null> {
  const value = (await cookies()).get(sessionCookie)?.value;
  if (!value) return null;
  try {
    const { payload } = await jwtVerify(value, getSecret());
    if (
      typeof payload.userId !== "string" ||
      typeof payload.organizationId !== "string" ||
      typeof payload.role !== "string" ||
      typeof payload.name !== "string"
    )
      return null;

    let orgName = typeof payload.organizationName === "string" ? payload.organizationName : undefined;

    // Se o cookie não tem o nome gravado (sessão anterior), consulta o banco ou demo
    if (!orgName) {
      const pool = getDbPool();
      if (pool) {
        try {
          const res = await pool.query("SELECT name FROM organizations WHERE id = $1", [payload.organizationId]);
          if (res.rows.length > 0) {
            orgName = res.rows[0].name;
          }
        } catch {
          // ignore error
        }
      }
      if (!orgName) {
        const demoOrg = (demoDatabase as any).organizations?.find((o: any) => o.id === payload.organizationId) ||
          (payload.organizationId === demoDatabase.organization.id ? demoDatabase.organization : null);
        orgName = demoOrg?.name || "Minha Clínica";
      }
    }

    return {
      userId: payload.userId,
      organizationId: payload.organizationId,
      role: payload.role as Role,
      name: payload.name,
      organizationName: orgName,
    };
  } catch {
    return null;
  }
}

export async function requireOrganizationContext() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function clearSession() {
  const store = await cookies();
  store.set(sessionCookie, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
}
