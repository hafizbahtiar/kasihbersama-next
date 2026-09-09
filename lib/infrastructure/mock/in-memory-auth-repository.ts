import type {
  AuthUser,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  TokenPair,
} from "@/lib/domain/auth"
import type { AuthRepository } from "@/lib/domain/auth-repository"

const MOCK_TOKENS: TokenPair = {
  accessToken: "mock-access",
  refreshToken: "mock-refresh",
}

/**
 * Mock-mode auth, so that running without a backend is a swap of the
 * repository rather than a branch in the UI.
 *
 * Every other domain already had this; auth alone did not, so AuthProvider
 * carried six inline `isMockDataEnabled()` branches that each reimplemented a
 * slice of sign-in against the seed user. Behaviour that belongs to an
 * implementation had leaked into the component consuming the interface.
 *
 * Accepts any credentials and always resolves to the seed user - it exists to
 * let the UI be exercised without a backend, not to model real auth.
 */
export class InMemoryAuthRepository implements AuthRepository {
  private user: AuthUser

  constructor(seedUser: AuthUser) {
    this.user = seedUser
  }

  async login(_input: LoginInput) {
    return MOCK_TOKENS
  }

  async register(input: RegisterInput) {
    this.user = {
      ...this.user,
      email: input.email,
      displayName: input.displayName,
    }
    return MOCK_TOKENS
  }

  async refresh(_refreshToken: string) {
    return MOCK_TOKENS
  }

  async logout(_refreshToken: string) {}

  async logoutAll() {}

  async verifyEmail(_token: string) {
    this.user = { ...this.user, emailVerified: true }
  }

  async forgotPassword(_email: string) {}

  async resetPassword(_input: ResetPasswordInput) {}

  async me() {
    return this.user
  }
}
