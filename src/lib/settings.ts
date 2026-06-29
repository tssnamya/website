import { db } from "@/lib/db"
import type { AppSettings, PublicSettings } from "@/lib/types"

export const DEFAULT_SETTINGS: AppSettings = {
  businessName: process.env.NEXT_PUBLIC_STORE_NAME || "The Style Syndicate",
  whatsappNumber: (process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER || "").replace(/\D/g, ""),
  upiId: process.env.NEXT_PUBLIC_UPI_ID || "",
  paymentInstructions:
    "Pay the total amount to the UPI ID above and share a screenshot here on WhatsApp.",
  shippingCharge: 50,
  freeShippingThreshold: 999,
  reservationMinutes: 30,
  lowStockThreshold: 3,
  contactEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "",
  contactPhone: process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER || "",
  policySummary: "Size exchanges only. Returns and refunds are not available.",
  returnPolicy:
    "We offer size exchanges only. If an item does not fit, message us on WhatsApp within 3 days of delivery and we will arrange an exchange, subject to availability. Returns and refunds are not available. Items must be unworn, unwashed, and in their original condition with all tags intact.",
}

/** Reads the singleton settings row, falling back to env-derived defaults. */
export async function getSettings(): Promise<AppSettings> {
  const row = await db.settings.findUnique({ where: { id: "singleton" } })
  if (!row) return DEFAULT_SETTINGS
  return {
    businessName: row.businessName,
    whatsappNumber: row.whatsappNumber.replace(/\D/g, ""),
    upiId: row.upiId,
    paymentInstructions: row.paymentInstructions,
    shippingCharge: row.shippingCharge,
    freeShippingThreshold: row.freeShippingThreshold,
    reservationMinutes: row.reservationMinutes,
    lowStockThreshold: row.lowStockThreshold,
    contactEmail: row.contactEmail,
    contactPhone: row.contactPhone,
    policySummary: row.policySummary,
    returnPolicy: row.returnPolicy,
  }
}

export function toPublicSettings(s: AppSettings): PublicSettings {
  return {
    businessName: s.businessName,
    whatsappNumber: s.whatsappNumber,
    upiId: s.upiId,
    shippingCharge: s.shippingCharge,
    freeShippingThreshold: s.freeShippingThreshold,
    policySummary: s.policySummary,
  }
}

/** Shipping charge for a given items-subtotal under the configured rules. */
export function shippingFor(subtotal: number, s: {
  shippingCharge: number
  freeShippingThreshold: number
}): number {
  if (s.freeShippingThreshold > 0 && subtotal >= s.freeShippingThreshold) return 0
  return s.shippingCharge
}
