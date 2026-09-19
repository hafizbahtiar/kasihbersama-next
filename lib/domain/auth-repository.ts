import type {
  AuthUser,
  LoginInput,
  LoginOutcome,
  RegisterInput,
  ResetPasswordInput,
  TokenPair,
  VerifyMfaInput,
} from "@/lib/domain/auth"

export interface AuthRepository {
  login(input: LoginInput): Promise<LoginOutcome>
  /**
   * Creates the account but no session - the backend answers 201 with the
   * user alone, and refuses to log in until the address is verified.
   */
  register(input: RegisterInput): Promise<AuthUser>
  refresh(refreshToken: string): Promise<TokenPair>
  /** Ends the current session; the backend identifies it from the access token. */
  logout(): Promise<void>
  /** Revokes every session for the account, this one included. */
  logoutAll(): Promise<void>
  verifyEmail(token: string): Promise<void>
  /**
   * Sends a fresh verification link. Takes the address rather than reading the
   * session, because the caller is usually not signed in yet.
   */
  resendVerification(email: string): Promise<void>
  forgotPassword(email: string): Promise<void>
  resetPassword(input: ResetPasswordInput): Promise<void>
  /** Completes a login that answered with a challenge. */
  verifyMfa(input: VerifyMfaInput): Promise<TokenPair>
  /** Begins TOTP enrolment; the returned secret and URL are shown once, then
   * confirmed with `confirmMfa`. */
  enrollMfa(): Promise<{ secret: string; otpauthUrl: string }>
  /** Confirms the pending TOTP factor and returns its recovery codes, which the
   * server shows once and never again. */
  confirmMfa(code: string): Promise<{ recoveryCodes: string[] }>
  /**
   * Completes an email change from the link mailed to the new address.
   *
   * Public - the caller follows the link from their inbox, usually without a
   * session - so it is the counterpart to `AccountRepository.changeEmail`,
   * which only asks for the change.
   */
  confirmEmailChange(token: string): Promise<void>
  /** Makes another circle this session's active one. */
  switchCircle(circleId: string): Promise<void>
  me(): Promise<AuthUser>
}
