import type { NextConfig } from "next"

// NEXT_PUBLIC_API_BASE_URL stays the switch for "is a backend configured at
// all" (isMockDataEnabled reads the same variable), so the rewrite is only
// registered when it is set.
const publicBase = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "")

// Where the proxy actually sends the request. On Railway this is the backend's
// private domain, so the hop stays inside the project instead of leaving
// through the public edge and being billed as egress. The browser never sees
// this value - it only ever calls same-origin /api/v1/*.
const proxyTarget =
  process.env.API_INTERNAL_BASE_URL?.replace(/\/$/, "") || publicBase

const nextConfig: NextConfig = {
  async rewrites() {
    if (!publicBase || !proxyTarget) {
      return []
    }
    return [
      {
        source: "/api/v1/:path*",
        destination: `${proxyTarget}/api/v1/:path*`,
      },
    ]
  },
}

export default nextConfig
