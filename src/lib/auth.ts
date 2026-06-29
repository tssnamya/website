// Server-side auth: credential verification + httpOnly session cookie handling.
// Uses bcryptjs (Node) so this must only be imported from server code.

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSession,
  verifySession,
  type SessionPayload,
} from "@/lib/session"

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifySession(token)
}

/** Use in admin server components/actions: redirects to login when unauthenticated. */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getSession()
  if (!session) redirect("/admin/login")
  return session
}

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<{ id: string; email: string } | null> {
  const admin = await db.adminUser.findUnique({
    where: { email: email.toLowerCase().trim() },
  })
  if (!admin) {
    // Run a dummy compare to keep timing roughly constant.
    await bcrypt.compare(password, "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidin")
    return null
  }
  const ok = await bcrypt.compare(password, admin.passwordHash)
  if (!ok) return null
  return { id: admin.id, email: admin.email }
}

export async function createSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await signSession(payload)
  const store = await cookies()
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  })
}

export async function destroySessionCookie(): Promise<void> {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10)
}
