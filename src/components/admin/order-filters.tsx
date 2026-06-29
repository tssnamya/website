"use client"

import { useEffect, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function OrderFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const [query, setQuery] = useState(searchParams.get("q") ?? "")
  const payment = searchParams.get("payment") ?? "all"
  const shipping = searchParams.get("shipping") ?? "all"
  const dateFrom = searchParams.get("dateFrom") ?? ""
  const dateTo = searchParams.get("dateTo") ?? ""

  useEffect(() => {
    // Sync controlled input to external URL state (back/forward navigation).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery(searchParams.get("q") ?? "")
  }, [searchParams])

  function pushParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(next)) {
      if (!value || value === "all" || value === "") params.delete(key)
      else params.set(key, value)
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }

  useEffect(() => {
    const current = searchParams.get("q") ?? ""
    if (query === current) return
    const t = setTimeout(() => pushParams({ q: query || null }), 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const hasDate = Boolean(dateFrom || dateTo)

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search order ID, name or phone…"
            className="h-10 pl-9 pr-9"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
              aria-label="Clear"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <Select value={payment} onValueChange={(v) => pushParams({ payment: v })}>
          <SelectTrigger className="h-10 w-[160px]">
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All payments</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
          </SelectContent>
        </Select>
        <Select value={shipping} onValueChange={(v) => pushParams({ shipping: v })}>
          <SelectTrigger className="h-10 w-[170px]">
            <SelectValue placeholder="Shipping" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All shipping</SelectItem>
            <SelectItem value="NOT_STARTED">Not started</SelectItem>
            <SelectItem value="PACKED">Packed</SelectItem>
            <SelectItem value="SHIPPED">Shipped</SelectItem>
            <SelectItem value="DELIVERED">Delivered</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">Date range:</span>
        <Input
          type="date"
          value={dateFrom}
          max={dateTo || undefined}
          onChange={(e) => pushParams({ dateFrom: e.target.value || null })}
          className="h-9 w-[160px]"
          aria-label="From date"
        />
        <span className="text-muted-foreground">to</span>
        <Input
          type="date"
          value={dateTo}
          min={dateFrom || undefined}
          onChange={(e) => pushParams({ dateTo: e.target.value || null })}
          className="h-9 w-[160px]"
          aria-label="To date"
        />
        {hasDate && (
          <button
            type="button"
            onClick={() => pushParams({ dateFrom: null, dateTo: null })}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" /> Clear dates
          </button>
        )}
      </div>
    </div>
  )
}
