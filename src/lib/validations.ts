import { z } from "zod"
import { SIZES, MAX_QUANTITY_PER_ORDER, PRODUCT_STATUSES } from "@/lib/constants"

// ----- Admin login -----
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Please enter your password."),
})
export type LoginInput = z.infer<typeof loginSchema>

// ----- Checkout -----
// Note: only productId/size/quantity are trusted from the client. Price, name
// and stock are always re-read from the database on the server.
export const checkoutSchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your full name.").max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit mobile number."),
  email: z
    .union([
      z.string().trim().email("Please enter a valid email address."),
      z.literal(""),
    ])
    .optional(),
  houseFlat: z.string().trim().min(1, "Please enter your house or flat number.").max(120),
  street: z.string().trim().min(1, "Please enter your street or area.").max(160),
  landmark: z.string().trim().max(120).optional().or(z.literal("")),
  city: z.string().trim().min(1, "Please enter your city.").max(80),
  state: z.string().trim().min(1, "Please enter your state.").max(80),
  pincode: z
    .string()
    .trim()
    .regex(/^[1-9]\d{5}$/, "Please enter a valid 6-digit PIN code."),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  productId: z.string().min(1, "Please select a product."),
  size: z.enum(SIZES),
  quantity: z
    .number()
    .int()
    .min(1, "Please choose a quantity of at least 1.")
    .max(MAX_QUANTITY_PER_ORDER, `You can order up to ${MAX_QUANTITY_PER_ORDER} units per order.`),
})
export type CheckoutInput = z.infer<typeof checkoutSchema>

// The on-page form only collects customer + address fields. product/size/qty
// are supplied by the product page and re-validated server-side.
export const checkoutCustomerSchema = checkoutSchema.omit({
  productId: true,
  size: true,
  quantity: true,
})
export type CheckoutCustomerInput = z.infer<typeof checkoutCustomerSchema>

// ----- Admin product create/edit -----
const stockSchema = z.object({
  M: z.coerce.number().int().min(0).max(100000),
  L: z.coerce.number().int().min(0).max(100000),
  XL: z.coerce.number().int().min(0).max(100000),
})

// Empty string / null / undefined -> null; otherwise coerce to a positive int.
const optionalPositiveInt = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : v),
  z.coerce.number().int().min(0).max(10000000).nullable(),
)

// A garment measurement in inches (decimals allowed, e.g. 27.5). Optional.
const optionalMeasurement = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? null : v),
  z.coerce.number().min(0).max(200).nullable(),
)
const measurementSchema = z.object({
  chest: optionalMeasurement,
  shoulder: optionalMeasurement,
  length: optionalMeasurement,
})
const sizeChartSchema = z.object({
  M: measurementSchema,
  L: measurementSchema,
  XL: measurementSchema,
})

// Image references are uploaded files: an absolute URL (Cloudinary) or a
// site-relative path (local /uploads). No free-form URL pasting.
const uploadedImageRef = z
  .string()
  .trim()
  .min(1)
  .refine(
    (v) => /^https?:\/\//.test(v) || v.startsWith("/"),
    "Must be an uploaded image",
  )

const productImageSchema = z.object({
  url: uploadedImageRef,
  thumbnailUrl: z.string().trim().min(1).nullable().optional(),
})

export const productSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens only")
    .max(140)
    .optional()
    .or(z.literal("")),
  category: z.string().trim().min(1, "Category is required").max(60),
  shortDescription: z.string().trim().max(300).optional().default(""),
  description: z.string().trim().max(4000).optional().default(""),
  price: z.coerce.number().int().min(0, "Price must be >= 0").max(10000000),
  costPrice: optionalPositiveInt,
  fabric: z.string().trim().max(500).optional().default(""),
  gsm: optionalPositiveInt,
  fitType: z.string().trim().max(60).optional().default(""),
  washInstructions: z.string().trim().max(1000).optional().default(""),
  status: z.enum(PRODUCT_STATUSES),
  images: z.array(productImageSchema).max(12).default([]),
  stock: stockSchema,
  sizeChart: sizeChartSchema.optional(),
})
export type ProductInput = z.infer<typeof productSchema>

// Inline inventory edits from the Inventory dashboard.
export const inventoryUpdateSchema = z.object({
  productId: z.string().min(1),
  stock: stockSchema,
})
export type InventoryUpdateInput = z.infer<typeof inventoryUpdateSchema>

// ----- Business settings -----
export const settingsSchema = z.object({
  businessName: z.string().trim().min(1, "Required").max(120),
  whatsappNumber: z
    .string()
    .trim()
    .regex(/^\d{8,15}$/, "Digits only, including country code (e.g. 9198…)"),
  upiId: z.string().trim().max(120).optional().default(""),
  paymentInstructions: z.string().trim().max(1000).optional().default(""),
  shippingCharge: z.coerce.number().int().min(0).max(100000),
  freeShippingThreshold: z.coerce.number().int().min(0).max(10000000),
  reservationMinutes: z.coerce.number().int().min(1, "At least 1 minute").max(1440),
  lowStockThreshold: z.coerce.number().int().min(0).max(100000),
  contactEmail: z
    .union([z.string().trim().email("Please enter a valid email address."), z.literal("")])
    .optional(),
  contactPhone: z.string().trim().max(20).optional().default(""),
  policySummary: z.string().trim().min(1, "Please enter a short policy summary.").max(200),
  returnPolicy: z.string().trim().min(1, "Please enter your exchange and return policy.").max(5000),
})
export type SettingsInput = z.infer<typeof settingsSchema>
