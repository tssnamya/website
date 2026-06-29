"use client"

import { useRef, useState } from "react"
import { Upload, X, Star, GripVertical, ImageIcon, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { ProductImageInput } from "@/lib/types"

const ACCEPT = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

export function ImageManager({
  value,
  onChange,
}: {
  value: ProductImageInput[]
  onChange: (images: ProductImageInput[]) => void
}) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [isOver, setIsOver] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i))
  }
  function setPrimary(i: number) {
    if (i === 0) return
    const next = [...value]
    const [item] = next.splice(i, 1)
    next.unshift(item)
    onChange(next)
  }
  function reorder(from: number, to: number) {
    if (from === to) return
    const next = [...value]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }

  async function uploadFiles(files: File[]) {
    const valid = files.filter((f) => ACCEPT.includes(f.type))
    const rejected = files.length - valid.length
    if (rejected > 0)
      toast.error("Some files were skipped. Please upload JPG, PNG, or WEBP images only.")
    if (valid.length === 0) return

    setUploading(true)
    try {
      const form = new FormData()
      valid.forEach((f) => form.append("files", f))
      const res = await fetch("/api/admin/upload", { method: "POST", body: form })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "The upload could not be completed. Please try again.")
        return
      }
      onChange([...value, ...(data.images as ProductImageInput[])])
      toast.success(
        data.images.length === 1
          ? "Image uploaded successfully."
          : `${data.images.length} images uploaded successfully.`,
      )
    } catch {
      toast.error("The upload could not be completed. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsOver(true)
        }}
        onDragLeave={() => setIsOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsOver(false)
          if (e.dataTransfer.files?.length) uploadFiles(Array.from(e.dataTransfer.files))
        }}
        onClick={() => fileInput.current?.click()}
        role="button"
        tabIndex={0}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-8 text-center transition-colors",
          isOver ? "border-primary bg-muted/60" : "border-border hover:bg-muted/40",
        )}
      >
        {uploading ? (
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        ) : (
          <Upload className="size-6 text-muted-foreground" />
        )}
        <p className="text-sm font-medium">
          {uploading ? "Uploading…" : "Drag and drop images here, or click to browse"}
        </p>
        <p className="text-xs text-muted-foreground">JPG, PNG, or WEBP. Multiple images allowed.</p>
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPT.join(",")}
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files?.length) uploadFiles(Array.from(e.target.files))
            e.target.value = ""
          }}
        />
      </div>

      {/* Thumbnails */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {value.map((img, i) => (
            <div
              key={`${img.url}-${i}`}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => {
                e.preventDefault()
                setOverIndex(i)
              }}
              onDrop={() => {
                if (dragIndex !== null) reorder(dragIndex, i)
                setDragIndex(null)
                setOverIndex(null)
              }}
              onDragEnd={() => {
                setDragIndex(null)
                setOverIndex(null)
              }}
              className={cn(
                "group relative aspect-square overflow-hidden rounded-lg border bg-muted",
                overIndex === i && dragIndex !== null
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.thumbnailUrl ?? img.url}
                alt=""
                className="size-full object-cover"
              />
              {i === 0 && (
                <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                  Primary
                </span>
              )}
              <span className="absolute right-1 top-1 cursor-grab rounded bg-background/80 p-0.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                <GripVertical className="size-3.5" />
              </span>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => setPrimary(i)}
                  disabled={i === 0}
                  title="Set as primary"
                  className="rounded p-1 text-white hover:bg-white/20 disabled:opacity-40"
                >
                  <Star className={cn("size-3.5", i === 0 && "fill-amber-400 text-amber-400")} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  title="Remove"
                  className="rounded p-1 text-white hover:bg-white/20"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {value.length === 0 && (
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ImageIcon className="size-3.5" /> No images yet. The first image you upload
          becomes the main product image.
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Drag images to reorder. The first image is shown as the main product image.
      </p>
    </div>
  )
}
