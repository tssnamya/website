import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { PageHeader } from "@/components/admin/page-header"
import { ProductForm } from "@/components/admin/product-form"
import { getAdminCategories } from "@/server/queries"

export const dynamic = "force-dynamic"

export default async function NewProductPage() {
  const categories = await getAdminCategories()
  return (
    <div>
      <Link
        href="/admin/products"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Back to products
      </Link>
      <PageHeader title="Add Product" description="Add a new product to your catalog." />
      <ProductForm categories={categories} />
    </div>
  )
}
