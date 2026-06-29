import type { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getSettings } from "@/lib/settings"
import { buildWhatsAppUrl } from "@/lib/whatsapp"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  return {
    title: "Exchange & Returns",
    description: settings.policySummary,
  }
}

export default async function PoliciesPage() {
  const settings = await getSettings()
  const paragraphs = settings.returnPolicy
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

  const contactUrl = settings.whatsappNumber
    ? buildWhatsAppUrl(
        settings.whatsappNumber,
        `Hi ${settings.businessName}, I would like to request a size exchange.`,
      )
    : null

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Back to catalog
      </Link>

      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        Exchange &amp; Returns
      </h1>
      <p className="mt-2 text-muted-foreground">{settings.policySummary}</p>

      <div className="mt-8 space-y-4 leading-relaxed text-muted-foreground">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {contactUrl && (
        <div className="mt-10 rounded-2xl border border-border bg-muted/30 p-5">
          <p className="font-medium text-foreground">Need a size exchange?</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Message us on WhatsApp with your order ID and we will help you arrange it.
          </p>
          <Button
            asChild
            className="mt-4 bg-emerald-600 text-white hover:bg-emerald-600/90"
          >
            <a href={contactUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle /> Message Us on WhatsApp
            </a>
          </Button>
        </div>
      )}
    </div>
  )
}
