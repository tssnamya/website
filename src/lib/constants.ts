// Domain constants shared across client & server.

export const SIZES = ["M", "L", "XL"] as const
export type Size = (typeof SIZES)[number]

/** Stock at or below this (but > 0) is flagged "low stock". */
export const LOW_STOCK_THRESHOLD = 3

// ----- Product status & taxonomy -----
export const PRODUCT_STATUSES = ["ACTIVE", "INACTIVE", "DRAFT"] as const
export type ProductStatus = (typeof PRODUCT_STATUSES)[number]

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  DRAFT: "Draft",
}

/** Suggested categories (free-form input still allowed for future expansion). */
export const SUGGESTED_CATEGORIES = ["Polo", "Round Neck"] as const

export const FIT_TYPES = ["Regular", "Slim", "Oversized", "Relaxed"] as const

export type StockState = "out" | "low" | "healthy"

export function stockState(stock: number): StockState {
  if (stock <= 0) return "out"
  if (stock <= LOW_STOCK_THRESHOLD) return "low"
  return "healthy"
}

/** Max units a customer can order of a single size in one go (v1, no cart). */
export const MAX_QUANTITY_PER_ORDER = 20

export const PAYMENT_STATUSES = ["PENDING", "PAID"] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const SHIPPING_STATUSES = [
  "NOT_STARTED",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
] as const
export type ShippingStatus = (typeof SHIPPING_STATUSES)[number]

export const SHIPPING_STATUS_LABELS: Record<ShippingStatus, string> = {
  NOT_STARTED: "Not started",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pending",
  PAID: "Paid",
}

/** Forward-only shipping progression used to validate admin transitions. */
export const SHIPPING_FLOW: ShippingStatus[] = [
  "NOT_STARTED",
  "PACKED",
  "SHIPPED",
  "DELIVERED",
]
