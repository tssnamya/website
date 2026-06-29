import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SESSION_COOKIE, verifySession } from "@/lib/session"

// Next.js 16 renamed the "middleware" convention to "proxy". This guards all
// /admin routes (except the login page) by validating the session cookie.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get(SESSION_COOKIE)?.value
  const session = token ? await verifySession(token) : null
  const isLogin = pathname === "/admin/login"

  if (!session && !isLogin) {
    const url = req.nextUrl.clone()
    url.pathname = "/admin/login"
    url.searchParams.set("from", pathname)
    return NextResponse.redirect(url)
  }

  if (session && isLogin) {
    const url = req.nextUrl.clone()
    url.pathname = "/admin"
    url.search = ""
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
