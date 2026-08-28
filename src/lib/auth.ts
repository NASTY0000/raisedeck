import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { COOKIE_NAME, SESSION_DAYS, type Role } from "./constants";
import { hashPassword, verifyPassword, hashToken, newToken } from "./password";
import type { User } from "@prisma/client";

export type SessionUser = Pick<User, "id" | "email" | "name" | "role">;
export { hashPassword, verifyPassword };

export async function createSession(userId: string) {
  const raw = newToken();
  const token = hashToken(raw);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { token, userId, expiresAt } });
  cookies().set(COOKIE_NAME, raw, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  return raw;
}

export async function destroySession() {
  const raw = cookies().get(COOKIE_NAME)?.value;
  if (raw) {
    await prisma.session.deleteMany({ where: { token: hashToken(raw) } });
  }
  cookies().set(COOKIE_NAME, "", { httpOnly: true, path: "/", expires: new Date(0) });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const raw = cookies().get(COOKIE_NAME)?.value;
  if (!raw) return null;
  const session = await prisma.session.findUnique({
    where: { token: hashToken(raw) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  const { id, email, name, role } = session.user;
  return { id, email, name, role };
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }
  return user;
}

export async function requireRole(...roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role as Role)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export function homeForRole(role: string) {
  if (role === "FOUNDER") return "/app";
  return "/invest";
}
