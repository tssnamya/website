import type {
  PaymentStatus,
  ShippingStatus,
  ProductStatus,
  Size,
} from "@/lib/constants"

/** Standard server-action return shape. */
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> }

export interface SizeStock {
  size: Size
  stock: number
}

/** Serializable product shape used across customer & admin UIs. */
export interface ShapedProduct {
  id: string
  name: string
  slug: string
  category: string
  shortDescription: string
  description: string
  fabric: string
  gsm: number | null
  fitType: string
  washInstructions: string
  price: number
  costPrice: number | null
  status: ProductStatus
  archived: boolean
  /** True only when the product should appear to customers. */
  isVisible: boolean
  images: string[]
  imageObjects: { url: string; thumbnailUrl: string | null }[]
  thumbnails: string[]
  primaryImage: string | null
  primaryThumbnail: string | null
  stockBySize: Record<Size, number> // physical
  reservedBySize: Record<Size, number>
  availableBySize: Record<Size, number> // physical - reserved (clamped >= 0)
  sizes: SizeStock[] // physical
  totalStock: number // physical
  reservedTotal: number
  availableTotal: number
  createdAt: string
}

export interface OrderLineItem {
  productId: string | null
  productName: string
  size: string
  quantity: number
  unitPrice: number
  subtotal: number
}

/** Returned to the client after a successful order. The WhatsApp link is built
 * server-side (using business settings) and returned ready to open. */
export interface CreatedOrder {
  orderNumber: number
  customerName: string
  items: OrderLineItem[]
  subtotal: number
  shippingCharge: number
  totalAmount: number
  notes: string | null
  waUrl: string
}

export interface AdminOrderRow {
  id: string
  orderNumber: number
  customerName: string
  phone: string
  email: string | null
  address: string
  productSummary: string
  totalQuantity: number
  subtotal: number
  shippingCharge: number
  totalAmount: number
  notes: string | null
  paymentStatus: PaymentStatus
  shippingStatus: ShippingStatus
  cancelled: boolean
  reservationExpiresAt: string | null
  reservationActive: boolean
  upiTransactionId: string | null
  paymentVerifiedBy: string | null
  paymentVerifiedAt: string | null
  adminNotes: string | null
  createdAt: string
  items: OrderLineItem[]
}

export interface AnalyticsData {
  revenue: { today: number; week: number; month: number; total: number }
  orders: {
    pending: number
    paid: number
    cancelled: number
    delivered: number
    total: number
  }
  inventory: { lowStock: number; outOfStock: number }
  bestSeller: { name: string; qty: number } | null
  bestCategory: { name: string; qty: number } | null
  bestSize: { size: string; qty: number } | null
  customers: { total: number; repeat: number; new: number }
  revenueByDay: { date: string; label: string; revenue: number }[]
}

export interface DashboardStats {
  totalProducts: number
  activeProducts: number
  totalOrders: number
  todaysOrders: number
  pendingOrders: number
  paidOrders: number
  cancelledOrders: number
  revenue: number
  lowStockCount: number
  outOfStockCount: number
  lowStock: {
    productName: string
    slug: string
    productId: string
    size: string
    stock: number
  }[]
  outOfStock: { productName: string; slug: string; productId: string }[]
}

export interface AuditEntry {
  id: string
  actorEmail: string
  action: string
  entity: string
  entityId: string | null
  summary: string
  createdAt: string
}

export interface AppSettings {
  businessName: string
  whatsappNumber: string
  upiId: string
  paymentInstructions: string
  shippingCharge: number
  freeShippingThreshold: number
  reservationMinutes: number
  lowStockThreshold: number
  contactEmail: string
  contactPhone: string
  policySummary: string
  returnPolicy: string
}

/** Browser-safe subset of settings passed to client components. */
export interface PublicSettings {
  businessName: string
  whatsappNumber: string
  upiId: string
  shippingCharge: number
  freeShippingThreshold: number
  policySummary: string
}

export interface ProductImageInput {
  url: string
  thumbnailUrl: string | null
}
