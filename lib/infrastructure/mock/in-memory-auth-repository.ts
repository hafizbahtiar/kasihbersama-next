import type {
  AuthUser,
  LoginInput,
  LoginOutcome,
  RegisterInput,
  ResetPasswordInput,
  TokenPair,
  VerifyMfaInput,
} from "@/lib/domain/auth"
import type { AuthRepository } from "@/lib/domain/auth-repository"

const MOCK_TOKENS: TokenPair = {
  accessToken: "mock-access",
  refreshToken: "mock-refresh",
}

// Fixed fakes: the point is to reach the screen that shows a secret and then
// the one that shows recovery codes, not to model TOTP.
const MOCK_MFA_SECRET = "JBSWY3DPEHPK3PXP"
const MOCK_MFA_OTPAUTH_URL =
  "otpauth://totp/Kasih%20Bersama:penjaga@contoh.com" +
  `?secret=${MOCK_MFA_SECRET}&issuer=Kasih%20Bersama`
const MOCK_RECOVERY_CODES = ["MOCK-AAAA-1111", "MOCK-BBBB-2222"]

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
 * let the UI be exercised without a backend, not to model real auth. There is
 * no MFA here for the same reason: the real backend only challenges accounts
 * that enrolled a factor, and the seed account has none.
 */
export class InMemoryAuthRepository implements AuthRepository {
  private user: AuthUser

  constructor(seedUser: AuthUser) {
    this.user = seedUser
  }

  async login(_input: LoginInput): Promise<LoginOutcome> {
    return { status: "authenticated", tokens: MOCK_TOKENS }
  }

  // Mirrors the real contract: registering creates the account and nothing
  // else. The backend leaves the address unverified and refuses to log in
  // until it is confirmed, so the mock does the same.
  async register(input: RegisterInput): Promise<AuthUser> {
    this.user = {
      ...this.user,
      email: input.email,
      displayName: input.displayName,
      emailVerified: false,
    }
    return this.user
  }

  async refresh(_refreshToken: string) {
    return MOCK_TOKENS
  }

  async logout() {}

  async logoutAll() {}

  async resendVerification(_email: string) {}

  async verifyEmail(_token: string) {
    this.user = { ...this.user, emailVerified: true }
  }

  async forgotPassword(_email: string) {}

  async resetPassword(_input: ResetPasswordInput) {}

  async verifyMfa(_input: VerifyMfaInput) {
    return MOCK_TOKENS
  }

  async enrollMfa() {
    return { secret: MOCK_MFA_SECRET, otpauthUrl: MOCK_MFA_OTPAUTH_URL }
  }

  // Accepts any code, like login accepts any password: mock mode exists to
  // drive the UI, not to reject.
  async confirmMfa(_code: string) {
    return { recoveryCodes: [...MOCK_RECOVERY_CODES] }
  }

  // The mock tracks no pending address - the account mock's changeEmail moves
  // it in one step - so there is nothing to confirm here.
  async confirmEmailChange(_token: string) {}

  // Likewise no active-circle state in the auth mock, so nothing to switch.
  async switchCircle(_circleId: string) {}

  async me() {
    return this.user
  }
}
