import {
  IndianRupee,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  PackageCheck,
  Trophy,
  Tag,
  Ruler,
  Users,
  Repeat,
  UserPlus,
  AlertTriangle,
  PackageX,
} from "lucide-react"
import { PageHeader } from "@/components/admin/page-header"
import { StatCard } from "@/components/admin/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAnalytics } from "@/server/queries"
import { formatINR } from "@/lib/format"

export const dynamic = "force-dynamic"

export default async function AnalyticsPage() {
  const a = await getAnalytics()
  const maxRev = Math.max(1, ...a.revenueByDay.map((d) => d.revenue))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Performance across revenue, orders, inventory, and customers."
      />

      {/* Revenue */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Revenue today" value={formatINR(a.revenue.today)} icon={IndianRupee} accent="emerald" />
        <StatCard label="This week" value={formatINR(a.revenue.week)} icon={TrendingUp} />
        <StatCard label="This month" value={formatINR(a.revenue.month)} icon={TrendingUp} />
        <StatCard label="Total revenue" value={formatINR(a.revenue.total)} icon={IndianRupee} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Revenue chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Revenue · last 7 days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-44 items-end justify-between gap-2">
              {a.revenueByDay.map((d) => (
                <div key={d.date} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      className="w-full rounded-t-md bg-primary/80 transition-all"
                      style={{ height: `${Math.max(2, (d.revenue / maxRev) * 100)}%` }}
                      title={formatINR(d.revenue)}
                    />
                  </div>
                  <span className="text-[11px] text-muted-foreground">{d.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Orders breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row icon={Clock} label="Pending" value={a.orders.pending} tint="text-amber-600" />
            <Row icon={CheckCircle2} label="Paid" value={a.orders.paid} tint="text-emerald-600" />
            <Row icon={PackageCheck} label="Delivered" value={a.orders.delivered} tint="text-indigo-600" />
            <Row icon={XCircle} label="Cancelled" value={a.orders.cancelled} tint="text-rose-600" />
            <div className="border-t border-border pt-2">
              <Row label="Total orders" value={a.orders.total} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products + customers + inventory */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top performers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Highlight icon={Trophy} label="Best Seller" value={a.bestSeller ? `${a.bestSeller.name}` : "No sales yet"} sub={a.bestSeller ? `${a.bestSeller.qty} sold` : ""} />
            <Highlight icon={Tag} label="Best Category" value={a.bestCategory ? a.bestCategory.name : "No sales yet"} sub={a.bestCategory ? `${a.bestCategory.qty} sold` : ""} />
            <Highlight icon={Ruler} label="Best Size" value={a.bestSize ? a.bestSize.size : "No sales yet"} sub={a.bestSize ? `${a.bestSize.qty} sold` : ""} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row icon={Users} label="Total customers" value={a.customers.total} />
            <Row icon={Repeat} label="Repeat customers" value={a.customers.repeat} tint="text-emerald-600" />
            <Row icon={UserPlus} label="New (30 days)" value={a.customers.new} tint="text-indigo-600" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inventory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row icon={AlertTriangle} label="Low stock (size rows)" value={a.inventory.lowStock} tint="text-amber-600" />
            <Row icon={PackageX} label="Out of stock (products)" value={a.inventory.outOfStock} tint="text-rose-600" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Row({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon?: typeof Clock
  label: string
  value: number
  tint?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-muted-foreground">
        {Icon && <Icon className={`size-4 ${tint ?? ""}`} />}
        {label}
      </span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  )
}

function Highlight({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Trophy
  label: string
  value: string
  sub: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-medium">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  )
}
