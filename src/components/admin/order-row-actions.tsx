"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  MoreHorizontal,
  Eye,
  CheckCircle2,
  Package,
  Truck,
  PackageCheck,
  XCircle,
  MessageCircle,
  Loader2,
  Save,
  Clock,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { PaymentBadge, ShippingBadge } from "@/components/admin/status-badge"
import { CopyButton } from "@/components/admin/copy-button"
import {
  markOrderPaid,
  updateShippingStatus,
  cancelOrder,
  updateOrderPaymentDetails,
} from "@/server/actions/orders"
import { buildWhatsAppUrl } from "@/lib/whatsapp"
import { formatINR, formatDateTime, orderCode } from "@/lib/format"
import type { ShippingStatus } from "@/lib/constants"
import type { AdminOrderRow } from "@/lib/types"

export function OrderRowActions({ order }: { order: AdminOrderRow }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [upiTxn, setUpiTxn] = useState(order.upiTransactionId ?? "")
  const [adminNotes, setAdminNotes] = useState(order.adminNotes ?? "")
  const [savingDetails, setSavingDetails] = useState(false)

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    startTransition(async () => {
      const res = await fn()
      if (!res.ok) {
        toast.error(res.error ?? "Something went wrong. Please try again.")
        return
      }
      toast.success(success)
      router.refresh()
    })
  }

  function onMarkPaid() {
    run(
      () => markOrderPaid(order.id, upiTxn.trim() || undefined),
      "Payment verified. Inventory has been updated.",
    )
  }

  function onCancel() {
    startTransition(async () => {
      const res = await cancelOrder(order.id)
      if (!res.ok) {
        toast.error(res.error ?? "Something went wrong. Please try again.")
        return
      }
      toast.success("The order has been cancelled.")
      setCancelOpen(false)
      router.refresh()
    })
  }

  async function saveDetails() {
    setSavingDetails(true)
    const res = await updateOrderPaymentDetails(order.id, {
      upiTransactionId: upiTxn,
      adminNotes,
    })
    setSavingDetails(false)
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    toast.success("Payment details saved successfully.")
    router.refresh()
  }

  const customerWa = buildWhatsAppUrl(
    `91${order.phone}`,
    `Hi ${order.customerName}, regarding your order ${orderCode(order.orderNumber)}.`,
  )

  const summaryText = [
    orderCode(order.orderNumber),
    `Customer: ${order.customerName}`,
    `Phone: ${order.phone}`,
    order.email ? `Email: ${order.email}` : null,
    `Address: ${order.address}`,
    "",
    ...order.items.map(
      (it) => `${it.productName} (${it.size} x${it.quantity}) - ${formatINR(it.subtotal)}`,
    ),
    `Subtotal: ${formatINR(order.subtotal)}`,
    `Shipping: ${order.shippingCharge > 0 ? formatINR(order.shippingCharge) : "Free"}`,
    `Total: ${formatINR(order.totalAmount)}`,
    order.notes ? `Instructions: ${order.notes}` : null,
  ]
    .filter((l) => l !== null)
    .join("\n")

  const shippingSteps: { status: ShippingStatus; label: string; icon: typeof Package }[] = [
    { status: "PACKED", label: "Mark as Packed", icon: Package },
    { status: "SHIPPED", label: "Mark as Shipped", icon: Truck },
    { status: "DELIVERED", label: "Mark as Delivered", icon: PackageCheck },
  ]

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Order actions">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onClick={() => setDetailsOpen(true)}>
            <Eye /> View Details
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={customerWa} target="_blank" rel="noopener noreferrer">
              <MessageCircle /> Message Customer
            </a>
          </DropdownMenuItem>

          {!order.cancelled && (
            <>
              <DropdownMenuSeparator />
              {order.paymentStatus === "PENDING" && (
                <DropdownMenuItem disabled={pending} onClick={onMarkPaid}>
                  <CheckCircle2 /> Mark Payment as Paid
                </DropdownMenuItem>
              )}
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Shipping
              </DropdownMenuLabel>
              {shippingSteps.map((step) => {
                const Icon = step.icon
                return (
                  <DropdownMenuItem
                    key={step.status}
                    disabled={pending || order.shippingStatus === step.status}
                    onClick={() =>
                      run(
                        () => updateShippingStatus(order.id, step.status),
                        `Order marked as ${step.status.toLowerCase()}.`,
                      )
                    }
                  >
                    <Icon /> {step.label}
                  </DropdownMenuItem>
                )
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setCancelOpen(true)}>
                <XCircle /> Cancel Order
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Details */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2">
              {orderCode(order.orderNumber)}
              <PaymentBadge status={order.paymentStatus} cancelled={order.cancelled} />
              <ShippingBadge status={order.shippingStatus} />
            </DialogTitle>
            <DialogDescription>Placed {formatDateTime(order.createdAt)}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            {order.reservationActive && order.reservationExpiresAt && (
              <p className="flex items-center gap-1.5 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
                <Clock className="size-3.5" /> Stock reserved until{" "}
                {formatDateTime(order.reservationExpiresAt)}
              </p>
            )}

            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Ship to
                </p>
                <p className="font-medium">{order.customerName}</p>
                <p className="text-muted-foreground">{order.phone}</p>
                {order.email && <p className="text-muted-foreground">{order.email}</p>}
                <p className="mt-1 text-muted-foreground">{order.address}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <CopyButton text={order.phone} label="Copy Phone" />
              <CopyButton text={order.address} label="Copy Address" />
              <CopyButton text={summaryText} label="Copy Summary" />
            </div>

            {order.notes && (
              <div className="rounded-md bg-muted/50 px-3 py-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Delivery instructions
                </p>
                <p className="mt-0.5">{order.notes}</p>
              </div>
            )}

            <Separator />
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Items
              </p>
              <div className="space-y-1.5">
                {order.items.map((it, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span>
                      {it.productName} · {it.size} ×{it.quantity}
                    </span>
                    <span>{formatINR(it.subtotal)}</span>
                  </div>
                ))}
              </div>
              <Separator className="my-2" />
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatINR(order.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>
                  {order.shippingCharge > 0 ? formatINR(order.shippingCharge) : "Free"}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between font-semibold">
                <span>Total</span>
                <span>{formatINR(order.totalAmount)}</span>
              </div>
            </div>

            <Separator />
            {/* Payment tracking */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Payment
                </p>
                {order.paymentVerifiedAt ? (
                  <Badge className="bg-emerald-100 text-emerald-700">
                    Verified {formatDateTime(order.paymentVerifiedAt)}
                  </Badge>
                ) : (
                  <Badge variant="secondary">Not verified</Badge>
                )}
              </div>
              {order.paymentVerifiedBy && (
                <p className="text-xs text-muted-foreground">
                  Verified by {order.paymentVerifiedBy}
                </p>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="upiTxn">UPI transaction ID</Label>
                <Input
                  id="upiTxn"
                  value={upiTxn}
                  onChange={(e) => setUpiTxn(e.target.value)}
                  placeholder="e.g. 4587xxxxxx"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="adminNotes">Internal Notes</Label>
                <Textarea
                  id="adminNotes"
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Private notes, not shared with the customer."
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={saveDetails} disabled={savingDetails}>
                  {savingDetails ? <Loader2 className="animate-spin" /> : <Save />} Save Details
                </Button>
                {!order.cancelled && order.paymentStatus === "PENDING" && (
                  <Button
                    size="sm"
                    className="bg-emerald-600 text-white hover:bg-emerald-600/90"
                    onClick={onMarkPaid}
                    disabled={pending}
                  >
                    <CheckCircle2 /> Verify &amp; Mark as Paid
                  </Button>
                )}
              </div>
            </div>

            <Button asChild className="w-full bg-emerald-600 text-white hover:bg-emerald-600/90">
              <a href={customerWa} target="_blank" rel="noopener noreferrer">
                <MessageCircle /> Message Customer on WhatsApp
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel confirmation */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel order {orderCode(order.orderNumber)}?</DialogTitle>
            <DialogDescription>
              This will cancel the order and release any reserved stock. If the order
              was already paid, the inventory will be restored automatically.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>
              Keep Order
            </Button>
            <Button variant="destructive" onClick={onCancel} disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <XCircle />} Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
