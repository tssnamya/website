"use client"

import { useState } from "react"
import Image from "next/image"
import { Menu, LogOut } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { AdminNav } from "@/components/admin/admin-nav"
import { logoutAction } from "@/server/actions/auth"
import { publicConfig } from "@/lib/config"

export function AdminMobileNav() {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3 lg:hidden">
      <div className="flex items-center gap-2">
        <Image
          src="/logo.png"
          alt={publicConfig.storeName}
          width={256}
          height={256}
          quality={100}
          className="size-9 rounded-full object-cover ring-1 ring-border"
        />
        <span className="font-heading text-sm font-semibold">
          {publicConfig.storeName}
        </span>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Open menu">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-4">
          <SheetHeader className="px-0">
            <SheetTitle className="font-heading">Admin</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <AdminNav onNavigate={() => setOpen(false)} />
          </div>
          <form action={logoutAction} className="mt-6">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground">
              <LogOut /> Sign out
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
