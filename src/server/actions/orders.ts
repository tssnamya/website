"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { checkoutSchema } from "@/lib/validations"
import { requireAdmin } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { orderCode } from "@/lib/format"
import { getSettings, shippingFor } from "@/lib/settings"
import { buildWhatsAppMessage, buildWhatsAppUrl } from "@/lib/whatsapp"
import { SHIPPING_STATUSES, type ShippingStatus } from "@/lib/constants"
import type { ActionResult, CreatedOrder } from "@/lib/types"

// Internal sentinel so insufficient-stock rolls back the reservation transaction.
class StockError extends Error {}

/**
 * Customer order creation with atomic stock reservation. The order is saved
 * BEFORE WhatsApp opens. Physical inventory is NOT deducted here — instead the
 * quantity is *reserved* (counts against availability) until payment is marked
 * Paid (deduct) or the reservation expires / order is cancelled (release).
 *
 * Concurrency: the single Counter row is updated first inside the transaction,
 * which takes a write/row lock and serialises concurrent checkouts on both
 * SQLite and Postgres — preventing oversell.
 */
export async function createOrder(input: unknown): Promise<ActionResult<CreatedOrder>> {
  const parsed = checkoutSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please correct the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    }
  }
  const d = parsed.data

  const product = await db.product.findUnique({
    where: { id: d.productId },
    include: { inventory: true },
  })
  if (!product || product.status !== "ACTIVE" || product.archivedAt) {
    return { ok: false, error: "This product is no longer available." }
  }

  const settings = await getSettings()
  const unitPrice = product.price
  const subtotal = unitPrice * d.quantity
  const shippingCharge = shippingFor(subtotal, settings)
  const total = subtotal + shippingCharge
  const reservationExpiresAt = new Date(Date.now() + settings.reservationMinutes * 60_000)

  await db.counter.upsert({
    where: { id: "order" },
    update: {},
    create: { id: "order", value: 0 },
  })

  let order
  try {
    order = await db.$transaction(async (tx) => {
      // Lock/serialise via the counter row first.
      const counter = await tx.counter.update({
        where: { id: "order" },
        data: { value: { increment: 1 } },
      })

      const inv = await tx.productInventory.findUnique({
        where: { productId_size: { productId: product.id, size: d.size } },
      })
      const physical = inv?.stock ?? 0
      const reservedAgg = await tx.orderItem.aggregate({
        _sum: { quantity: true },
        where: {
          productId: product.id,
          size: d.size,
          order: {
            paymentStatus: "PENDING",
            cancelledAt: null,
            inventoryDeducted: false,
            reservationExpiresAt: { gt: new Date() },
          },
        },
      })
      const available = physical - (reservedAgg._sum.quantity ?? 0)
      if (available <= 0) throw new StockError(`Size ${d.size} is out of stock.`)
      if (d.quantity > available) {
        throw new StockError(
          `Only ${available} unit(s) of size ${d.size} are available right now.`,
        )
      }

      return tx.order.create({
        data: {
          orderNumber: counter.value,
          customerName: d.fullName,
          phone: d.phone,
          email: d.email ? d.email : null,
          houseFlat: d.houseFlat,
          street: d.street,
          landmark: d.landmark ? d.landmark : null,
          city: d.city,
          state: d.state,
          pincode: d.pincode,
          notes: d.notes ? d.notes : null,
          subtotal,
          shippingCharge,
          totalAmount: total,
          reservationExpiresAt,
          items: {
            create: [
              {
                productId: product.id,
                productName: product.name,
                size: d.size,
                quantity: d.quantity,
                unitPrice,
                subtotal,
              },
            ],
          },
        },
        include: { items: true },
      })
    })
  } catch (e) {
    if (e instanceof StockError) return { ok: false, error: e.message }
    throw e
  }

  const message = buildWhatsAppMessage({
    orderNumber: order.orderNumber,
    storeName: settings.businessName,
    customerName: order.customerName,
    phone: order.phone,
    houseFlat: order.houseFlat,
    street: order.street,
    landmark: order.landmark,
    city: order.city,
    state: order.state,
    pincode: order.pincode,
    items: order.items.map((it) => ({
      productId: it.productId,
      productName: it.productName,
      size: it.size,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
    })),
    subtotal: order.subtotal,
    shippingCharge: order.shippingCharge,
    totalAmount: order.totalAmount,
    notes: order.notes,
  })
  const waUrl = buildWhatsAppUrl(settings.whatsappNumber, message)

  revalidatePath("/admin")
  revalidatePath("/admin/orders")
  revalidatePath("/")
  revalidatePath(`/product/${product.slug}`)

  return {
    ok: true,
    data: {
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      items: order.items.map((it) => ({
        productId: it.productId,
        productName: it.productName,
        size: it.size,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        subtotal: it.subtotal,
      })),
      subtotal: order.subtotal,
      shippingCharge: order.shippingCharge,
      totalAmount: order.totalAmount,
      notes: order.notes,
      waUrl,
    },
  }
}

// ---------------- Admin order lifecycle ----------------

function revalidateAdminOrders() {
  revalidatePath("/admin")
  revalidatePath("/admin/orders")
  revalidatePath("/admin/analytics")
  revalidatePath("/")
}

/** Mark Paid: deduct inventory once, clear the reservation, record verifier. */
export async function markOrderPaid(
  orderId: string,
  upiTransactionId?: string,
): Promise<ActionResult> {
  const session = await requireAdmin()

  const orderNumber = await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })
    if (!order) throw new Error("Order not found")
    if (order.cancelledAt) throw new Error("Cannot mark a cancelled order paid")
    if (order.paymentStatus === "PAID" && order.inventoryDeducted) return order.orderNumber

    if (!order.inventoryDeducted) {
      for (const it of order.items) {
        if (!it.productId) continue
        const inv = await tx.productInventory.findUnique({
          where: { productId_size: { productId: it.productId, size: it.size } },
        })
        if (inv) {
          await tx.productInventory.update({
            where: { id: inv.id },
            data: { stock: Math.max(0, inv.stock - it.quantity) },
          })
        }
      }
    }

    await tx.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "PAID",
        paidAt: new Date(),
        inventoryDeducted: true,
        reservationExpiresAt: null,
        paymentVerifiedBy: session.email,
        paymentVerifiedAt: new Date(),
        ...(upiTransactionId ? { upiTransactionId: upiTransactionId.trim() } : {}),
      },
    })
    return order.orderNumber
  })

  await logAudit({
    actorEmail: session.email,
    action: "PAYMENT_VERIFIED",
    entity: "ORDER",
    entityId: orderId,
    summary: `Verified payment for ${orderCode(orderNumber)} — inventory deducted${
      upiTransactionId ? ` (UPI ${upiTransactionId.trim()})` : ""
    }`,
  })
  revalidateAdminOrders()
  return { ok: true, data: undefined }
}

const paymentDetailsSchema = z.object({
  upiTransactionId: z.string().trim().max(100).optional().or(z.literal("")),
  adminNotes: z.string().trim().max(1000).optional().or(z.literal("")),
})

/** Edit payment-tracking fields (UPI txn id, internal notes) without changing status. */
export async function updateOrderPaymentDetails(
  orderId: string,
  input: unknown,
): Promise<ActionResult> {
  const session = await requireAdmin()
  const parsed = paymentDetailsSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "Invalid input." }
  const order = await db.order.findUnique({ where: { id: orderId } })
  if (!order) return { ok: false, error: "Order not found." }

  await db.order.update({
    where: { id: orderId },
    data: {
      upiTransactionId: parsed.data.upiTransactionId
        ? parsed.data.upiTransactionId
        : null,
      adminNotes: parsed.data.adminNotes ? parsed.data.adminNotes : null,
    },
  })
  await logAudit({
    actorEmail: session.email,
    action: "ORDER_DETAILS_UPDATED",
    entity: "ORDER",
    entityId: orderId,
    summary: `Updated payment details for ${orderCode(order.orderNumber)}`,
  })
  revalidateAdminOrders()
  return { ok: true, data: undefined }
}

export async function updateShippingStatus(
  orderId: string,
  status: ShippingStatus,
): Promise<ActionResult> {
  const session = await requireAdmin()
  if (!SHIPPING_STATUSES.includes(status)) {
    return { ok: false, error: "Invalid shipping status." }
  }
  const order = await db.order.findUnique({ where: { id: orderId } })
  if (!order) return { ok: false, error: "Order not found." }
  if (order.cancelledAt) return { ok: false, error: "Order is cancelled." }
  await db.order.update({ where: { id: orderId }, data: { shippingStatus: status } })
  await logAudit({
    actorEmail: session.email,
    action: "ORDER_SHIPPING_UPDATED",
    entity: "ORDER",
    entityId: orderId,
    summary: `${orderCode(order.orderNumber)} → ${status}`,
  })
  revalidateAdminOrders()
  return { ok: true, data: undefined }
}

/** Cancel: release any reservation immediately and restock if already deducted. */
export async function cancelOrder(orderId: string): Promise<ActionResult> {
  const session = await requireAdmin()

  const result = await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })
    if (!order) throw new Error("Order not found")
    if (order.cancelledAt) return { orderNumber: order.orderNumber, restocked: false }

    const restocked = order.inventoryDeducted
    if (restocked) {
      for (const it of order.items) {
        if (!it.productId) continue
        await tx.productInventory.updateMany({
          where: { productId: it.productId, size: it.size },
          data: { stock: { increment: it.quantity } },
        })
      }
    }

    await tx.order.update({
      where: { id: orderId },
      data: { cancelledAt: new Date(), inventoryDeducted: false, reservationExpiresAt: null },
    })
    return { orderNumber: order.orderNumber, restocked }
  })

  await logAudit({
    actorEmail: session.email,
    action: "ORDER_CANCELLED",
    entity: "ORDER",
    entityId: orderId,
    summary: `Cancelled ${orderCode(result.orderNumber)}${
      result.restocked ? " — inventory restored" : " — reservation released"
    }`,
  })
  revalidateAdminOrders()
  return { ok: true, data: undefined }
}
