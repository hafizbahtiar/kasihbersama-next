"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { ensureApiClient } from "@/lib/composition/api-client"
import { getAccountRepository } from "@/lib/composition/account-repository"
import { getAuthRepository } from "@/lib/composition/auth-repository"
import { clearAppSessionState } from "@/lib/application/app-session-state"
import { isMockDataEnabled } from "@/lib/infrastructure/config"
import type {
  AuthUser,
  LoginInput,
  LoginOutcome,
  RegisterInput,
  ResetPasswordInput,
  VerifyMfaInput,
} from "@/lib/domain/auth"
import {
  messageForApiError,
  normalizeApiError,
  type ApiError,
} from "@/lib/infrastructure/api/errors"
import { sessionSync } from "@/lib/infrastructure/api/session-sync"
import { tokenStorage } from "@/lib/infrastructure/api/token-storage"

type AuthStatus = "loading" | "authenticated" | "unauthenticated"

type AuthContextValue = {
  status: AuthStatus
  user: AuthUser | null
  error: ApiError | null
  /**
   * Resolves to the outcome so the caller can continue into the second step
   * when a factor is required. `null` means the attempt failed, and the reason
   * is on `error`.
   */
  login: (
    input: LoginInput,
    redirectTo?: string
  ) => Promise<LoginOutcome | null>
  verifyMfa: (input: VerifyMfaInput, redirectTo?: string) => Promise<boolean>
  register: (input: RegisterInput) => Promise<void>
  logout: () => Promise<void>
  logoutAll: () => Promise<void>
  updateDisplayName: (displayName: string) => Promise<void>
  verifyEmail: (token: string) => Promise<boolean>
  /** Falls back to the signed-in user's address when none is given. */
  resendVerification: (email?: string) => Promise<boolean>
  forgotPassword: (email: string) => Promise<boolean>
  resetPassword: (input: ResetPasswordInput) => Promise<void>
  clearError: () => void
  retryBootstrap: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** Only in-app paths; an absolute or protocol-relative URL is someone else's site. */
function safeDestination(redirectTo?: string) {
  return redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
    ? redirectTo
    : "/home"
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [status, setStatus] = useState<AuthStatus>("loading")
  const [user, setUser] = useState<AuthUser | null>(null)
  const [error, setError] = useState<ApiError | null>(null)

  const bootstrap = useCallback(async () => {
    // Mock mode has no real session to restore, and its repository always
    // resolves a user, so skip the session check and sign in automatically.
    // This is the only place the provider still asks which mode it is in -
    // every other path goes through AuthRepository, which is swapped for an
    // in-memory implementation in lib/composition/auth-repository.ts.
    if (!isMockDataEnabled() && !tokenStorage.hasSession()) {
      tokenStorage.clearSessionCookieOnly()
      setUser(null)
      setStatus("unauthenticated")
      return
    }

    try {
      setError(null)
      const me = await getAuthRepository().me()
      setUser(me)
      setStatus("authenticated")
    } catch (cause) {
      tokenStorage.clear()
      setUser(null)
      setStatus("unauthenticated")
      // Expired or invalid sessions are expected; keep auth forms clean.
      void cause
    }
  }, [])

  useEffect(() => {
    const client = ensureApiClient()
    client.onAuthFailure = () => {
      clearAppSessionState()
      setUser(null)
      setStatus("unauthenticated")
      router.replace("/")
    }
    // Load-on-mount: the loader flips isLoading synchronously before its first
    // await, which the compiler rule flags. Safe here - it is one extra render
    // on mount, and the alternative (deferring the flip) would show a stale
    // "loaded" frame first.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void bootstrap()

    return sessionSync.subscribe((event) => {
      if (event === "signed-out") {
        clearAppSessionState()
        setUser(null)
        setStatus("unauthenticated")
        router.replace("/")
        return
      }
      if (event === "signed-in" && !tokenStorage.hasSession()) {
        return
      }
      if (event === "signed-in") {
        void bootstrap()
      }
    })
  }, [bootstrap, router])

  const clearLocalSession = useCallback(() => {
    clearAppSessionState()
    tokenStorage.clear()
    setUser(null)
    setStatus("unauthenticated")
  }, [])

  const persistSession = useCallback(
    async (tokens: { accessToken: string; refreshToken: string }) => {
      tokenStorage.saveTokens(tokens.accessToken, tokens.refreshToken)
      const me = await getAuthRepository().me()
      setUser(me)
      setStatus("authenticated")
      setError(null)
    },
    []
  )

  const handleAuthError = useCallback((cause: unknown): ApiError => {
    const apiError = normalizeApiError(cause)
    setError(apiError)
    toast.error(messageForApiError(apiError))
    return apiError
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      error,
      clearError: () => setError(null),
      retryBootstrap: bootstrap,
      async login(input, redirectTo) {
        const destination = safeDestination(redirectTo)
        try {
          const outcome = await getAuthRepository().login(input)
          if (outcome.status === "mfaRequired") {
            // Not a failure and not a session: hand the challenge back so the
            // form can ask for the code.
            setError(null)
            return outcome
          }
          await persistSession(outcome.tokens)
          router.push(destination)
          return outcome
        } catch (cause) {
          handleAuthError(cause)
          return null
        }
      },
      async verifyMfa(input, redirectTo) {
        const destination = safeDestination(redirectTo)
        try {
          const tokens = await getAuthRepository().verifyMfa(input)
          await persistSession(tokens)
          router.push(destination)
          return true
        } catch (cause) {
          handleAuthError(cause)
          return false
        }
      },
      async register(input) {
        try {
          await getAuthRepository().register(input)
          // Registering returns no session - the backend will not log the
          // account in until the address is verified. Drop any previous
          // session so the verify screen speaks for the new account.
          clearAppSessionState()
          tokenStorage.clear()
          setUser(null)
          setStatus("unauthenticated")
          setError(null)
          toast.success("Akaun dicipta.", {
            description:
              "Kami telah menghantar pautan pengesahan. Sahkan e-mel anda sebelum log masuk.",
          })
          router.push(
            `/verify-email?email=${encodeURIComponent(input.email.trim())}`
          )
        } catch (cause) {
          handleAuthError(cause)
        }
      },
      async logoutAll() {
        try {
          await getAuthRepository().logoutAll()
          clearLocalSession()
          toast.success("Semua sesi ditamatkan.")
          router.push("/")
        } catch (cause) {
          handleAuthError(cause)
        }
      },
      async updateDisplayName(displayName) {
        const trimmed = displayName.trim()
        if (!trimmed) {
          return
        }
        try {
          const updated =
            await getAccountRepository().updateDisplayName(trimmed)
          setUser(updated)
          toast.success("Nama disimpan.")
        } catch (cause) {
          handleAuthError(cause)
        }
      },
      async logout() {
        try {
          // The backend revokes the session named by the access token, so this
          // has to run before the token is dropped.
          await getAuthRepository().logout()
        } catch {
          // An expired session is nothing to report - clearing locally is the
          // outcome the user asked for either way.
        } finally {
          clearLocalSession()
        }
        router.push("/")
      },
      async verifyEmail(token) {
        try {
          await getAuthRepository().verifyEmail(token)
          toast.success("E-mel disahkan.")
          await bootstrap()
          return true
        } catch (cause) {
          handleAuthError(cause)
          return false
        }
      },
      async resendVerification(email) {
        // Usually called before sign-in, when there is no user to read - hence
        // the address can be passed in explicitly.
        const address = (email ?? user?.email ?? "").trim()
        if (!address) {
          toast.error("Tiada alamat e-mel untuk dihantar.")
          return false
        }
        try {
          await getAuthRepository().resendVerification(address)
          toast.success("E-mel pengesahan dihantar.", {
            description:
              "Pautan sah selama 24 jam. Semak folder spam jika tiada dalam peti masuk.",
          })
          return true
        } catch (cause) {
          handleAuthError(cause)
          return false
        }
      },
      async forgotPassword(email) {
        try {
          await getAuthRepository().forgotPassword(email)
          toast.success("Pautan set semula dihantar jika e-mel wujud.")
          return true
        } catch (cause) {
          handleAuthError(cause)
          return false
        }
      },
      async resetPassword(input) {
        try {
          await getAuthRepository().resetPassword(input)
          toast.success("Kata laluan dikemas kini. Sila log masuk.")
          router.push("/")
        } catch (cause) {
          handleAuthError(cause)
        }
      },
    }),
    [
      bootstrap,
      clearLocalSession,
      handleAuthError,
      persistSession,
      router,
      status,
      user,
      error,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("AuthProvider diperlukan.")
  }
  return context
}

export function useRequireAuth() {
  const auth = useAuth()
  if (auth.status === "loading") {
    return { ...auth, ready: false as const }
  }
  if (auth.status === "unauthenticated") {
    return { ...auth, ready: false as const }
  }
  return { ...auth, ready: true as const }
}
