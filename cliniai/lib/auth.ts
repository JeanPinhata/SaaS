import "server-only";

import { compare } from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { demoDatabase } from "@/database/demo-store";
import type { Role } from "@/lib/types";

const sessionCookie = "cliniai_session";
const getSecret = () => new TextEncoder().encode(process.env.AUTH_SECRET ?? "development-only-cliniai-session-secret-change-before-production");

type Session = { userId: string; organizationId: string; role: Role; name: string };

export async function authenticate(email: string, password: string): Promise<Session | null> {
  const user = demoDatabase.users.find((candidate) => candidate.email.toLowerCase() === email.toLowerCase());
  if (!user || !(await compare(password, user.passwordHash))) return null;

  const membership = demoDatabase.memberships.find((candidate) => candidate.userId === user.id && candidate.organizationId === demoDatabase.organization.id);
  if (!membership) return null;

  return { userId: user.id, organizationId: membership.organizationId, role: membership.role, name: user.name };
}

export async function createSession(session: Session) {
  const value = await new SignJWT(session)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecret());
  const store = await cookies();
  store.set(sessionCookie, value, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 8 });
}

export async function getSession(): Promise<Session | null> {
  const value = (await cookies()).get(sessionCookie)?.value;
  if (!value) return null;
  try {
    const { payload } = await jwtVerify(value, getSecret());
    if (typeof payload.userId !== "string" || typeof payload.organizationId !== "string" || typeof payload.role !== "string" || typeof payload.name !== "string") return null;
    return { userId: payload.userId, organizationId: payload.organizationId, role: payload.role as Role, name: payload.name };
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
