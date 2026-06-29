/**
 * Production bootstrap — runs on every container start (idempotent).
 * Ensures the admin user, order counter, and settings row exist. It does NOT
 * add demo products and does NOT reset the admin password if it already exists.
 * Run: npm run db:bootstrap
 */
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const db = new PrismaClient()

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@thestylesyndicate.test")
    .toLowerCase()
    .trim()
  const password = process.env.ADMIN_PASSWORD || "admin123"

  // Create the admin only if missing (never overwrite an existing password).
  await db.adminUser.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash: bcrypt.hashSync(password, 10) },
  })

  await db.counter.upsert({
    where: { id: "order" },
    update: {},
    create: { id: "order", value: 0 },
  })

  // Seed the settings row from env on first run; never overwrite later edits.
  await db.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
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
      // policySummary & returnPolicy fall back to the schema defaults
    },
  })

  console.log(`Bootstrap complete — admin (${email}), counter, and settings ensured.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
