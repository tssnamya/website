import { Inbox } from "lucide-react"
import { PageHeader } from "@/components/admin/page-header"
import { OrderFilters } from "@/components/admin/order-filters"
import { OrderRowActions } from "@/components/admin/order-row-actions"
import { PaymentBadge, ShippingBadge } from "@/components/admin/status-badge"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getOrders } from "@/server/queries"
import { formatINR, formatDate, orderCode } from "@/lib/format"
import type { PaymentStatus, ShippingStatus } from "@/lib/constants"

export const dynamic = "force-dynamic"

type SearchParams = Promise<{
  q?: string
  payment?: string
  shipping?: string
  dateFrom?: string
  dateTo?: string
}>

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const sp = await searchParams
  const payment = (["PENDING", "PAID"].includes(sp.payment ?? "")
    ? sp.payment
    : undefined) as PaymentStatus | undefined
  const shipping = (["NOT_STARTED", "PACKED", "SHIPPED", "DELIVERED"].includes(
    sp.shipping ?? "",
  )
    ? sp.shipping
    : undefined) as ShippingStatus | undefined

  const orders = await getOrders({
    q: sp.q,
    payment,
    shipping,
    dateFrom: sp.dateFrom,
    dateTo: sp.dateTo,
  })

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Review orders, verify payments, and update their status."
      />
      <OrderFilters />

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Shipping</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-16 text-center text-muted-foreground"
                  >
                    <Inbox className="mx-auto mb-2 size-7" />
                    No orders match the selected filters.
                  </TableCell>
                </TableRow>
              )}
              {orders.map((o) => (
                <TableRow key={o.id} className={o.cancelled ? "opacity-60" : ""}>
                  <TableCell>
                    <p className="font-medium tabular-nums">
                      {orderCode(o.orderNumber)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(o.createdAt)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{o.customerName}</p>
                    <p className="text-xs text-muted-foreground">{o.phone}</p>
                  </TableCell>
                  <TableCell className="max-w-[260px]">
                    <p className="truncate text-sm" title={o.productSummary}>
                      {o.productSummary}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {o.totalQuantity} item{o.totalQuantity === 1 ? "" : "s"}
                    </p>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatINR(o.totalAmount)}
                  </TableCell>
                  <TableCell>
                    <PaymentBadge status={o.paymentStatus} cancelled={o.cancelled} />
                    {o.reservationActive && (
                      <p className="mt-1 text-[11px] text-amber-600">Stock reserved</p>
                    )}
                    {!o.reservationActive &&
                      !o.cancelled &&
                      o.paymentStatus === "PENDING" &&
                      o.reservationExpiresAt && (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Reservation expired
                        </p>
                      )}
                  </TableCell>
                  <TableCell>
                    <ShippingBadge status={o.shippingStatus} />
                  </TableCell>
                  <TableCell>
                    <OrderRowActions order={o} />
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
