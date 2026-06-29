"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { productSchema, inventoryUpdateSchema } from "@/lib/validations"
import { requireAdmin } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { SIZES, type ProductStatus, PRODUCT_STATUSES } from "@/lib/constants"
import { slugify } from "@/lib/format"
import type { ActionResult } from "@/lib/types"

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const root = base || "product"
  let candidate = root
  let n = 2
  for (let i = 0; i < 1000; i++) {
    const existing = await db.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    })
    if (!existing || existing.id === excludeId) return candidate
    candidate = `${root}-${n++}`
  }
  return `${root}-${Date.now()}`
}

function flatten(error: z.ZodError) {
  return z.flattenError(error).fieldErrors as Record<string, string[]>
}

function revalidateProductSurfaces(slug?: string) {
  revalidatePath("/")
  revalidatePath("/admin")
  revalidatePath("/admin/products")
  revalidatePath("/admin/inventory")
  if (slug) revalidatePath(`/product/${slug}`)
}

export async function createProduct(
  input: unknown,
): Promise<ActionResult<{ id: string; slug: string }>> {
  const session = await requireAdmin()
  const parsed = productSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "Please fix the form errors.", fieldErrors: flatten(parsed.error) }
  }
  const d = parsed.data
  const slug = await uniqueSlug(d.slug && d.slug.length ? d.slug : slugify(d.name))

  const product = await db.product.create({
    data: {
      name: d.name,
      slug,
      category: d.category,
      shortDescription: d.shortDescription ?? "",
      description: d.description ?? "",
      price: d.price,
      costPrice: d.costPrice ?? null,
      fabric: d.fabric ?? "",
      gsm: d.gsm ?? null,
      fitType: d.fitType ?? "",
      washInstructions: d.washInstructions ?? "",
      status: d.status,
      images: {
        create: d.images.map((img, i) => ({
          url: img.url,
          thumbnailUrl: img.thumbnailUrl ?? null,
          displayOrder: i,
        })),
      },
      inventory: { create: SIZES.map((s) => ({ size: s, stock: d.stock[s] })) },
    },
  })

  await logAudit({
    actorEmail: session.email,
    action: "PRODUCT_CREATED",
    entity: "PRODUCT",
    entityId: product.id,
    summary: `Created “${d.name}” (${d.status})`,
  })
  revalidateProductSurfaces(slug)
  return { ok: true, data: { id: product.id, slug } }
}

export async function updateProduct(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string; slug: string }>> {
  const session = await requireAdmin()
  const parsed = productSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "Please fix the form errors.", fieldErrors: flatten(parsed.error) }
  }
  const d = parsed.data

  const current = await db.product.findUnique({ where: { id }, select: { slug: true } })
  if (!current) return { ok: false, error: "Product not found." }

  const slug =
    d.slug && d.slug.length ? await uniqueSlug(d.slug, id) : current.slug

  await db.$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: {
        name: d.name,
        slug,
        category: d.category,
        shortDescription: d.shortDescription ?? "",
        description: d.description ?? "",
        price: d.price,
        costPrice: d.costPrice ?? null,
        fabric: d.fabric ?? "",
        gsm: d.gsm ?? null,
        fitType: d.fitType ?? "",
        washInstructions: d.washInstructions ?? "",
        status: d.status,
      },
    })

    await tx.productImage.deleteMany({ where: { productId: id } })
    if (d.images.length) {
      await tx.productImage.createMany({
        data: d.images.map((img, i) => ({
          productId: id,
          url: img.url,
          thumbnailUrl: img.thumbnailUrl ?? null,
          displayOrder: i,
        })),
      })
    }

    for (const s of SIZES) {
      await tx.productInventory.upsert({
        where: { productId_size: { productId: id, size: s } },
        update: { stock: d.stock[s] },
        create: { productId: id, size: s, stock: d.stock[s] },
      })
    }
  })

  await logAudit({
    actorEmail: session.email,
    action: "PRODUCT_UPDATED",
    entity: "PRODUCT",
    entityId: id,
    summary: `Updated “${d.name}”`,
  })
  revalidateProductSurfaces(slug)
  if (current.slug !== slug) revalidatePath(`/product/${current.slug}`)
  return { ok: true, data: { id, slug } }
}

/** Clone a product (images + details copied, inventory reset to 0, status DRAFT). */
export async function duplicateProduct(
  id: string,
): Promise<ActionResult<{ id: string; slug: string }>> {
  const session = await requireAdmin()
  const src = await db.product.findUnique({
    where: { id },
    include: { images: { orderBy: { displayOrder: "asc" } } },
  })
  if (!src) return { ok: false, error: "Product not found." }

  const slug = await uniqueSlug(`${src.slug}-copy`)
  const product = await db.product.create({
    data: {
      name: `${src.name} (Copy)`,
      slug,
      category: src.category,
      shortDescription: src.shortDescription,
      description: src.description,
      price: src.price,
      costPrice: src.costPrice,
      fabric: src.fabric,
      gsm: src.gsm,
      fitType: src.fitType,
      washInstructions: src.washInstructions,
      status: "DRAFT",
      images: {
        create: src.images.map((img, i) => ({
          url: img.url,
          thumbnailUrl: img.thumbnailUrl ?? null,
          displayOrder: i,
        })),
      },
      inventory: { create: SIZES.map((s) => ({ size: s, stock: 0 })) },
    },
  })

  await logAudit({
    actorEmail: session.email,
    action: "PRODUCT_DUPLICATED",
    entity: "PRODUCT",
    entityId: product.id,
    summary: `Duplicated “${src.name}” → draft`,
  })
  revalidateProductSurfaces(slug)
  return { ok: true, data: { id: product.id, slug } }
}

export async function setProductStatus(
  id: string,
  status: ProductStatus,
): Promise<ActionResult<{ status: ProductStatus }>> {
  const session = await requireAdmin()
  if (!PRODUCT_STATUSES.includes(status)) {
    return { ok: false, error: "Invalid status." }
  }
  const product = await db.product.findUnique({
    where: { id },
    select: { name: true, slug: true },
  })
  if (!product) return { ok: false, error: "Product not found." }

  await db.product.update({ where: { id }, data: { status } })
  await logAudit({
    actorEmail: session.email,
    action: "PRODUCT_STATUS_CHANGED",
    entity: "PRODUCT",
    entityId: id,
    summary: `“${product.name}” → ${status}`,
  })
  revalidateProductSurfaces(product.slug)
  return { ok: true, data: { status } }
}

export async function archiveProduct(id: string): Promise<ActionResult> {
  const session = await requireAdmin()
  const product = await db.product.findUnique({
    where: { id },
    select: { name: true, slug: true },
  })
  if (!product) return { ok: false, error: "Product not found." }
  await db.product.update({ where: { id }, data: { archivedAt: new Date() } })
  await logAudit({
    actorEmail: session.email,
    action: "PRODUCT_ARCHIVED",
    entity: "PRODUCT",
    entityId: id,
    summary: `Archived “${product.name}”`,
  })
  revalidateProductSurfaces(product.slug)
  return { ok: true, data: undefined }
}

export async function restoreProduct(id: string): Promise<ActionResult> {
  const session = await requireAdmin()
  const product = await db.product.findUnique({
    where: { id },
    select: { name: true, slug: true },
  })
  if (!product) return { ok: false, error: "Product not found." }
  await db.product.update({ where: { id }, data: { archivedAt: null } })
  await logAudit({
    actorEmail: session.email,
    action: "PRODUCT_RESTORED",
    entity: "PRODUCT",
    entityId: id,
    summary: `Restored “${product.name}”`,
  })
  revalidateProductSurfaces(product.slug)
  return { ok: true, data: undefined }
}

/**
 * Delete a product. If it is referenced by existing orders it is soft-deleted
 * (archived) instead, to preserve order history. Returns which path was taken.
 */
export async function deleteProduct(
  id: string,
): Promise<ActionResult<{ archived: boolean }>> {
  const session = await requireAdmin()
  const product = await db.product.findUnique({
    where: { id },
    select: { name: true, slug: true },
  })
  if (!product) return { ok: false, error: "Product not found." }

  const referenced = await db.orderItem.count({ where: { productId: id } })
  if (referenced > 0) {
    await db.product.update({ where: { id }, data: { archivedAt: new Date() } })
    await logAudit({
      actorEmail: session.email,
      action: "PRODUCT_ARCHIVED",
      entity: "PRODUCT",
      entityId: id,
      summary: `Archived “${product.name}” (referenced by ${referenced} order item(s))`,
    })
    revalidateProductSurfaces(product.slug)
    return { ok: true, data: { archived: true } }
  }

  await db.product.delete({ where: { id } })
  await logAudit({
    actorEmail: session.email,
    action: "PRODUCT_DELETED",
    entity: "PRODUCT",
    entityId: id,
    summary: `Deleted “${product.name}”`,
  })
  revalidateProductSurfaces(product.slug)
  return { ok: true, data: { archived: false } }
}

/** Inline inventory edit from the Inventory dashboard. */
export async function updateInventory(
  input: unknown,
): Promise<ActionResult> {
  const session = await requireAdmin()
  const parsed = inventoryUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: "Invalid stock values." }
  }
  const { productId, stock } = parsed.data
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { name: true, slug: true },
  })
  if (!product) return { ok: false, error: "Product not found." }

  await db.$transaction(
    SIZES.map((s) =>
      db.productInventory.upsert({
        where: { productId_size: { productId, size: s } },
        update: { stock: stock[s] },
        create: { productId, size: s, stock: stock[s] },
      }),
    ),
  )

  await logAudit({
    actorEmail: session.email,
    action: "INVENTORY_UPDATED",
    entity: "PRODUCT",
    entityId: productId,
    summary: `Stock set for “${product.name}” — M:${stock.M} L:${stock.L} XL:${stock.XL}`,
  })
  revalidateProductSurfaces(product.slug)
  return { ok: true, data: undefined }
}
