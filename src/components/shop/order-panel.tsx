"use client"

import { useState } from "react"
import { Minus, Plus, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StockBadge } from "@/components/shop/stock-badge"
import { SizeChart } from "@/components/shop/size-chart"
import { CheckoutSheet } from "@/components/shop/checkout-sheet"
import { formatINR } from "@/lib/format"
import { cn } from "@/lib/utils"
import { SIZES, MAX_QUANTITY_PER_ORDER, type Size } from "@/lib/constants"
import type { ShapedProduct, PublicSettings } from "@/lib/types"

export function OrderPanel({
  product,
  settings,
}: {
  product: ShapedProduct
  settings: PublicSettings
}) {
  const firstAvailable = SIZES.find((s) => product.availableBySize[s] > 0) ?? null
  const [size, setSize] = useState<Size | null>(firstAvailable)
  const [qty, setQty] = useState(1)
  const [open, setOpen] = useState(false)

  const allOut = product.availableTotal <= 0
  const sizeStock = size ? product.availableBySize[size] : 0
  const maxQty = Math.min(sizeStock, MAX_QUANTITY_PER_ORDER)
  const canOrder = !!size && sizeStock > 0 && qty >= 1 && qty <= maxQty

  const subtotal = product.price * qty
  const shipping =
    settings.freeShippingThreshold > 0 && subtotal >= settings.freeShippingThreshold
      ? 0
      : settings.shippingCharge
  const grandTotal = subtotal + shipping

  function selectSize(s: Size) {
    setSize(s)
    setQty(1)
  }

  return (
    <div className="space-y-6">
      {/* Size selector */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Select size</span>
          <SizeChart chart={product.sizeChart} />
        </div>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => {
            const stock = product.availableBySize[s]
            const disabled = stock <= 0
            const selected = size === s
            return (
              <button
                key={s}
                type="button"
                disabled={disabled}
                onClick={() => selectSize(s)}
                aria-pressed={selected}
                className={cn(
                  "h-11 min-w-12 rounded-lg border px-3 text-sm font-medium transition-all",
                  selected && "border-foreground bg-foreground text-background",
                  !selected && !disabled && "border-border hover:border-foreground",
                  disabled &&
                    "cursor-not-allowed border-dashed border-border/60 text-muted-foreground/40 line-through",
                )}
              >
                {s}
              </button>
            )
          })}
        </div>
        {size && (
          <p className="text-xs text-muted-foreground">
            {sizeStock > 0 ? `${sizeStock} available` : "Out of stock"}
          </p>
        )}
      </div>

      {/* Quantity */}
      <div className="space-y-2.5">
        <span className="text-sm font-medium">Quantity</span>
        <div className="flex items-center gap-4">
          <div className="flex items-center rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={!canOrder || qty <= 1}
              className="flex size-10 items-center justify-center rounded-l-lg text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              <Minus className="size-4" />
            </button>
            <span className="w-10 text-center text-sm font-medium tabular-nums">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
              disabled={!size || sizeStock <= 0 || qty >= maxQty}
              className="flex size-10 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
              aria-label="Increase quantity"
            >
              <Plus className="size-4" />
            </button>
          </div>
          <StockBadge totalStock={product.availableTotal} />
        </div>
      </div>

      {/* Price breakdown + order */}
      <div className="space-y-3 rounded-2xl border border-border bg-muted/30 p-4">
        <div className="space-y-1 text-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatINR(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Shipping</span>
            <span>{shipping > 0 ? formatINR(shipping) : "Free"}</span>
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <span className="font-medium text-foreground">Total</span>
            <span className="font-heading text-2xl font-semibold">
              {formatINR(grandTotal)}
            </span>
          </div>
        </div>
        <Button
          onClick={() => setOpen(true)}
          disabled={!canOrder}
          size="lg"
          className="h-12 w-full bg-emerald-600 text-base text-white hover:bg-emerald-600/90"
        >
          {allOut ? (
            "Out of Stock"
          ) : !size ? (
            "Select a Size"
          ) : (
            <>
              <MessageCircle /> Order via WhatsApp
            </>
          )}
        </Button>
        {settings.freeShippingThreshold > 0 && shipping > 0 && (
          <p className="text-center text-xs text-muted-foreground">
            Free shipping on orders over {formatINR(settings.freeShippingThreshold)}.
          </p>
        )}
      </div>

      {size && (
        <CheckoutSheet
          open={open}
          onOpenChange={setOpen}
          product={product}
          size={size}
          quantity={qty}
          settings={settings}
        />
      )}
    </div>
  )
}
