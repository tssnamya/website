import { PageHeader } from "@/components/admin/page-header"
import { InventoryTable } from "@/components/admin/inventory-table"
import { getAllProductsForAdmin, getAdminCategories } from "@/server/queries"

export const dynamic = "force-dynamic"

export default async function InventoryPage() {
  const [products, categories] = await Promise.all([
    getAllProductsForAdmin({}),
    getAdminCategories(),
  ])

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Update stock levels for each size. Low stock is shown in amber, out of stock in red."
      />
      <InventoryTable products={products} categories={categories} />
    </div>
  )
}
