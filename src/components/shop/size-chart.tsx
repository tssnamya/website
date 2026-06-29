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

// Indicative measurements (inches). Adjust per your actual production specs.
const CHART = [
  { size: "M", chest: 40, length: 28, shoulder: 17.5 },
  { size: "L", chest: 42, length: 29, shoulder: 18.5 },
  { size: "XL", chest: 44, length: 30, shoulder: 19.5 },
]

export function SizeChart() {
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
              <TableHead className="text-right">Length</TableHead>
              <TableHead className="text-right">Shoulder</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {CHART.map((row) => (
              <TableRow key={row.size}>
                <TableCell className="font-medium">{row.size}</TableCell>
                <TableCell className="text-right">{row.chest}</TableCell>
                <TableCell className="text-right">{row.length}</TableCell>
                <TableCell className="text-right">{row.shoulder}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  )
}
