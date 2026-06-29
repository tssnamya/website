import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  PAYMENT_STATUS_LABELS,
  SHIPPING_STATUS_LABELS,
  PRODUCT_STATUS_LABELS,
  type PaymentStatus,
  type ShippingStatus,
  type ProductStatus,
} from "@/lib/constants"

export function ProductStatusBadge({
  status,
  archived,
}: {
  status: ProductStatus
  archived?: boolean
}) {
  if (archived) {
    return <Badge variant="outline" className="text-muted-foreground">Archived</Badge>
  }
  const styles: Record<ProductStatus, string> = {
    ACTIVE: "bg-emerald-100 text-emerald-700",
    INACTIVE: "bg-zinc-200 text-zinc-700",
    DRAFT: "bg-amber-100 text-amber-700",
  }
  return <Badge className={cn(styles[status])}>{PRODUCT_STATUS_LABELS[status]}</Badge>
}

export function PaymentBadge({
  status,
  cancelled,
}: {
  status: PaymentStatus
  cancelled?: boolean
}) {
  if (cancelled) {
    return <Badge className="bg-rose-100 text-rose-700">Cancelled</Badge>
  }
  return (
    <Badge
      className={cn(
        status === "PAID"
          ? "bg-emerald-100 text-emerald-700"
          : "bg-amber-100 text-amber-700",
      )}
    >
      {PAYMENT_STATUS_LABELS[status]}
    </Badge>
  )
}

export function ShippingBadge({ status }: { status: ShippingStatus }) {
  const styles: Record<ShippingStatus, string> = {
    NOT_STARTED: "bg-muted text-muted-foreground",
    PACKED: "bg-blue-100 text-blue-700",
    SHIPPED: "bg-indigo-100 text-indigo-700",
    DELIVERED: "bg-emerald-100 text-emerald-700",
  }
  return (
    <Badge variant="secondary" className={cn(styles[status])}>
      {SHIPPING_STATUS_LABELS[status]}
    </Badge>
  )
}
