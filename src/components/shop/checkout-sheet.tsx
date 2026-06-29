"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle2, Loader2, MessageCircle } from "lucide-react"
import { toast } from "sonner"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  checkoutCustomerSchema,
  type CheckoutCustomerInput,
} from "@/lib/validations"
import { createOrder } from "@/server/actions/orders"
import { formatINR, orderCode } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Size } from "@/lib/constants"
import type { CreatedOrder, ShapedProduct, PublicSettings } from "@/lib/types"

interface CheckoutSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: ShapedProduct
  size: Size
  quantity: number
  settings: PublicSettings
}

function Field({
  label,
  htmlFor,
  error,
  required,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export function CheckoutSheet({
  open,
  onOpenChange,
  product,
  size,
  quantity,
  settings,
}: CheckoutSheetProps) {
  const [success, setSuccess] = useState<CreatedOrder | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutCustomerInput>({
    resolver: zodResolver(checkoutCustomerSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      houseFlat: "",
      street: "",
      landmark: "",
      city: "",
      state: "",
      pincode: "",
      notes: "",
    },
  })

  const subtotal = product.price * quantity
  const shipping =
    settings.freeShippingThreshold > 0 && subtotal >= settings.freeShippingThreshold
      ? 0
      : settings.shippingCharge
  const grandTotal = subtotal + shipping

  async function onSubmit(values: CheckoutCustomerInput) {
    const res = await createOrder({ ...values, productId: product.id, size, quantity })

    if (!res.ok) {
      if (res.fieldErrors) {
        for (const [key, messages] of Object.entries(res.fieldErrors)) {
          if (messages?.[0]) {
            setError(key as keyof CheckoutCustomerInput, { message: messages[0] })
          }
        }
      }
      toast.error(res.error)
      return
    }

    setSuccess(res.data)
    toast.success(`Thank you. Order ${orderCode(res.data.orderNumber)} has been received.`)
    // Open WhatsApp automatically; success screen has a manual fallback button.
    window.open(res.data.waUrl, "_blank", "noopener,noreferrer")
  }

  function handleOpenChange(next: boolean) {
    onOpenChange(next)
    if (!next) {
      setTimeout(() => {
        setSuccess(null)
        reset()
      }, 250)
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
        {success ? (
          <SuccessView order={success} onClose={() => handleOpenChange(false)} />
        ) : (
          <>
            <SheetHeader>
              <SheetTitle className="font-heading text-xl">Delivery Details</SheetTitle>
              <SheetDescription>
                Please provide your delivery details to continue with your order on
                WhatsApp.
              </SheetDescription>
            </SheetHeader>

            {/* Order summary */}
            <div className="mx-4 space-y-1.5 rounded-xl border border-border bg-muted/40 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{product.name}</span>
                <span className="text-muted-foreground">{formatINR(product.price)}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Size {size} · Qty {quantity}</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{shipping > 0 ? formatINR(shipping) : "Free"}</span>
              </div>
              <Separator className="my-1" />
              <div className="flex items-center justify-between font-semibold">
                <span>Total</span>
                <span>{formatINR(grandTotal)}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col gap-4 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Customer Details
              </p>
              <Field label="Full Name" htmlFor="fullName" required error={errors.fullName?.message}>
                <Input id="fullName" autoComplete="name" {...register("fullName")} />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Mobile Number" htmlFor="phone" required error={errors.phone?.message}>
                  <Input id="phone" inputMode="numeric" autoComplete="tel" placeholder="10-digit mobile number" {...register("phone")} />
                </Field>
                <Field label="Email Address" htmlFor="email" error={errors.email?.message}>
                  <Input id="email" type="email" autoComplete="email" {...register("email")} />
                </Field>
              </div>

              <Separator className="my-1" />
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Delivery Address
              </p>
              <Field label="House / Flat Number" htmlFor="houseFlat" required error={errors.houseFlat?.message}>
                <Input id="houseFlat" autoComplete="address-line1" {...register("houseFlat")} />
              </Field>
              <Field label="Street / Area" htmlFor="street" required error={errors.street?.message}>
                <Input id="street" autoComplete="address-line2" {...register("street")} />
              </Field>
              <Field label="Landmark (Optional)" htmlFor="landmark" error={errors.landmark?.message}>
                <Input id="landmark" {...register("landmark")} />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="City" htmlFor="city" required error={errors.city?.message}>
                  <Input id="city" autoComplete="address-level2" {...register("city")} />
                </Field>
                <Field label="State" htmlFor="state" required error={errors.state?.message}>
                  <Input id="state" autoComplete="address-level1" {...register("state")} />
                </Field>
              </div>
              <Field label="PIN Code" htmlFor="pincode" required error={errors.pincode?.message}>
                <Input id="pincode" inputMode="numeric" autoComplete="postal-code" placeholder="6-digit PIN code" className="sm:max-w-40" {...register("pincode")} />
              </Field>

              <Field
                label="Additional Delivery Instructions (Optional)"
                htmlFor="notes"
                error={errors.notes?.message}
              >
                <Textarea
                  id="notes"
                  rows={2}
                  placeholder="For example, please call before delivery or leave the parcel with security."
                  {...register("notes")}
                />
              </Field>

              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting}
                className={cn("mt-2 w-full bg-emerald-600 text-white hover:bg-emerald-600/90")}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" /> Placing your order…
                  </>
                ) : (
                  <>
                    <MessageCircle /> Place Order on WhatsApp
                  </>
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Payment is completed securely via UPI on WhatsApp after you place
                your order.
              </p>
              <p className="text-center text-xs text-muted-foreground">
                {settings.policySummary}
              </p>
            </form>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function SuccessView({
  order,
  onClose,
}: {
  order: CreatedOrder
  onClose: () => void
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 p-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <CheckCircle2 className="size-9" />
      </div>
      <div className="space-y-1">
        <h2 className="font-heading text-xl font-semibold">Thank you for your order</h2>
        <p className="text-sm text-muted-foreground">
          Your order{" "}
          <span className="font-semibold text-foreground">
            {orderCode(order.orderNumber)}
          </span>{" "}
          has been received.
        </p>
      </div>

      <div className="w-full space-y-1 rounded-xl border border-border bg-muted/40 p-4 text-left text-sm">
        {order.items.map((it, i) => (
          <div key={i} className="flex items-center justify-between">
            <span>
              {it.productName} · {it.size} ×{it.quantity}
            </span>
            <span>{formatINR(it.subtotal)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Shipping</span>
          <span>{order.shippingCharge > 0 ? formatINR(order.shippingCharge) : "Free"}</span>
        </div>
        <Separator className="my-1.5" />
        <div className="flex items-center justify-between font-semibold">
          <span>Total</span>
          <span>{formatINR(order.totalAmount)}</span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        If WhatsApp did not open automatically, please use the button below. Send us
        the message and we will share the payment details.
      </p>

      <div className="flex w-full flex-col gap-2">
        <Button asChild size="lg" className="w-full bg-emerald-600 text-white hover:bg-emerald-600/90">
          <a href={order.waUrl} target="_blank" rel="noopener noreferrer">
            <MessageCircle /> Open WhatsApp
          </a>
        </Button>
        <Button variant="ghost" onClick={onClose} className="w-full">
          Continue Shopping
        </Button>
      </div>
    </div>
  )
}
