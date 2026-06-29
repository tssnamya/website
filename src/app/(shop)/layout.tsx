import { SiteHeader } from "@/components/shop/site-header"
import { SiteFooter } from "@/components/shop/site-footer"

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
