import Link from "next/link"
import Image from "next/image"
import { LogOut, ExternalLink } from "lucide-react"
import { AdminNav } from "@/components/admin/admin-nav"
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav"
import { Button } from "@/components/ui/button"
import { requireAdmin } from "@/lib/auth"
import { logoutAction } from "@/server/actions/auth"
import { publicConfig } from "@/lib/config"

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireAdmin()

  return (
    <div className="min-h-screen bg-muted/20 lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-background lg:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <Image
            src="/logo.png"
            alt={publicConfig.storeName}
            width={256}
            height={256}
            quality={100}
            className="size-10 rounded-full object-cover ring-1 ring-border"
          />
          <div className="leading-tight">
            <p className="font-heading text-sm font-semibold">
              {publicConfig.storeName}
            </p>
            <p className="text-xs text-muted-foreground">Admin</p>
          </div>
        </div>

        <div className="flex-1 px-3">
          <AdminNav />
        </div>

        <div className="space-y-1 border-t border-border p-3">
          <Button
            asChild
            variant="ghost"
            className="w-full justify-start text-muted-foreground"
          >
            <Link href="/" target="_blank">
              <ExternalLink /> View store
            </Link>
          </Button>
          <form action={logoutAction}>
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground"
            >
              <LogOut /> Sign out
            </Button>
          </form>
          <p className="truncate px-3 pt-2 text-xs text-muted-foreground">
            {session.email}
          </p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminMobileNav />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
