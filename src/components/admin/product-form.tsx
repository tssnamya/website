"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, useWatch } from "react-hook-form"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ImageManager } from "@/components/admin/image-manager"
import { createProduct, updateProduct } from "@/server/actions/products"
import {
  SIZES,
  PRODUCT_STATUSES,
  PRODUCT_STATUS_LABELS,
  SUGGESTED_CATEGORIES,
  FIT_TYPES,
  type ProductStatus,
} from "@/lib/constants"
import type { ShapedProduct, ProductImageInput } from "@/lib/types"

interface FormValues {
  name: string
  slug: string
  category: string
  shortDescription: string
  description: string
  price: string
  costPrice: string
  fabric: string
  gsm: string
  fitType: string
  washInstructions: string
  status: ProductStatus
  stockM: string
  stockL: string
  stockXL: string
}

export function ProductForm({
  product,
  categories,
}: {
  product?: ShapedProduct
  categories: string[]
}) {
  const router = useRouter()
  const isEdit = Boolean(product)
  const [images, setImages] = useState<ProductImageInput[]>(
    product?.imageObjects ?? [],
  )

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      name: product?.name ?? "",
      slug: product?.slug ?? "",
      category: product?.category ?? "",
      shortDescription: product?.shortDescription ?? "",
      description: product?.description ?? "",
      price: product ? String(product.price) : "",
      costPrice: product?.costPrice != null ? String(product.costPrice) : "",
      fabric: product?.fabric ?? "",
      gsm: product?.gsm != null ? String(product.gsm) : "",
      fitType: product?.fitType ?? "",
      washInstructions: product?.washInstructions ?? "",
      status: product?.status ?? "DRAFT",
      stockM: String(product?.stockBySize.M ?? 0),
      stockL: String(product?.stockBySize.L ?? 0),
      stockXL: String(product?.stockBySize.XL ?? 0),
    },
  })

  const status = useWatch({ control, name: "status" })
  const categoryOptions = Array.from(
    new Set([...SUGGESTED_CATEGORIES, ...categories]),
  )

  async function onSubmit(values: FormValues) {
    const payload = {
      name: values.name,
      slug: values.slug || undefined,
      category: values.category,
      shortDescription: values.shortDescription,
      description: values.description,
      price: values.price,
      costPrice: values.costPrice,
      fabric: values.fabric,
      gsm: values.gsm,
      fitType: values.fitType,
      washInstructions: values.washInstructions,
      status: values.status,
      images,
      stock: { M: values.stockM, L: values.stockL, XL: values.stockXL },
    }

    const res =
      isEdit && product
        ? await updateProduct(product.id, payload)
        : await createProduct(payload)

    if (!res.ok) {
      const map: Record<string, keyof FormValues> = {
        name: "name",
        slug: "slug",
        category: "category",
        shortDescription: "shortDescription",
        description: "description",
        price: "price",
        costPrice: "costPrice",
        fabric: "fabric",
        gsm: "gsm",
        fitType: "fitType",
        washInstructions: "washInstructions",
      }
      if (res.fieldErrors) {
        for (const [key, messages] of Object.entries(res.fieldErrors)) {
          const field = map[key]
          if (field && messages?.[0]) setError(field, { message: messages[0] })
        }
      }
      toast.error(res.error)
      return
    }

    toast.success(isEdit ? "Product updated successfully." : "Product created successfully.")
    router.push("/admin/products")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Basic information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">
                  Product name <span className="text-destructive">*</span>
                </Label>
                <Input id="name" {...register("name", { required: "Name is required" })} />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="category">
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="category"
                    list="category-options"
                    placeholder="Polo / Round Neck"
                    {...register("category", { required: "Category is required" })}
                  />
                  <datalist id="category-options">
                    {categoryOptions.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                  {errors.category && (
                    <p className="text-xs text-destructive">{errors.category.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="slug">URL slug</Label>
                  <Input id="slug" placeholder="auto from name" {...register("slug")} />
                  {errors.slug && (
                    <p className="text-xs text-destructive">{errors.slug.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="shortDescription">Short description</Label>
                <Input
                  id="shortDescription"
                  placeholder="One line shown on product cards"
                  {...register("shortDescription")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Full description</Label>
                <Textarea id="description" rows={4} {...register("description")} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pricing</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="price">
                  Selling price (₹) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  {...register("price", { required: "Price is required" })}
                />
                {errors.price && (
                  <p className="text-xs text-destructive">{errors.price.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="costPrice">Cost price (₹)</Label>
                <Input id="costPrice" type="number" min={0} placeholder="optional" {...register("costPrice")} />
                <p className="text-xs text-muted-foreground">Used for profit reporting.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Product details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="fabric">Fabric</Label>
                  <Input id="fabric" placeholder="100% combed cotton" {...register("fabric")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="gsm">GSM</Label>
                  <Input id="gsm" type="number" min={0} placeholder="optional" {...register("gsm")} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="fitType">Fit type</Label>
                  <Input
                    id="fitType"
                    list="fit-options"
                    placeholder="Regular / Oversized…"
                    {...register("fitType")}
                  />
                  <datalist id="fit-options">
                    {FIT_TYPES.map((f) => (
                      <option key={f} value={f} />
                    ))}
                  </datalist>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="washInstructions">Wash &amp; care</Label>
                <Textarea id="washInstructions" rows={3} {...register("washInstructions")} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Images</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageManager value={images} onChange={setImages} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Select
                value={status}
                onValueChange={(v) => setValue("status", v as ProductStatus)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {PRODUCT_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Only <b>Active</b> products appear in the catalog. <b>Draft</b> and{" "}
                <b>Inactive</b> are hidden from customers.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inventory by size</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {SIZES.map((s) => (
                <div key={s} className="space-y-1.5">
                  <Label htmlFor={`stock${s}`}>Size {s} stock</Label>
                  <Input
                    id={`stock${s}`}
                    type="number"
                    min={0}
                    {...register(`stock${s}` as "stockM" | "stockL" | "stockXL")}
                  />
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                Stock only decreases when an order is marked <b>Paid</b>.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push("/admin/products")}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" /> Saving…
            </>
          ) : (
            <>
              <Save /> {isEdit ? "Save Changes" : "Create Product"}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
