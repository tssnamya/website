import { Suspense } from "react"
import { CatalogControls } from "@/components/shop/catalog-controls"
import { ProductGrid } from "@/components/shop/product-grid"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getCatalogProducts,
  getCategories,
  type CatalogSort,
} from "@/server/queries"
import { publicConfig } from "@/lib/config"

export const dynamic = "force-dynamic"

type SearchParams = Promise<{
  q?: string
  category?: string
  sort?: string
}>

function CatalogSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      ))}
    </div>
  )
}

async function Catalog({ params }: { params: SearchParams }) {
  const sp = await params
  const sort = (["newest", "price-asc", "price-desc"].includes(sp.sort ?? "")
    ? sp.sort
    : "newest") as CatalogSort

  const [products, categories] = await Promise.all([
    getCatalogProducts({ q: sp.q, category: sp.category, sort }),
    getCategories(),
  ])

  return (
    <div className="space-y-6">
      <CatalogControls categories={categories} />
      <p className="text-sm text-muted-foreground">
        {products.length} {products.length === 1 ? "product" : "products"}
      </p>
      <ProductGrid products={products} />
    </div>
  )
}

export default function CatalogPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Hero */}
      <section className="mb-10 space-y-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Order on WhatsApp. Pay securely via UPI.
        </span>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {publicConfig.storeName}
        </h1>
        <p className="max-w-xl text-pretty text-muted-foreground">
          Explore our collection of thoughtfully designed polo and round neck
          T-shirts. Choose your preferred size and place your order through
          WhatsApp.
        </p>
      </section>

      <Suspense fallback={<CatalogSkeleton />}>
        <Catalog params={searchParams} />
      </Suspense>
    </div>
  )
}
