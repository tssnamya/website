import { Suspense } from "react"
import Image from "next/image"
import { LoginForm } from "@/components/admin/login-form"
import { publicConfig } from "@/lib/config"

export const dynamic = "force-dynamic"

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <Image
            src="/logo.png"
            alt={publicConfig.storeName}
            width={256}
            height={256}
            quality={100}
            priority
            className="size-20 rounded-full object-cover ring-1 ring-border"
          />
          <h1 className="font-heading text-xl font-semibold">
            {publicConfig.storeName}
          </h1>
          <p className="text-sm text-muted-foreground">Admin dashboard</p>
        </div>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>

        <p className="text-center text-xs text-muted-foreground">
          Protected area. Authorized personnel only.
        </p>
      </div>
    </div>
  )
}
