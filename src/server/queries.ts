import { db } from "@/lib/db"
import { getSettings } from "@/lib/settings"
import {
  SIZES,
  LOW_STOCK_THRESHOLD,
  type Size,
  type PaymentStatus,
  type ShippingStatus,
  type ProductStatus,
} from "@/lib/constants"
import type {
  ShapedProduct,
  AdminOrderRow,
  DashboardStats,
  AuditEntry,
  AnalyticsData,
} from "@/lib/types"
import type { Prisma } from "@prisma/client"

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: { images: true; inventory: true }
}>

/** Active reservations grouped by `${productId}:${size}`. */
async function computeReservedMap(
  productIds?: string[],
): Promise<Record<string, number>> {
  const items = await db.orderItem.findMany({
    where: {
      ...(productIds ? { productId: { in: productIds } } : { productId: { not: null } }),
      order: {
        paymentStatus: "PENDING",
        cancelledAt: null,
        inventoryDeducted: false,
        reservationExpiresAt: { gt: new Date() },
      },
    },
    select: { productId: true, size: true, quantity: true },
  })
  const map: Record<string, number> = {}
  for (const it of items) {
    if (!it.productId) continue
    const key = `${it.productId}:${it.size}`
    map[key] = (map[key] ?? 0) + it.quantity
  }
  return map
}

function shapeProduct(
  p: ProductWithRelations,
  reservedMap: Record<string, number> = {},
): ShapedProduct {
  const stockBySize = Object.fromEntries(SIZES.map((s) => [s, 0])) as Record<Size, number>
  for (const inv of p.inventory) {
    if ((SIZES as readonly string[]).includes(inv.size)) {
      stockBySize[inv.size as Size] = inv.stock
    }
  }
  const reservedBySize = Object.fromEntries(
    SIZES.map((s) => [s, reservedMap[`${p.id}:${s}`] ?? 0]),
  ) as Record<Size, number>
  const availableBySize = Object.fromEntries(
    SIZES.map((s) => [s, Math.max(0, stockBySize[s] - reservedBySize[s])]),
  ) as Record<Size, number>

  const imageObjects = [...p.images]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((i) => ({ url: i.url, thumbnailUrl: i.thumbnailUrl ?? null }))
  const images = imageObjects.map((i) => i.url)
  const thumbnails = imageObjects.map((i) => i.thumbnailUrl ?? i.url)

  const totalStock = SIZES.reduce((s, k) => s + stockBySize[k], 0)
  const reservedTotal = SIZES.reduce((s, k) => s + reservedBySize[k], 0)
  const availableTotal = SIZES.reduce((s, k) => s + availableBySize[k], 0)
  const status = p.status as ProductStatus

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    category: p.category,
    shortDescription: p.shortDescription,
    description: p.description,
    fabric: p.fabric,
    gsm: p.gsm,
    fitType: p.fitType,
    washInstructions: p.washInstructions,
    price: p.price,
    costPrice: p.costPrice,
    status,
    archived: p.archivedAt !== null,
    isVisible: status === "ACTIVE" && p.archivedAt === null,
    images,
    imageObjects,
    thumbnails,
    primaryImage: images[0] ?? null,
    primaryThumbnail: thumbnails[0] ?? null,
    stockBySize,
    reservedBySize,
    availableBySize,
    sizes: SIZES.map((s) => ({ size: s, stock: stockBySize[s] })),
    totalStock,
    reservedTotal,
    availableTotal,
    createdAt: p.createdAt.toISOString(),
  }
}

// ---------- Customer-facing ----------

export type CatalogSort = "newest" | "price-asc" | "price-desc"
export interface CatalogParams {
  q?: string
  category?: string
  sort?: CatalogSort
}

export async function getCatalogProducts(
  params: CatalogParams = {},
): Promise<ShapedProduct[]> {
  const orderBy: Prisma.ProductOrderByWithRelationInput =
    params.sort === "price-asc"
      ? { price: "asc" }
      : params.sort === "price-desc"
        ? { price: "desc" }
        : { createdAt: "desc" }

  const products = await db.product.findMany({
    where: {
      status: "ACTIVE",
      archivedAt: null,
      ...(params.category && params.category !== "all" ? { category: params.category } : {}),
      ...(params.q ? { name: { contains: params.q } } : {}),
    },
    include: { images: true, inventory: true },
    orderBy,
  })
  const reserved = await computeReservedMap(products.map((p) => p.id))
  return products.map((p) => shapeProduct(p, reserved))
}

export async function getCategories(): Promise<string[]> {
  const rows = await db.product.findMany({
    where: { status: "ACTIVE", archivedAt: null },
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  })
  return rows.map((r) => r.category)
}

export async function getProductBySlug(slug: string): Promise<ShapedProduct | null> {
  const product = await db.product.findUnique({
    where: { slug },
    include: { images: true, inventory: true },
  })
  if (!product) return null
  const reserved = await computeReservedMap([product.id])
  return shapeProduct(product, reserved)
}

export async function getProductById(id: string): Promise<ShapedProduct | null> {
  const product = await db.product.findUnique({
    where: { id },
    include: { images: true, inventory: true },
  })
  if (!product) return null
  const reserved = await computeReservedMap([product.id])
  return shapeProduct(product, reserved)
}

// ---------- Admin: products & inventory ----------

export interface AdminProductFilter {
  q?: string
  category?: string
  status?: ProductStatus
  includeArchived?: boolean
}

export async function getAllProductsForAdmin(
  filter: AdminProductFilter = {},
): Promise<ShapedProduct[]> {
  const products = await db.product.findMany({
    where: {
      ...(filter.includeArchived ? {} : { archivedAt: null }),
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.category && filter.category !== "all" ? { category: filter.category } : {}),
      ...(filter.q ? { name: { contains: filter.q } } : {}),
    },
    include: { images: true, inventory: true },
    orderBy: { createdAt: "desc" },
  })
  const reserved = await computeReservedMap(products.map((p) => p.id))
  return products.map((p) => shapeProduct(p, reserved))
}

export async function getAdminCategories(): Promise<string[]> {
  const rows = await db.product.findMany({
    where: { archivedAt: null },
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  })
  return rows.map((r) => r.category)
}

// ---------- Admin: orders ----------

function formatAddress(o: {
  houseFlat: string
  street: string
  landmark: string | null
  city: string
  state: string
  pincode: string
}): string {
  return [o.houseFlat, o.street, o.landmark, `${o.city}, ${o.state} - ${o.pincode}`]
    .filter(Boolean)
    .join(", ")
}

type OrderWithItems = Prisma.OrderGetPayload<{ include: { items: true } }>

function shapeOrder(o: OrderWithItems): AdminOrderRow {
  const totalQuantity = o.items.reduce((s, it) => s + it.quantity, 0)
  const productSummary = o.items
    .map((it) => `${it.productName} (${it.size} ×${it.quantity})`)
    .join(", ")
  const reservationActive =
    o.paymentStatus === "PENDING" &&
    o.cancelledAt === null &&
    !o.inventoryDeducted &&
    o.reservationExpiresAt !== null &&
    o.reservationExpiresAt.getTime() > Date.now()

  return {
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: o.customerName,
    phone: o.phone,
    email: o.email,
    address: formatAddress(o),
    productSummary,
    totalQuantity,
    subtotal: o.subtotal,
    shippingCharge: o.shippingCharge,
    totalAmount: o.totalAmount,
    notes: o.notes,
    paymentStatus: o.paymentStatus as PaymentStatus,
    shippingStatus: o.shippingStatus as ShippingStatus,
    cancelled: o.cancelledAt !== null,
    reservationExpiresAt: o.reservationExpiresAt?.toISOString() ?? null,
    reservationActive,
    upiTransactionId: o.upiTransactionId,
    paymentVerifiedBy: o.paymentVerifiedBy,
    paymentVerifiedAt: o.paymentVerifiedAt?.toISOString() ?? null,
    adminNotes: o.adminNotes,
    createdAt: o.createdAt.toISOString(),
    items: o.items.map((it) => ({
      productId: it.productId,
      productName: it.productName,
      size: it.size,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      subtotal: it.subtotal,
    })),
  }
}

export interface OrderFilter {
  payment?: PaymentStatus
  shipping?: ShippingStatus
  q?: string
  dateFrom?: string
  dateTo?: string
}

export async function getOrders(filter: OrderFilter = {}): Promise<AdminOrderRow[]> {
  const orFilters: Prisma.OrderWhereInput[] = []
  if (filter.q) {
    orFilters.push({ customerName: { contains: filter.q } })
    orFilters.push({ phone: { contains: filter.q } })
    const numeric = Number(filter.q.replace(/[^0-9]/g, ""))
    if (Number.isInteger(numeric) && numeric > 0) orFilters.push({ orderNumber: numeric })
  }

  let createdAt: Prisma.DateTimeFilter | undefined
  if (filter.dateFrom || filter.dateTo) {
    createdAt = {}
    if (filter.dateFrom) createdAt.gte = new Date(filter.dateFrom)
    if (filter.dateTo) {
      const to = new Date(filter.dateTo)
      to.setHours(23, 59, 59, 999)
      createdAt.lte = to
    }
  }

  const orders = await db.order.findMany({
    where: {
      ...(filter.payment ? { paymentStatus: filter.payment } : {}),
      ...(filter.shipping ? { shippingStatus: filter.shipping } : {}),
      ...(orFilters.length ? { OR: orFilters } : {}),
      ...(createdAt ? { createdAt } : {}),
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  })
  return orders.map(shapeOrder)
}

export async function getRecentOrders(limit = 6): Promise<AdminOrderRow[]> {
  const orders = await db.order.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  })
  return orders.map(shapeOrder)
}

// ---------- Admin: dashboard, analytics & activity ----------

export async function getDashboardStats(): Promise<DashboardStats> {
  const settings = await getSettings()
  const threshold = settings.lowStockThreshold || LOW_STOCK_THRESHOLD

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const [
    totalProducts,
    activeProducts,
    totalOrders,
    todaysOrders,
    pendingOrders,
    paidOrders,
    cancelledOrders,
    revenueAgg,
  ] = await Promise.all([
    db.product.count({ where: { archivedAt: null } }),
    db.product.count({ where: { archivedAt: null, status: "ACTIVE" } }),
    db.order.count(),
    db.order.count({ where: { createdAt: { gte: startOfToday } } }),
    db.order.count({ where: { paymentStatus: "PENDING", cancelledAt: null } }),
    db.order.count({ where: { paymentStatus: "PAID" } }),
    db.order.count({ where: { cancelledAt: { not: null } } }),
    db.order.aggregate({
      _sum: { totalAmount: true },
      where: { paymentStatus: "PAID", cancelledAt: null },
    }),
  ])

  const inventory = await db.productInventory.findMany({
    where: { product: { archivedAt: null } },
    include: { product: { select: { id: true, name: true, slug: true } } },
  })

  const lowStock = inventory
    .filter((i) => i.stock > 0 && i.stock <= threshold)
    .map((i) => ({
      productName: i.product.name,
      slug: i.product.slug,
      productId: i.product.id,
      size: i.size,
      stock: i.stock,
    }))
    .sort((a, b) => a.stock - b.stock)

  const byProduct = new Map<string, { name: string; slug: string; id: string; total: number }>()
  for (const i of inventory) {
    const e = byProduct.get(i.product.id) ?? {
      name: i.product.name,
      slug: i.product.slug,
      id: i.product.id,
      total: 0,
    }
    e.total += i.stock
    byProduct.set(i.product.id, e)
  }
  const outOfStock = [...byProduct.values()]
    .filter((p) => p.total === 0)
    .map((p) => ({ productName: p.name, slug: p.slug, productId: p.id }))

  return {
    totalProducts,
    activeProducts,
    totalOrders,
    todaysOrders,
    pendingOrders,
    paidOrders,
    cancelledOrders,
    revenue: revenueAgg._sum.totalAmount ?? 0,
    lowStockCount: lowStock.length,
    outOfStockCount: outOfStock.length,
    lowStock,
    outOfStock,
  }
}

export async function getRecentActivity(limit = 8): Promise<AuditEntry[]> {
  const rows = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: limit })
  return rows.map((r) => ({
    id: r.id,
    actorEmail: r.actorEmail,
    action: r.action,
    entity: r.entity,
    entityId: r.entityId,
    summary: r.summary,
    createdAt: r.createdAt.toISOString(),
  }))
}

const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export async function getAnalytics(): Promise<AnalyticsData> {
  const settings = await getSettings()
  const threshold = settings.lowStockThreshold || LOW_STOCK_THRESHOLD
  const now = new Date()
  const startToday = new Date(now)
  startToday.setHours(0, 0, 0, 0)
  const startWeek = new Date(startToday)
  startWeek.setDate(startWeek.getDate() - 6)
  const startMonth = new Date(startToday)
  startMonth.setDate(startMonth.getDate() - 29)

  const paidWhere = { paymentStatus: "PAID", cancelledAt: null } as const

  const [revToday, revWeek, revMonth, revTotal] = await Promise.all([
    db.order.aggregate({ _sum: { totalAmount: true }, where: { ...paidWhere, paidAt: { gte: startToday } } }),
    db.order.aggregate({ _sum: { totalAmount: true }, where: { ...paidWhere, paidAt: { gte: startWeek } } }),
    db.order.aggregate({ _sum: { totalAmount: true }, where: { ...paidWhere, paidAt: { gte: startMonth } } }),
    db.order.aggregate({ _sum: { totalAmount: true }, where: paidWhere }),
  ])

  const [pending, paid, cancelled, delivered, totalOrders] = await Promise.all([
    db.order.count({ where: { paymentStatus: "PENDING", cancelledAt: null } }),
    db.order.count({ where: { paymentStatus: "PAID" } }),
    db.order.count({ where: { cancelledAt: { not: null } } }),
    db.order.count({ where: { shippingStatus: "DELIVERED" } }),
    db.order.count(),
  ])

  // Best seller / category / size from paid, non-cancelled order items.
  const paidItems = await db.orderItem.findMany({
    where: { order: { paymentStatus: "PAID", cancelledAt: null } },
    select: { productName: true, size: true, quantity: true, product: { select: { category: true } } },
  })
  const byName = new Map<string, number>()
  const byCategory = new Map<string, number>()
  const bySize = new Map<string, number>()
  for (const it of paidItems) {
    byName.set(it.productName, (byName.get(it.productName) ?? 0) + it.quantity)
    bySize.set(it.size, (bySize.get(it.size) ?? 0) + it.quantity)
    const cat = it.product?.category
    if (cat) byCategory.set(cat, (byCategory.get(cat) ?? 0) + it.quantity)
  }
  const top = (m: Map<string, number>) => {
    let best: [string, number] | null = null
    for (const e of m) if (!best || e[1] > best[1]) best = e
    return best
  }
  const bestSellerE = top(byName)
  const bestCategoryE = top(byCategory)
  const bestSizeE = top(bySize)

  // Customers (by phone, excluding cancelled).
  const custOrders = await db.order.findMany({
    where: { cancelledAt: null },
    select: { phone: true, createdAt: true },
  })
  const firstSeen = new Map<string, Date>()
  const counts = new Map<string, number>()
  for (const o of custOrders) {
    counts.set(o.phone, (counts.get(o.phone) ?? 0) + 1)
    const prev = firstSeen.get(o.phone)
    if (!prev || o.createdAt < prev) firstSeen.set(o.phone, o.createdAt)
  }
  const totalCustomers = counts.size
  let repeat = 0
  let newCustomers = 0
  for (const [phone, c] of counts) {
    if (c >= 2) repeat++
    const first = firstSeen.get(phone)!
    if (first >= startMonth) newCustomers++
  }

  // Revenue for the last 7 days, bucketed by paidAt.
  const paidLastWeek = await db.order.findMany({
    where: { ...paidWhere, paidAt: { gte: startWeek } },
    select: { paidAt: true, totalAmount: true },
  })
  const buckets: { date: string; label: string; revenue: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(startToday)
    d.setDate(d.getDate() - i)
    buckets.push({ date: d.toISOString().slice(0, 10), label: DAY[d.getDay()], revenue: 0 })
  }
  for (const o of paidLastWeek) {
    if (!o.paidAt) continue
    const key = new Date(o.paidAt)
    key.setHours(0, 0, 0, 0)
    const k = key.toISOString().slice(0, 10)
    const b = buckets.find((x) => x.date === k)
    if (b) b.revenue += o.totalAmount
  }

  // Inventory low/out counts (non-archived).
  const inventory = await db.productInventory.findMany({
    where: { product: { archivedAt: null } },
    include: { product: { select: { id: true } } },
  })
  const totalByProduct = new Map<string, number>()
  let lowStock = 0
  for (const i of inventory) {
    if (i.stock > 0 && i.stock <= threshold) lowStock++
    totalByProduct.set(i.product.id, (totalByProduct.get(i.product.id) ?? 0) + i.stock)
  }
  const outOfStock = [...totalByProduct.values()].filter((t) => t === 0).length

  return {
    revenue: {
      today: revToday._sum.totalAmount ?? 0,
      week: revWeek._sum.totalAmount ?? 0,
      month: revMonth._sum.totalAmount ?? 0,
      total: revTotal._sum.totalAmount ?? 0,
    },
    orders: { pending, paid, cancelled, delivered, total: totalOrders },
    inventory: { lowStock, outOfStock },
    bestSeller: bestSellerE ? { name: bestSellerE[0], qty: bestSellerE[1] } : null,
    bestCategory: bestCategoryE ? { name: bestCategoryE[0], qty: bestCategoryE[1] } : null,
    bestSize: bestSizeE ? { size: bestSizeE[0], qty: bestSizeE[1] } : null,
    customers: { total: totalCustomers, repeat, new: newCustomers },
    revenueByDay: buckets,
  }
}
