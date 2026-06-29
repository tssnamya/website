"use server"

import { redirect } from "next/navigation"
import { loginSchema } from "@/lib/validations"
import {
  verifyCredentials,
  createSessionCookie,
  destroySessionCookie,
} from "@/lib/auth"
import type { ActionResult } from "@/lib/types"

export async function loginAction(input: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email and password." }
  }
  const admin = await verifyCredentials(parsed.data.email, parsed.data.password)
  if (!admin) {
    return { ok: false, error: "Invalid email or password." }
  }
  await createSessionCookie({ sub: admin.id, email: admin.email })
  return { ok: true, data: undefined }
}

export async function logoutAction(): Promise<void> {
  await destroySessionCookie()
  redirect("/admin/login")
}
