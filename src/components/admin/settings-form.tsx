"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { updateSettings } from "@/server/actions/settings"
import type { AppSettings } from "@/lib/types"

interface FormValues {
  businessName: string
  whatsappNumber: string
  upiId: string
  paymentInstructions: string
  shippingCharge: string
  freeShippingThreshold: string
  reservationMinutes: string
  lowStockThreshold: string
  contactEmail: string
  contactPhone: string
  policySummary: string
  returnPolicy: string
}

export function SettingsForm({ settings }: { settings: AppSettings }) {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      businessName: settings.businessName,
      whatsappNumber: settings.whatsappNumber,
      upiId: settings.upiId,
      paymentInstructions: settings.paymentInstructions,
      shippingCharge: String(settings.shippingCharge),
      freeShippingThreshold: String(settings.freeShippingThreshold),
      reservationMinutes: String(settings.reservationMinutes),
      lowStockThreshold: String(settings.lowStockThreshold),
      contactEmail: settings.contactEmail,
      contactPhone: settings.contactPhone,
      policySummary: settings.policySummary,
      returnPolicy: settings.returnPolicy,
    },
  })

  async function onSubmit(values: FormValues) {
    const res = await updateSettings(values)
    if (!res.ok) {
      if (res.fieldErrors) {
        for (const [key, messages] of Object.entries(res.fieldErrors)) {
          if (messages?.[0]) setError(key as keyof FormValues, { message: messages[0] })
        }
      }
      toast.error(res.error)
      return
    }
    toast.success("Your settings have been saved successfully.")
    router.refresh()
  }

  const err = (k: keyof FormValues) =>
    errors[k] ? <p className="text-xs text-destructive">{errors[k]?.message}</p> : null

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Business</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="businessName">Business name</Label>
              <Input id="businessName" {...register("businessName")} />
              {err("businessName")}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contactEmail">Contact email</Label>
              <Input id="contactEmail" type="email" {...register("contactEmail")} />
              {err("contactEmail")}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contactPhone">Contact phone</Label>
              <Input id="contactPhone" {...register("contactPhone")} />
              {err("contactPhone")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">WhatsApp &amp; payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="whatsappNumber">WhatsApp number</Label>
              <Input id="whatsappNumber" placeholder="9198xxxxxxxx" {...register("whatsappNumber")} />
              <p className="text-xs text-muted-foreground">
                Digits only, including country code (e.g. 9198…). Orders open a chat here.
              </p>
              {err("whatsappNumber")}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="upiId">UPI ID</Label>
              <Input id="upiId" placeholder="yourbrand@okhdfcbank" {...register("upiId")} />
              {err("upiId")}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="paymentInstructions">Payment instructions</Label>
              <Textarea id="paymentInstructions" rows={2} {...register("paymentInstructions")} />
              {err("paymentInstructions")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Shipping</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="shippingCharge">Flat shipping (₹)</Label>
              <Input id="shippingCharge" type="number" min={0} {...register("shippingCharge")} />
              {err("shippingCharge")}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="freeShippingThreshold">Free shipping above (₹)</Label>
              <Input id="freeShippingThreshold" type="number" min={0} {...register("freeShippingThreshold")} />
              <p className="text-xs text-muted-foreground">0 = always charge shipping.</p>
              {err("freeShippingThreshold")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inventory rules</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="reservationMinutes">Reservation timeout (min)</Label>
              <Input id="reservationMinutes" type="number" min={1} {...register("reservationMinutes")} />
              <p className="text-xs text-muted-foreground">
                Stock held for a pending order before release.
              </p>
              {err("reservationMinutes")}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lowStockThreshold">Low stock threshold</Label>
              <Input id="lowStockThreshold" type="number" min={0} {...register("lowStockThreshold")} />
              {err("lowStockThreshold")}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Exchange &amp; return policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="policySummary">Short policy summary</Label>
              <Input id="policySummary" {...register("policySummary")} />
              <p className="text-xs text-muted-foreground">
                Shown on product pages, checkout, and the footer.
              </p>
              {err("policySummary")}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="returnPolicy">Full policy</Label>
              <Textarea id="returnPolicy" rows={5} {...register("returnPolicy")} />
              <p className="text-xs text-muted-foreground">
                Shown on the Exchange &amp; Returns page. Use blank lines to separate
                paragraphs.
              </p>
              {err("returnPolicy")}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" /> Saving…
            </>
          ) : (
            <>
              <Save /> Save Settings
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
