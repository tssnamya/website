import Link from "next/link"
import Image from "next/image"
import { getSettings } from "@/lib/settings"

export async function SiteFooter() {
  const settings = await getSettings()
  const year = new Date().getFullYear()
  return (
    <footer className="mt-auto border-t border-border/60 bg-muted/30">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm space-y-2">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt={settings.businessName}
              width={256}
              height={256}
              quality={100}
              className="size-11 rounded-full object-cover ring-1 ring-border"
            />
            <p className="font-heading text-lg font-semibold tracking-tight">
              {settings.businessName}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Thoughtfully designed polo and round neck T-shirts. Choose your
            size, share your delivery details, and place your order through
            WhatsApp, with secure payment via UPI.
          </p>
          <p className="text-xs text-muted-foreground">{settings.policySummary}</p>
        </div>
        <div className="grid grid-cols-2 gap-8 text-sm">
          <div className="space-y-2">
            <p className="font-medium">Shop</p>
            <Link
              href="/"
              className="block text-muted-foreground transition-colors hover:text-foreground"
            >
              Catalog
            </Link>
            <Link
              href="/policies"
              className="block text-muted-foreground transition-colors hover:text-foreground"
            >
              Exchange &amp; Returns
            </Link>
            {settings.contactEmail && (
              <a
                href={`mailto:${settings.contactEmail}`}
                className="block text-muted-foreground transition-colors hover:text-foreground"
              >
                Support
              </a>
            )}
          </div>
          <div className="space-y-2">
            <p className="font-medium">How It Works</p>
            <p className="text-muted-foreground">Browse and order on WhatsApp</p>
            <p className="text-muted-foreground">Pay securely via UPI</p>
            <p className="text-muted-foreground">Delivered to your door</p>
          </div>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-4 text-xs text-muted-foreground sm:px-6">
          <p>
            © {year} {settings.businessName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
