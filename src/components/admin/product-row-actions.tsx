"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  Archive,
  ArchiveRestore,
  Loader2,
  Check,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  duplicateProduct,
  setProductStatus,
  archiveProduct,
  restoreProduct,
  deleteProduct,
} from "@/server/actions/products"
import {
  PRODUCT_STATUSES,
  PRODUCT_STATUS_LABELS,
  type ProductStatus,
} from "@/lib/constants"

export function ProductRowActions({
  productId,
  name,
  status,
  archived,
}: {
  productId: string
  name: string
  status: ProductStatus
  archived: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    startTransition(async () => {
      const res = await fn()
      if (!res.ok) {
        toast.error(res.error ?? "Something went wrong. Please try again.")
        return
      }
      toast.success(success)
      router.refresh()
    })
  }

  function onDuplicate() {
    startTransition(async () => {
      const res = await duplicateProduct(productId)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success("Product duplicated. The copy has been saved as a draft.")
      router.push(`/admin/products/${res.data.id}/edit`)
    })
  }

  function onDelete() {
    startTransition(async () => {
      const res = await deleteProduct(productId)
      if (!res.ok) {
        toast.error(res.error)
        return
      }
      toast.success(
        res.data.archived
          ? "Product archived. Its order history has been preserved."
          : "Product deleted successfully.",
      )
      setConfirmOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Actions">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href={`/admin/products/${productId}/edit`}>
              <Pencil /> Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDuplicate} disabled={pending}>
            <Copy /> Duplicate
          </DropdownMenuItem>

          {!archived && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Set status
              </DropdownMenuLabel>
              {PRODUCT_STATUSES.map((s) => (
                <DropdownMenuItem
                  key={s}
                  disabled={pending || s === status}
                  onClick={() =>
                    run(() => setProductStatus(productId, s), `Status changed to ${PRODUCT_STATUS_LABELS[s]}.`)
                  }
                >
                  {s === status ? <Check /> : <span className="size-4" />}
                  {PRODUCT_STATUS_LABELS[s]}
                </DropdownMenuItem>
              ))}
            </>
          )}

          <DropdownMenuSeparator />
          {archived ? (
            <DropdownMenuItem
              disabled={pending}
              onClick={() => run(() => restoreProduct(productId), "Product restored successfully.")}
            >
              <ArchiveRestore /> Restore
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              disabled={pending}
              onClick={() => run(() => archiveProduct(productId), "Product archived successfully.")}
            >
              <Archive /> Archive
            </DropdownMenuItem>
          )}
          <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}>
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this product?</DialogTitle>
            <DialogDescription>
              Deleting <b>{name}</b> will remove its images and inventory. If it
              appears in any existing orders, it will be archived instead, so your
              order history is preserved. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onDelete} disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <Trash2 />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
