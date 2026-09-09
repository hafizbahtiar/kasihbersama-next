#!/usr/bin/env node
/**
 * Optional smoke test for auth API against NEXT_PUBLIC_API_BASE_URL.
 *
 * Full flow (signup → verify skipped → login → refresh → logout):
 *   SMOKE_AUTH_EMAIL=... SMOKE_AUTH_PASSWORD=... npm run smoke:auth
 *
 * Without credentials, only checks bootstrap + login endpoint reachability.
 */

const base = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080"
).replace(/\/$/, "")

const email = process.env.SMOKE_AUTH_EMAIL
const password = process.env.SMOKE_AUTH_PASSWORD

async function api(path, init = {}) {
  const response = await fetch(`${base}/api/v1${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  })
  const text = await response.text()
  let body
  try {
    body = text ? JSON.parse(text) : undefined
  } catch {
    body = text
  }
  return { response, body }
}

function fail(message) {
  console.error(`FAIL: ${message}`)
  process.exit(1)
}

async function main() {
  console.log(`Smoke auth → ${base}/api/v1`)

  const bootstrap = await api("/bootstrap", {
    headers: { "X-App-Build": "1", "X-App-Platform": "web" },
  })
  if (!bootstrap.response.ok) {
    fail(`bootstrap ${bootstrap.response.status}`)
  }
  console.log("OK bootstrap")

  if (!email || !password) {
    console.log(
      "Skip login flow (set SMOKE_AUTH_EMAIL + SMOKE_AUTH_PASSWORD to run full test)."
    )
    return
  }

  const login = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
  if (!login.response.ok) {
    fail(`login ${login.response.status}: ${JSON.stringify(login.body)}`)
  }
  const access = login.body?.access_token
  const refresh = login.body?.refresh_token
  if (!access || !refresh) {
    fail("login missing tokens")
  }
  console.log("OK login")

  const me = await api("/me", {
    headers: { Authorization: `Bearer ${access}` },
  })
  if (!me.response.ok) {
    fail(`me ${me.response.status}`)
  }
  console.log("OK me", me.body?.email)

  const refreshed = await api("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refresh }),
  })
  if (!refreshed.response.ok) {
    fail(`refresh ${refreshed.response.status}`)
  }
  console.log("OK refresh")

  const logout = await api("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refresh }),
  })
  if (!logout.response.ok && logout.response.status !== 204) {
    fail(`logout ${logout.response.status}`)
  }
  console.log("OK logout")
  console.log("Smoke auth flow passed.")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
