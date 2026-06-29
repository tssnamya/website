import Link from "next/link"
import {
  Package,
  PackageCheck,
  ShoppingCart,
  CalendarClock,
  Clock,
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Activity,
} from "lucide-react"
import { PageHeader } from "@/components/admin/page-header"
import { StatCard } from "@/components/admin/stat-card"
import { PaymentBadge } from "@/components/admin/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  getDashboardStats,
  getRecentOrders,
  getRecentActivity,
} from "@/server/queries"
import { formatINR, formatDate, formatDateTime, orderCode } from "@/lib/format"

export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  const [stats, recentOrders, activity] = await Promise.all([
    getDashboardStats(),
    getRecentOrders(6),
    getRecentActivity(8),
  ])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="An overview of your orders, revenue, and inventory."
      >
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/orders">
            View orders <ArrowRight />
          </Link>
        </Button>
      </PageHeader>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total products" value={stats.totalProducts} icon={Package} />
        <StatCard
          label="Active products"
          value={stats.activeProducts}
          icon={PackageCheck}
          accent="emerald"
        />
        <StatCard label="Today's orders" value={stats.todaysOrders} icon={CalendarClock} />
        <StatCard label="Total orders" value={stats.totalOrders} icon={ShoppingCart} />
        <StatCard
          label="Pending orders"
          value={stats.pendingOrders}
          icon={Clock}
          accent="amber"
          hint="Awaiting payment"
        />
        <StatCard
          label="Paid orders"
          value={stats.paidOrders}
          icon={CheckCircle2}
          accent="emerald"
        />
        <StatCard
          label="Total revenue"
          value={formatINR(stats.revenue)}
          icon={IndianRupee}
          hint={`${stats.cancelledOrders} cancelled`}
        />
        <StatCard
          label="Low / out of stock"
          value={`${stats.lowStockCount} / ${stats.outOfStockCount}`}
          icon={AlertTriangle}
          accent={stats.outOfStockCount > 0 ? "rose" : stats.lowStockCount > 0 ? "amber" : "default"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Recent orders */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Recent orders</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/orders">
                All orders <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No orders have been placed yet.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {recentOrders.map((o) => (
                  <li
                    key={o.id}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {orderCode(o.orderNumber)} · {o.customerName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {o.productSummary} · {formatDate(o.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-sm font-medium tabular-nums">
                        {formatINR(o.totalAmount)}
                      </span>
                      <PaymentBadge status={o.paymentStatus} cancelled={o.cancelled} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Low stock quick nav */}
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-amber-500" /> Needs restock
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/inventory">
                Manage <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats.lowStock.length === 0 && stats.outOfStock.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Inventory looks healthy. 🎉
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {stats.outOfStock.slice(0, 4).map((p) => (
                  <li key={`out-${p.productId}`} className="flex items-center justify-between py-2 text-sm">
                    <Link
                      href={`/admin/products/${p.productId}/edit`}
                      className="truncate font-medium hover:underline"
                    >
                      {p.productName}
                    </Link>
                    <Badge className="bg-rose-100 text-rose-700">Out</Badge>
                  </li>
                ))}
                {stats.lowStock.slice(0, 6).map((item) => (
                  <li
                    key={`low-${item.productId}-${item.size}`}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <Link
                      href={`/admin/products/${item.productId}/edit`}
                      className="truncate font-medium hover:underline"
                    >
                      {item.productName}
                    </Link>
                    <span className="flex items-center gap-2">
                      <Badge variant="outline">{item.size}</Badge>
                      <span className="font-semibold text-amber-600">{item.stock}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      {activity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4" /> Recent activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {activity.map((a) => (
                <li key={a.id} className="flex items-start gap-3 text-sm">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                  <div className="min-w-0">
                    <p className="text-foreground">{a.summary}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.actorEmail} · {formatDateTime(a.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
