import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StockBadge } from "@/components/shop/stock-badge"
import { formatINR } from "@/lib/format"
import { cn } from "@/lib/utils"
import { SIZES } from "@/lib/constants"
import type { ShapedProduct } from "@/lib/types"

export function ProductCard({
  product,
  priority = false,
}: {
  product: ShapedProduct
  priority?: boolean
}) {
  const soldOut = product.availableTotal <= 0
  const cardImage = product.primaryThumbnail ?? product.primaryImage
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        {cardImage ? (
          <Image
            src={cardImage}
            alt={product.name}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No image
          </div>
        )}
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
            <span className="rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background">
              Sold out
            </span>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-background/85 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-foreground backdrop-blur">
          {product.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-heading text-base font-semibold leading-snug tracking-tight">
            {product.name}
          </h3>
          <p className="shrink-0 text-base font-semibold">
            {formatINR(product.price)}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {SIZES.map((s) => {
            const inStock = product.availableBySize[s] > 0
            return (
              <span
                key={s}
                className={cn(
                  "inline-flex h-6 min-w-7 items-center justify-center rounded-md border px-1.5 text-xs font-medium",
                  inStock
                    ? "border-border text-foreground"
                    : "border-dashed border-border/60 text-muted-foreground/50 line-through",
                )}
              >
                {s}
              </span>
            )
          })}
        </div>

        <div className="mt-auto flex items-center justify-between pt-1">
          <StockBadge totalStock={product.availableTotal} />
          <Button
            variant="ghost"
            size="sm"
            className="-mr-2 text-muted-foreground group-hover:text-foreground"
            tabIndex={-1}
            asChild
          >
            <span>
              View Product
              <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </Button>
        </div>
      </div>
    </Link>
  )
}
