import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, ExternalLink } from "lucide-react"
import { PageHeader } from "@/components/admin/page-header"
import { ProductForm } from "@/components/admin/product-form"
import { Button } from "@/components/ui/button"
import { getProductById, getAdminCategories } from "@/server/queries"

export const dynamic = "force-dynamic"

type Params = Promise<{ id: string }>

export default async function EditProductPage({ params }: { params: Params }) {
  const { id } = await params
  const [product, categories] = await Promise.all([
    getProductById(id),
    getAdminCategories(),
  ])
  if (!product) notFound()

  return (
    <div>
      <Link
        href="/admin/products"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Back to products
      </Link>
      <PageHeader title="Edit Product" description={product.name}>
        <Button asChild variant="outline" size="sm">
          <Link href={`/product/${product.slug}`} target="_blank">
            <ExternalLink /> View
          </Link>
        </Button>
      </PageHeader>
      <ProductForm product={product} categories={categories} />
    </div>
  )
}
