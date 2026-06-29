import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const db = new PrismaClient()

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

type SeedProduct = {
  name: string
  category: string
  price: number
  costPrice: number
  shortDescription: string
  description: string
  fabric: string
  gsm: number
  fitType: string
  washInstructions: string
  images: string[]
  stock: { M: number; L: number; XL: number }
  status?: string
}

const PRODUCTS: SeedProduct[] = [
  {
    name: "Premium Black Polo",
    category: "Polo",
    price: 499,
    costPrice: 280,
    shortDescription: "Heavyweight combed-cotton pique polo in classic black.",
    description:
      "A wardrobe essential reimagined. Our signature black polo is cut from heavyweight combed cotton pique for structure that lasts wash after wash.",
    fabric: "100% combed cotton pique",
    gsm: 220,
    fitType: "Regular",
    washInstructions: "Machine wash cold. Do not bleach. Tumble dry low. Warm iron.",
    images: [
      "https://picsum.photos/seed/tss-blackpolo-1/900/1100",
      "https://picsum.photos/seed/tss-blackpolo-2/900/1100",
      "https://picsum.photos/seed/tss-blackpolo-3/900/1100",
    ],
    stock: { M: 12, L: 4, XL: 0 },
  },
  {
    name: "Heavyweight White Tee",
    category: "Round Neck",
    price: 399,
    costPrice: 210,
    shortDescription: "Boxy 240 GSM ringspun cotton tee with a structured collar.",
    description:
      "The perfect white tee — boxy fit, structured collar, and a buttery hand-feel that drapes beautifully.",
    fabric: "240 GSM ringspun cotton",
    gsm: 240,
    fitType: "Regular",
    washInstructions: "Machine wash cold inside out. Tumble dry low.",
    images: [
      "https://picsum.photos/seed/tss-whitetee-1/900/1100",
      "https://picsum.photos/seed/tss-whitetee-2/900/1100",
    ],
    stock: { M: 20, L: 15, XL: 8 },
  },
  {
    name: "Oversized Olive Drop-Shoulder",
    category: "Round Neck",
    price: 649,
    costPrice: 360,
    shortDescription: "Street-ready oversized drop-shoulder in French terry.",
    description:
      "Street-ready oversized silhouette with dropped shoulders and a relaxed, elevated drape.",
    fabric: "260 GSM French terry cotton",
    gsm: 260,
    fitType: "Oversized",
    washInstructions: "Cold wash only. Do not tumble dry. Line dry in shade.",
    images: [
      "https://picsum.photos/seed/tss-olive-1/900/1100",
      "https://picsum.photos/seed/tss-olive-2/900/1100",
    ],
    stock: { M: 6, L: 9, XL: 3 },
  },
  {
    name: "Classic Navy Henley",
    category: "Round Neck",
    price: 549,
    costPrice: 300,
    shortDescription: "Refined three-button henley in deep navy slub cotton.",
    description:
      "A refined three-button henley in deep navy slub cotton. Smart enough to layer, soft enough to live in.",
    fabric: "200 GSM slub cotton",
    gsm: 200,
    fitType: "Slim",
    washInstructions: "Gentle machine wash. Warm iron if needed.",
    images: [
      "https://picsum.photos/seed/tss-navy-1/900/1100",
      "https://picsum.photos/seed/tss-navy-2/900/1100",
    ],
    stock: { M: 2, L: 5, XL: 11 },
  },
  {
    name: "Charcoal Crew Neck",
    category: "Round Neck",
    price: 429,
    costPrice: 230,
    shortDescription: "Everyday charcoal crew with a clean ribbed collar.",
    description:
      "An everyday charcoal crew with a clean ribbed collar and a fit that flatters without clinging.",
    fabric: "220 GSM combed cotton",
    gsm: 220,
    fitType: "Regular",
    washInstructions: "Machine wash cold. Tumble dry low.",
    images: [
      "https://picsum.photos/seed/tss-charcoal-1/900/1100",
      "https://picsum.photos/seed/tss-charcoal-2/900/1100",
    ],
    stock: { M: 0, L: 0, XL: 0 },
  },
  {
    name: "Burgundy Striped Polo",
    category: "Polo",
    price: 599,
    costPrice: 330,
    shortDescription: "Burgundy & ecru stripes on premium pima cotton.",
    description:
      "Refined burgundy and ecru stripes on premium pima cotton. A standout that still plays well with everything.",
    fabric: "100% pima cotton",
    gsm: 210,
    fitType: "Regular",
    washInstructions: "Cold wash. Do not bleach. Cool iron.",
    images: [
      "https://picsum.photos/seed/tss-burgundy-1/900/1100",
      "https://picsum.photos/seed/tss-burgundy-2/900/1100",
    ],
    stock: { M: 7, L: 7, XL: 7 },
  },
]

async function main() {
  // --- Admin user ---
  const email = (process.env.ADMIN_EMAIL || "admin@thestylesyndicate.test")
    .toLowerCase()
    .trim()
  const password = process.env.ADMIN_PASSWORD || "admin123"
  const passwordHash = bcrypt.hashSync(password, 10)
  await db.adminUser.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  })
  console.log(`✓ Admin user ready: ${email}`)

  // --- Order counter ---
  await db.counter.upsert({
    where: { id: "order" },
    update: {},
    create: { id: "order", value: 0 },
  })
  console.log("✓ Order counter ready")

  // --- Business settings (initialised from env, then editable in /admin/settings) ---
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
    },
  })
  console.log("✓ Settings ready")

  // --- Products ---
  for (const p of PRODUCTS) {
    const slug = slugify(p.name)
    const data = {
      name: p.name,
      category: p.category,
      price: p.price,
      costPrice: p.costPrice,
      shortDescription: p.shortDescription,
      description: p.description,
      fabric: p.fabric,
      gsm: p.gsm,
      fitType: p.fitType,
      washInstructions: p.washInstructions,
      status: p.status ?? "ACTIVE",
    }
    const product = await db.product.upsert({
      where: { slug },
      update: data,
      create: { ...data, slug },
    })

    await db.productImage.deleteMany({ where: { productId: product.id } })
    await db.productImage.createMany({
      data: p.images.map((url, i) => ({
        productId: product.id,
        url,
        displayOrder: i,
      })),
    })

    for (const size of ["M", "L", "XL"] as const) {
      await db.productInventory.upsert({
        where: { productId_size: { productId: product.id, size } },
        update: { stock: p.stock[size] },
        create: { productId: product.id, size, stock: p.stock[size] },
      })
    }
    console.log(`✓ Product: ${p.name}`)
  }

  console.log("\nSeed complete.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
