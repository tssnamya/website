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
import { SIZES } from "@/lib/constants"

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
]

export function CatalogControls({ categories }: { categories: string[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const [query, setQuery] = useState(searchParams.get("q") ?? "")
  const category = searchParams.get("category") ?? "all"
  const size = searchParams.get("size") ?? "all"
  const sort = searchParams.get("sort") ?? "newest"

  // Keep local input in sync if the URL changes externally (e.g. back button).
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

  // Debounce the search input.
  useEffect(() => {
    const current = searchParams.get("q") ?? ""
    if (query === current) return
    const t = setTimeout(() => pushParams({ q: query || null }), 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products…"
          className="h-10 pl-9 pr-9"
          aria-label="Search products"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={category}
          onValueChange={(v) => pushParams({ category: v })}
        >
          <SelectTrigger className="h-10 w-[150px]" aria-label="Filter by category">
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

        <Select value={size} onValueChange={(v) => pushParams({ size: v })}>
          <SelectTrigger className="h-10 w-[120px]" aria-label="Filter by size">
            <SelectValue placeholder="Size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sizes</SelectItem>
            {SIZES.map((s) => (
              <SelectItem key={s} value={s}>
                Size {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(v) => pushParams({ sort: v })}>
          <SelectTrigger className="h-10 w-[180px]" aria-label="Sort products">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
