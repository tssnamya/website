// Edge-safe session token utilities (jose only — no Node/Prisma imports), so
// this module can be used from middleware as well as server components.

import { SignJWT, jwtVerify } from "jose"

export const SESSION_COOKIE = "tss_admin"
const ALG = "HS256"
export const SESSION_MAX_AGE = 60 * 60 * 8 // 8 hours, in seconds

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET
  if (!s || s.length < 16) {
    throw new Error("AUTH_SECRET is missing or too short (need >= 16 chars).")
  }
  return new TextEncoder().encode(s)
}

export interface SessionPayload {
  sub: string // admin id
  email: string
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: ALG })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret())
}

export async function verifySession(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret())
    if (!payload.sub) return null
    return {
      sub: String(payload.sub),
      email: typeof payload.email === "string" ? payload.email : "",
    }
  } catch {
    return null
  }
}
