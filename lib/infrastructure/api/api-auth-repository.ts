import type {
  AuthUser,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  TokenPair,
} from "@/lib/domain/auth"
import type { AuthRepository } from "@/lib/domain/auth-repository"
import type { ApiClient } from "@/lib/infrastructure/api/client"
import type {
  MeResponse,
  TokenPairResponse,
} from "@/lib/infrastructure/api/types"

function mapTokenPair(response: TokenPairResponse): TokenPair {
  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
  }
}

function mapMe(response: MeResponse): AuthUser {
  return {
    id: response.id,
    email: response.email,
    displayName: response.display_name,
    emailVerified: response.email_verified,
  }
}

export class ApiAuthRepository implements AuthRepository {
  constructor(private readonly client: ApiClient) {}

  login(input: LoginInput) {
    return this.client
      .request<TokenPairResponse>("/auth/login", {
        method: "POST",
        skipAuth: true,
        skipRefresh: true,
        body: JSON.stringify({
          email: input.email,
          password: input.password,
        }),
      })
      .then(mapTokenPair)
  }

  register(input: RegisterInput) {
    return this.client
      .request<TokenPairResponse>("/auth/signup", {
        method: "POST",
        skipAuth: true,
        skipRefresh: true,
        body: JSON.stringify({
          email: input.email,
          password: input.password,
          display_name: input.displayName,
        }),
      })
      .then(mapTokenPair)
  }

  refresh(refreshToken: string) {
    return this.client
      .request<TokenPairResponse>("/auth/refresh", {
        method: "POST",
        skipAuth: true,
        skipRefresh: true,
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
      .then(mapTokenPair)
  }

  logout(refreshToken: string) {
    return this.client.request<void>("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
  }

  logoutAll() {
    return this.client.request<void>("/auth/logout-all", {
      method: "POST",
    })
  }

  verifyEmail(token: string) {
    return this.client.request<void>("/auth/verify-email", {
      method: "POST",
      skipAuth: true,
      skipRefresh: true,
      body: JSON.stringify({ token }),
    })
  }

  forgotPassword(email: string) {
    return this.client.request<void>("/auth/forgot-password", {
      method: "POST",
      skipAuth: true,
      skipRefresh: true,
      body: JSON.stringify({ email }),
    })
  }

  resetPassword(input: ResetPasswordInput) {
    return this.client.request<void>("/auth/reset-password", {
      method: "POST",
      skipAuth: true,
      skipRefresh: true,
      body: JSON.stringify({
        token: input.token,
        new_password: input.newPassword,
      }),
    })
  }

  me() {
    return this.client.request<MeResponse>("/me").then(mapMe)
  }
}
