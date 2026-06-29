import Link from "next/link"
import Image from "next/image"
import { Plus, ImageOff } from "lucide-react"
import { PageHeader } from "@/components/admin/page-header"
import { ProductFilters } from "@/components/admin/product-filters"
import { ProductRowActions } from "@/components/admin/product-row-actions"
import { ProductStatusBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getAllProductsForAdmin, getAdminCategories } from "@/server/queries"
import { formatINR } from "@/lib/format"
import {
  SIZES,
  PRODUCT_STATUSES,
  stockState,
  type ProductStatus,
} from "@/lib/constants"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

type SearchParams = Promise<{
  q?: string
  category?: string
  status?: string
}>

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const sp = await searchParams
  const categories = await getAdminCategories()

  let products
  if (sp.status === "archived") {
    products = (
      await getAllProductsForAdmin({
        q: sp.q,
        category: sp.category,
        includeArchived: true,
      })
    ).filter((p) => p.archived)
  } else {
    const status = (PRODUCT_STATUSES as readonly string[]).includes(sp.status ?? "")
      ? (sp.status as ProductStatus)
      : undefined
    products = await getAllProductsForAdmin({
      q: sp.q,
      category: sp.category,
      status,
    })
  }

  return (
    <div>
      <PageHeader
        title="Products"
        description={`${products.length} product${products.length === 1 ? "" : "s"}`}
      >
        <Button asChild size="sm">
          <Link href="/admin/products/new">
            <Plus /> Add Product
          </Link>
        </Button>
      </PageHeader>

      <ProductFilters categories={categories} />

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock (M / L / XL)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    No products match the selected filters.
                  </TableCell>
                </TableRow>
              )}
              {products.map((p) => (
                <TableRow key={p.id} className={p.archived ? "opacity-60" : ""}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative size-11 shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                        {p.primaryImage ? (
                          <Image
                            src={p.primaryImage}
                            alt={p.name}
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center text-muted-foreground">
                            <ImageOff className="size-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.category}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{formatINR(p.price)}</p>
                    {p.costPrice != null && (
                      <p className="text-xs text-muted-foreground">
                        cost {formatINR(p.costPrice)}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {SIZES.map((s) => {
                        const stock = p.stockBySize[s]
                        const state = stockState(stock)
                        return (
                          <span
                            key={s}
                            title={`Size ${s}: ${stock}`}
                            className={cn(
                              "inline-flex h-6 min-w-9 items-center justify-center rounded-md border px-1 text-xs font-medium tabular-nums",
                              state === "out"
                                ? "border-rose-200 bg-rose-50 text-rose-600"
                                : state === "low"
                                  ? "border-amber-200 bg-amber-50 text-amber-700"
                                  : "border-border text-foreground",
                            )}
                          >
                            {stock}
                          </span>
                        )
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <ProductStatusBadge status={p.status} archived={p.archived} />
                  </TableCell>
                  <TableCell>
                    <ProductRowActions
                      productId={p.id}
                      name={p.name}
                      status={p.status}
                      archived={p.archived}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
