#!/usr/bin/env node
/**
 * Optional smoke test for auth API against NEXT_PUBLIC_API_BASE_URL.
 *
 * Full flow (verify skipped - it needs a mailbox, not a script):
 *   SMOKE_AUTH_EMAIL=... SMOKE_AUTH_PASSWORD=... npm run smoke:auth
 *
 * Without credentials, only checks the server is up.
 *
 * Register is deliberately absent: it needs an address no run has used before,
 * so a second run would fail on `auth.email.taken` rather than on anything
 * broken. It answers 201 with `{user}` and no tokens - creating the account is
 * not signing in.
 */

const base = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080"
).replace(/\/$/, "")

const email = process.env.SMOKE_AUTH_EMAIL
const password = process.env.SMOKE_AUTH_PASSWORD

// The backend serves its routes without the /api that the Next app's rewrite
// strips, so this script talks to it directly.
const apiPath = (path) => `${base}/v1${path}`

async function api(path, init = {}) {
  const response = await fetch(apiPath(path), {
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
  console.log(`Smoke auth → ${base}/v1`)

  const health = await fetch(`${base}/healthz`)
  if (!health.ok) {
    fail(`healthz ${health.status}`)
  }
  console.log("OK healthz")

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
  if (login.response.status === 403) {
    fail("login 403: the address is not verified yet")
  }
  if (!login.response.ok) {
    fail(`login ${login.response.status}: ${JSON.stringify(login.body)}`)
  }
  if (login.body?.mfa_required) {
    console.log(
      "MFA account: login answered with a challenge. Skipping the rest - the flow needs a TOTP code."
    )
    return
  }
  const access = login.body?.tokens?.access_token
  const refresh = login.body?.tokens?.refresh_token
  if (!access || !refresh) {
    fail("login missing tokens")
  }
  console.log("OK login")

  const me = await api("/auth/me", {
    headers: { Authorization: `Bearer ${access}` },
  })
  if (!me.response.ok) {
    fail(`me ${me.response.status}`)
  }
  console.log("OK me", me.body?.user?.email)

  const refreshed = await api("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refresh }),
  })
  if (!refreshed.response.ok) {
    fail(`refresh ${refreshed.response.status}`)
  }
  const rotated = refreshed.body?.tokens?.refresh_token
  if (!rotated) {
    fail("refresh missing tokens")
  }
  console.log("OK refresh")

  // Round trip the password so a wrong path or body field surfaces here as a
  // 404/400 instead of silently in the app. Changing the password keeps the
  // session it was called from, so the same access token works for the second
  // call - and the run leaves the password as it found it.
  const temporaryPassword = `${password}-smoke-check`
  const changed = await api("/auth/password/change", {
    method: "POST",
    headers: { Authorization: `Bearer ${access}` },
    body: JSON.stringify({
      current_password: password,
      new_password: temporaryPassword,
    }),
  })
  if (!changed.response.ok) {
    fail(`password change ${changed.response.status}: ${JSON.stringify(changed.body)}`)
  }
  const restored = await api("/auth/password/change", {
    method: "POST",
    headers: { Authorization: `Bearer ${access}` },
    body: JSON.stringify({
      current_password: temporaryPassword,
      new_password: password,
    }),
  })
  if (!restored.response.ok) {
    console.error(
      `FAIL: password restore ${restored.response.status}: ${JSON.stringify(restored.body)}`
    )
    // The change above stuck, so the account is now on the temporary value.
    // Naming it is the difference between a failed run and a lost login.
    console.error(`The account password is now: ${temporaryPassword}`)
    process.exit(1)
  }
  console.log("OK password change round trip")

  // Logout is authenticated: the backend ends the session the access token
  // names and ignores any body.
  const logout = await api("/auth/logout", {
    method: "POST",
    headers: { Authorization: `Bearer ${access}` },
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
