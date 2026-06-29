"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function CopyButton({
  text,
  label = "Copy",
  className,
}: {
  text: string
  label?: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success("Copied to clipboard.")
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error("We could not copy that. Please copy it manually.")
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={copy}
      className={cn(className)}
    >
      {copied ? <Check /> : <Copy />}
      {label}
    </Button>
  )
}
