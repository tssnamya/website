"use client"

import { motion } from "framer-motion"
import { PackageOpen } from "lucide-react"
import { ProductCard } from "@/components/shop/product-card"
import type { ShapedProduct } from "@/lib/types"

export function ProductGrid({ products }: { products: ShapedProduct[] }) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-20 text-center">
        <PackageOpen className="size-8 text-muted-foreground" />
        <p className="font-medium">No products are available at the moment</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Please adjust your search or filters and try again.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product, i) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: Math.min(i * 0.04, 0.4) }}
        >
          <ProductCard product={product} priority={i < 3} />
        </motion.div>
      ))}
    </div>
  )
}
