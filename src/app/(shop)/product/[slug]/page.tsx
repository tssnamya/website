import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, Shirt, Droplets, Ruler, RefreshCw } from "lucide-react"
import { ProductGallery } from "@/components/shop/product-gallery"
import { OrderPanel } from "@/components/shop/order-panel"
import { getProductBySlug } from "@/server/queries"
import { getSettings, toPublicSettings } from "@/lib/settings"
import { formatINR } from "@/lib/format"

export const dynamic = "force-dynamic"

type Params = Promise<{ slug: string }>

export async function generateMetadata({
  params,
}: {
  params: Params
}): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) return { title: "Product not found" }
  return {
    title: product.name,
    description: product.description?.slice(0, 160) || product.name,
    openGraph: {
      title: product.name,
      images: product.primaryImage ? [product.primaryImage] : [],
    },
  }
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product || !product.isVisible) notFound()
  const settings = toPublicSettings(await getSettings())

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Back to catalog
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={product.images} name={product.name} />

        <div className="space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {product.category}
            </span>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              {product.name}
            </h1>
            <p className="text-2xl font-semibold">{formatINR(product.price)}</p>
          </div>

          {product.description && (
            <p className="text-pretty leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          )}

          <OrderPanel product={product} settings={settings} />
        </div>
      </div>

      {/* Product details */}
      <div className="mt-12 grid grid-cols-1 gap-6 border-t border-border pt-10 md:grid-cols-2">
        {product.fabric && (
          <div className="flex gap-3">
            <Shirt className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            <div>
              <h3 className="font-medium">Fabric &amp; Material</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {product.fabric}
                {product.gsm ? `, ${product.gsm} GSM` : ""}
              </p>
            </div>
          </div>
        )}
        {product.fitType && (
          <div className="flex gap-3">
            <Ruler className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            <div>
              <h3 className="font-medium">Fit</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {product.fitType} fit
              </p>
            </div>
          </div>
        )}
        {product.washInstructions && (
          <div className="flex gap-3">
            <Droplets className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            <div>
              <h3 className="font-medium">Care Instructions</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {product.washInstructions}
              </p>
            </div>
          </div>
        )}
        <div className="flex gap-3">
          <RefreshCw className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
          <div>
            <h3 className="font-medium">Exchange Policy</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {settings.policySummary}{" "}
              <Link href="/policies" className="underline underline-offset-4 hover:text-foreground">
                Learn more
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
