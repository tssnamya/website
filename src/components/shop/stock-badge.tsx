import { cn } from "@/lib/utils"
import { LOW_STOCK_THRESHOLD } from "@/lib/constants"

export function StockBadge({
  totalStock,
  className,
}: {
  totalStock: number
  className?: string
}) {
  const state =
    totalStock <= 0 ? "out" : totalStock <= LOW_STOCK_THRESHOLD ? "low" : "in"

  const config = {
    in: { label: "In stock", dot: "bg-emerald-500", text: "text-emerald-700" },
    low: {
      label: `Only ${totalStock} left`,
      dot: "bg-amber-500",
      text: "text-amber-700",
    },
    out: { label: "Out of stock", dot: "bg-rose-500", text: "text-rose-700" },
  }[state]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        config.text,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  )
}
