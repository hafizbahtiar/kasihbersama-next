import type {
  LoginInput,
  LoginOutcome,
  RegisterInput,
  ResetPasswordInput,
  TokenPair,
  VerifyMfaInput,
} from "@/lib/domain/auth"
import type { AuthRepository } from "@/lib/domain/auth-repository"
import { currentDevice } from "@/lib/infrastructure/device-identity"
import { ApiError } from "@/lib/infrastructure/api/errors"
import type { ApiClient } from "@/lib/infrastructure/api/client"
import { mapAuthUser } from "@/lib/infrastructure/api/mappers/auth"
import type {
  ApiTokenDTO,
  LoginResponse,
  MeResponse,
  MfaConfirmResponse,
  MfaEnrollResponse,
  RegisterResponse,
  TokenPairResponse,
} from "@/lib/infrastructure/api/types"

function mapTokenPair(tokens: ApiTokenDTO): TokenPair {
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
  }
}

export class ApiAuthRepository implements AuthRepository {
  constructor(private readonly client: ApiClient) {}

  async login(input: LoginInput): Promise<LoginOutcome> {
    const response = await this.client.request<LoginResponse>("/auth/login", {
      method: "POST",
      skipAuth: true,
      skipRefresh: true,
      body: JSON.stringify({
        email: input.email,
        password: input.password,
        // Naming the device is what puts a row in the devices list - the
        // backend skips the whole upsert without an `install_id`. It is also
        // how a trusted device comes to skip the MFA prompt.
        device: currentDevice(),
      }),
    })

    // A correct password with a second factor enrolled. The challenge is a
    // 200, so it arrives through the success path, not the error path.
    if (response.mfa_required && response.challenge_token) {
      return {
        status: "mfaRequired",
        challengeToken: response.challenge_token,
      }
    }
    if (!response.tokens) {
      throw new ApiError("Respons log masuk tidak lengkap.", {
        code: "internal",
        status: 200,
      })
    }
    return { status: "authenticated", tokens: mapTokenPair(response.tokens) }
  }

  register(input: RegisterInput) {
    // Keyed so the client's retries reuse one account creation instead of
    // hitting `auth.email.taken` with the account the first attempt made.
    return this.client
      .request<RegisterResponse>("/auth/register", {
        method: "POST",
        skipAuth: true,
        skipRefresh: true,
        idempotencyKey: crypto.randomUUID(),
        body: JSON.stringify({
          email: input.email,
          password: input.password,
          display_name: input.displayName,
        }),
      })
      .then((response) => mapAuthUser(response.user))
  }

  refresh(refreshToken: string) {
    return this.client
      .request<TokenPairResponse>("/auth/refresh", {
        method: "POST",
        skipAuth: true,
        skipRefresh: true,
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
      .then((response) => mapTokenPair(response.tokens))
  }

  logout() {
    // No body: the backend ends the session the access token names.
    return this.client.request<void>("/auth/logout", { method: "POST" })
  }

  logoutAll() {
    return this.client.request<void>("/auth/sessions", { method: "DELETE" })
  }

  verifyEmail(token: string) {
    return this.client.request<void>("/auth/verify-email", {
      method: "POST",
      skipAuth: true,
      skipRefresh: true,
      body: JSON.stringify({ token }),
    })
  }

  resendVerification(email: string) {
    return this.client.request<void>("/auth/verification/resend", {
      method: "POST",
      skipAuth: true,
      skipRefresh: true,
      body: JSON.stringify({ email }),
    })
  }

  forgotPassword(email: string) {
    return this.client.request<void>("/auth/password/forgot", {
      method: "POST",
      skipAuth: true,
      skipRefresh: true,
      body: JSON.stringify({ email }),
    })
  }

  resetPassword(input: ResetPasswordInput) {
    return this.client.request<void>("/auth/password/reset", {
      method: "POST",
      skipAuth: true,
      skipRefresh: true,
      body: JSON.stringify({
        token: input.token,
        password: input.newPassword,
      }),
    })
  }

  verifyMfa(input: VerifyMfaInput) {
    return this.client
      .request<TokenPairResponse>("/auth/mfa/verify", {
        method: "POST",
        skipAuth: true,
        skipRefresh: true,
        body: JSON.stringify({
          challenge_token: input.challengeToken,
          code: input.code,
        }),
      })
      .then((response) => mapTokenPair(response.tokens))
  }

  enrollMfa() {
    return this.client
      .request<MfaEnrollResponse>("/auth/mfa/totp/enroll", { method: "POST" })
      .then((response) => ({
        secret: response.secret,
        otpauthUrl: response.otpauth_url,
      }))
  }

  confirmMfa(code: string) {
    return this.client
      .request<MfaConfirmResponse>("/auth/mfa/totp/confirm", {
        method: "POST",
        body: JSON.stringify({ code }),
      })
      .then((response) => ({ recoveryCodes: response.recovery_codes }))
  }

  confirmEmailChange(token: string) {
    // Public like the other inbox-link endpoints: the caller follows the link
    // from an e-mail and usually has no session.
    return this.client.request<void>("/auth/email/change/confirm", {
      method: "POST",
      skipAuth: true,
      skipRefresh: true,
      body: JSON.stringify({ token }),
    })
  }

  switchCircle(circleId: string) {
    return this.client.request<void>("/auth/switch-circle", {
      method: "POST",
      body: JSON.stringify({ circle_id: circleId }),
    })
  }

  me() {
    return this.client
      .request<MeResponse>("/me")
      .then((response) => mapAuthUser(response.user))
  }
}
