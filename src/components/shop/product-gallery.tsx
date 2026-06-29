"use client"

import { useState } from "react"
import Image from "next/image"
import { ImageOff } from "lucide-react"
import { cn } from "@/lib/utils"

export function ProductGallery({
  images,
  name,
}: {
  images: string[]
  name: string
}) {
  const [active, setActive] = useState(0)
  const main = images[active] ?? images[0]

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border bg-muted">
        {main ? (
          <Image
            src={main}
            alt={name}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageOff className="size-8" />
            <span className="text-sm">No image available</span>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img, i) => (
            <button
              key={`${img}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              className={cn(
                "relative aspect-square w-16 overflow-hidden rounded-lg border transition-all",
                i === active
                  ? "border-foreground ring-2 ring-foreground/15"
                  : "border-border opacity-70 hover:opacity-100",
              )}
            >
              <Image
                src={img}
                alt={`${name} thumbnail ${i + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
