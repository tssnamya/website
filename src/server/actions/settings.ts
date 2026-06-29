"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { settingsSchema } from "@/lib/validations"
import { requireAdmin } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import type { ActionResult } from "@/lib/types"

export async function updateSettings(input: unknown): Promise<ActionResult> {
  const session = await requireAdmin()
  const parsed = settingsSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<
        string,
        string[]
      >,
    }
  }
  const d = parsed.data
  const data = {
    businessName: d.businessName,
    whatsappNumber: d.whatsappNumber,
    upiId: d.upiId ?? "",
    paymentInstructions: d.paymentInstructions ?? "",
    shippingCharge: d.shippingCharge,
    freeShippingThreshold: d.freeShippingThreshold,
    reservationMinutes: d.reservationMinutes,
    lowStockThreshold: d.lowStockThreshold,
    contactEmail: d.contactEmail ?? "",
    contactPhone: d.contactPhone ?? "",
    policySummary: d.policySummary,
    returnPolicy: d.returnPolicy,
  }

  await db.settings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  })

  await logAudit({
    actorEmail: session.email,
    action: "SETTINGS_CHANGED",
    entity: "SETTINGS",
    summary: "Updated business settings",
  })

  // Settings affect storefront pricing, header, checkout, policy and dashboards.
  revalidatePath("/")
  revalidatePath("/policies")
  revalidatePath("/admin")
  revalidatePath("/admin/settings")
  return { ok: true, data: undefined }
}
