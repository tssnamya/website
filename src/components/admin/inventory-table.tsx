"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Search, X, Check, Loader2, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { updateInventory } from "@/server/actions/products"
import { SIZES, stockState, type Size } from "@/lib/constants"
import { cn } from "@/lib/utils"
import type { ShapedProduct } from "@/lib/types"

type Draft = Record<Size, string>

function toDraft(p: ShapedProduct): Draft {
  return { M: String(p.stockBySize.M), L: String(p.stockBySize.L), XL: String(p.stockBySize.XL) }
}

export function InventoryTable({
  products,
  categories,
}: {
  products: ShapedProduct[]
  categories: string[]
}) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(products.map((p) => [p.id, toDraft(p)])),
  )
  const [savingId, setSavingId] = useState<string | null>(null)

  // Re-sync drafts whenever the server data changes (after a save + refresh).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDrafts(Object.fromEntries(products.map((p) => [p.id, toDraft(p)])))
  }, [products])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter(
      (p) =>
        (category === "all" || p.category === category) &&
        (q === "" || p.name.toLowerCase().includes(q)),
    )
  }, [products, search, category])

  function setCell(id: string, size: Size, value: string) {
    setDrafts((d) => ({ ...d, [id]: { ...d[id], [size]: value } }))
  }

  function isDirty(p: ShapedProduct) {
    const d = drafts[p.id]
    if (!d) return false
    return SIZES.some((s) => Number(d[s]) !== p.stockBySize[s])
  }

  async function save(p: ShapedProduct) {
    const d = drafts[p.id]
    setSavingId(p.id)
    const res = await updateInventory({
      productId: p.id,
      stock: { M: Number(d.M), L: Number(d.L), XL: Number(d.XL) },
    })
    setSavingId(null)
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    toast.success(`Inventory updated for ${p.name}.`)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="h-10 pl-9 pr-9"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
              aria-label="Clear"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-10 w-[170px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                {SIZES.map((s) => (
                  <TableHead key={s} className="w-24 text-center">
                    {s}
                  </TableHead>
                ))}
                <TableHead className="text-center">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                    No products match your search.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((p) => {
                const d = drafts[p.id] ?? toDraft(p)
                const total = SIZES.reduce((sum, s) => sum + (Number(d[s]) || 0), 0)
                const dirty = isDirty(p)
                const state = stockState(total)
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="flex items-center gap-1 font-medium hover:underline"
                      >
                        {p.name}
                        <ExternalLink className="size-3 text-muted-foreground" />
                      </Link>
                      <p className="text-xs text-muted-foreground">{p.category}</p>
                    </TableCell>
                    {SIZES.map((s) => {
                      const cellState = stockState(Number(d[s]) || 0)
                      return (
                        <TableCell key={s} className="text-center">
                          <Input
                            type="number"
                            min={0}
                            value={d[s]}
                            onChange={(e) => setCell(p.id, s, e.target.value)}
                            className={cn(
                              "mx-auto h-9 w-16 text-center tabular-nums",
                              cellState === "out" && "border-rose-300 bg-rose-50",
                              cellState === "low" && "border-amber-300 bg-amber-50",
                            )}
                          />
                        </TableCell>
                      )
                    })}
                    <TableCell className="text-center font-medium tabular-nums">
                      {total}
                    </TableCell>
                    <TableCell>
                      {state === "out" ? (
                        <Badge className="bg-rose-100 text-rose-700">Out of stock</Badge>
                      ) : state === "low" ? (
                        <Badge className="bg-amber-100 text-amber-700">Low</Badge>
                      ) : (
                        <Badge className="bg-emerald-100 text-emerald-700">Healthy</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant={dirty ? "default" : "outline"}
                        disabled={!dirty || savingId === p.id}
                        onClick={() => save(p)}
                      >
                        {savingId === p.id ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Check />
                        )}
                        Save
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
