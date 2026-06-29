import Link from "next/link"
import Image from "next/image"
import { getSettings } from "@/lib/settings"
import { buildWhatsAppUrl } from "@/lib/whatsapp"

export async function SiteHeader() {
  const settings = await getSettings()
  const contactUrl = settings.whatsappNumber
    ? buildWhatsAppUrl(
        settings.whatsappNumber,
        `Hi ${settings.businessName}, I have a question.`,
      )
    : null

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt={settings.businessName}
            width={256}
            height={256}
            quality={100}
            priority
            className="size-12 rounded-full object-cover ring-1 ring-border"
          />
          <span className="font-heading text-lg font-semibold leading-none tracking-tight">
            {settings.businessName}
          </span>
        </Link>
        <nav className="flex items-center gap-5 text-sm sm:gap-6">
          <Link
            href="/"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Catalog
          </Link>
          <Link
            href="/policies"
            className="hidden text-muted-foreground transition-colors hover:text-foreground sm:inline"
          >
            Exchange &amp; Returns
          </Link>
          {contactUrl && (
            <a
              href={contactUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Contact
            </a>
          )}
        </nav>
      </div>
    </header>
  )
}
