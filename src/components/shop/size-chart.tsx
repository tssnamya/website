"use client"

import { Ruler } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SIZES } from "@/lib/constants"
import type { ProductSizeChart } from "@/lib/types"

function fmt(v: number | null): string {
  return v == null ? "—" : `${v}"`
}

export function SizeChart({ chart }: { chart: ProductSizeChart }) {
  // Only show sizes that have at least one measurement filled in.
  const rows = SIZES.filter(
    (s) =>
      chart[s].chest != null ||
      chart[s].shoulder != null ||
      chart[s].length != null,
  )
  if (rows.length === 0) return null

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          <Ruler className="size-3.5" /> Size chart
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading">Size chart</DialogTitle>
          <DialogDescription>
            All measurements are in inches. Garments may vary by ±0.5&quot;.
          </DialogDescription>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Size</TableHead>
              <TableHead className="text-right">Chest</TableHead>
              <TableHead className="text-right">Shoulder</TableHead>
              <TableHead className="text-right">Length</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((s) => (
              <TableRow key={s}>
                <TableCell className="font-medium">{s}</TableCell>
                <TableCell className="text-right">{fmt(chart[s].chest)}</TableCell>
                <TableCell className="text-right">{fmt(chart[s].shoulder)}</TableCell>
                <TableCell className="text-right">{fmt(chart[s].length)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  )
}
