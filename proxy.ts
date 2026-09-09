import { NextResponse, type NextRequest } from "next/server"

const PUBLIC_PATHS = new Set([
  "/",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/privacy",
  "/terms",
  "/accept/invite",
  "/accept/claim",
])

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) {
    return true
  }
  return pathname.startsWith("/accept/")
}

function shouldBypassProxy() {
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true") {
    return true
  }
  if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === "false") {
    return false
  }
  return !process.env.NEXT_PUBLIC_API_BASE_URL
}

export function proxy(request: NextRequest) {
  if (shouldBypassProxy()) {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl
  const refreshToken = request.cookies.get("kb-refresh-token")?.value
  const hasSession = Boolean(refreshToken)

  if (!isPublicPath(pathname) && !hasSession) {
    const loginUrl = new URL("/", request.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (pathname === "/" && hasSession) {
    const next = request.nextUrl.searchParams.get("next")
    if (next && next.startsWith("/") && !next.startsWith("//")) {
      return NextResponse.redirect(new URL(next, request.url))
    }
    return NextResponse.redirect(new URL("/home", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|brand/|logo.png|.*\\.png$|.*\\.svg$).*)",
  ],
}
