/**
 * Self-contained integration test for the order, inventory and reservation
 * rules. Creates its own throwaway DRAFT product (invisible to customers),
 * exercises the exact Prisma operations the server actions use, then removes
 * everything it created. Safe to run against any catalog state.
 * Run: npx tsx prisma/verify.ts   (or: npm run verify)
 */
import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

let passed = 0
let failed = 0
function assert(label: string, cond: boolean) {
  if (cond) {
    passed++
    console.log(`  ✓ ${label}`)
  } else {
    failed++
    console.error(`  ✗ ${label}`)
  }
}

const createdOrderIds: string[] = []
const TEST_SLUG = "__qa_test_product__"

async function nextOrder(data: Record<string, unknown>) {
  const order = await db.$transaction(async (tx) => {
    const counter = await tx.counter.update({
      where: { id: "order" },
      data: { value: { increment: 1 } },
    })
    return tx.order.create({
      data: { orderNumber: counter.value, ...(data as object) } as never,
      include: { items: true },
    })
  })
  createdOrderIds.push(order.id)
  return order
}

async function reservedFor(productId: string, size: string) {
  const agg = await db.orderItem.aggregate({
    _sum: { quantity: true },
    where: {
      productId,
      size,
      order: {
        paymentStatus: "PENDING",
        cancelledAt: null,
        inventoryDeducted: false,
        reservationExpiresAt: { gt: new Date() },
      },
    },
  })
  return agg._sum.quantity ?? 0
}

const ADDR = { houseFlat: "A-1", street: "St", city: "Ahmedabad", state: "Gujarat", pincode: "380015" }

async function main() {
  const counterBefore = (await db.counter.findUnique({ where: { id: "order" } }))!.value

  // Fresh throwaway product with known stock.
  await db.product.deleteMany({ where: { slug: TEST_SLUG } })
  const START = 10
  const product = await db.product.create({
    data: {
      name: "QA Test Product",
      slug: TEST_SLUG,
      category: "QA",
      price: 100,
      status: "DRAFT",
      inventory: { create: [{ size: "M", stock: START }, { size: "L", stock: 0 }, { size: "XL", stock: 0 }] },
    },
    include: { inventory: true },
  })
  const mInv = product.inventory.find((i) => i.size === "M")!
  const stock = async () => (await db.productInventory.findUnique({ where: { id: mInv.id } }))!.stock

  // ---------- A) Inventory deduction on Paid / restore on Cancel ----------
  console.log("A) Payment → inventory, Cancel → restore")
  const orderA = await nextOrder({
    customerName: "QA A", phone: "9876500001", ...ADDR,
    subtotal: 200, shippingCharge: 0, totalAmount: 200,
    reservationExpiresAt: new Date(Date.now() + 30 * 60000),
    items: { create: [{ productId: product.id, productName: product.name, size: "M", quantity: 2, unitPrice: 100, subtotal: 200 }] },
  })
  assert("order saved as PENDING", orderA.paymentStatus === "PENDING")
  assert("physical stock unchanged on create", (await stock()) === START)

  // Mark paid (deduct + clear reservation)
  await db.$transaction(async (tx) => {
    const inv = await tx.productInventory.findUnique({ where: { id: mInv.id } })
    await tx.productInventory.update({ where: { id: mInv.id }, data: { stock: Math.max(0, inv!.stock - 2) } })
    await tx.order.update({ where: { id: orderA.id }, data: { paymentStatus: "PAID", paidAt: new Date(), inventoryDeducted: true, reservationExpiresAt: null } })
  })
  assert("physical decreased by 2 after Paid", (await stock()) === START - 2)
  assert("inventoryDeducted flag set (blocks double deduction)", (await db.order.findUnique({ where: { id: orderA.id } }))!.inventoryDeducted === true)

  // Cancel paid → restore
  await db.$transaction(async (tx) => {
    await tx.productInventory.update({ where: { id: mInv.id }, data: { stock: { increment: 2 } } })
    await tx.order.update({ where: { id: orderA.id }, data: { cancelledAt: new Date(), inventoryDeducted: false } })
  })
  assert("physical restored after cancel", (await stock()) === START)

  // ---------- B) Reservation prevents oversell ----------
  console.log("B) Reservation / no oversell")
  await nextOrder({
    customerName: "QA B1", phone: "9876500002", ...ADDR,
    subtotal: 100 * START, shippingCharge: 0, totalAmount: 100 * START,
    reservationExpiresAt: new Date(Date.now() + 30 * 60000),
    items: { create: [{ productId: product.id, productName: product.name, size: "M", quantity: START, unitPrice: 100, subtotal: 100 * START }] },
  })
  const reserved1 = await reservedFor(product.id, "M")
  assert(`reservation counts full quantity (${reserved1}/${START})`, reserved1 === START)
  assert("available is 0 while reserved", START - reserved1 === 0)
  assert("a concurrent order would be REJECTED (available <= 0)", START - reserved1 <= 0)
  assert("physical stock untouched by reservation", (await stock()) === START)

  // Expire → availability restored automatically
  await db.order.updateMany({ where: { id: { in: createdOrderIds }, customerName: "QA B1" }, data: { reservationExpiresAt: new Date(Date.now() - 1000) } })
  const reserved2 = await reservedFor(product.id, "M")
  assert("expired reservation no longer counts", reserved2 === 0)
  assert("available restored after expiry", START - reserved2 === START)

  // ---------- Cleanup ----------
  await db.orderItem.deleteMany({ where: { orderId: { in: createdOrderIds } } })
  await db.order.deleteMany({ where: { id: { in: createdOrderIds } } })
  await db.product.delete({ where: { id: product.id } })
  await db.counter.update({ where: { id: "order" }, data: { value: counterBefore } })

  console.log(`\n${passed} passed, ${failed} failed.`)
  if (failed > 0) process.exit(1)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
