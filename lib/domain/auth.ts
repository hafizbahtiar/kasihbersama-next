/**
 * The signed-in account. The optional fields are what `/v1/auth/me` returns on
 * top of the essentials; the v0.1 account endpoints do not send them, so they
 * stay optional rather than forcing every mapper to invent a value.
 */
export type AuthUser = {
  id: string
  email: string
  displayName: string
  emailVerified: boolean
  status?: string
  locale?: string
  timezone?: string
  givenName?: string
  familyName?: string
}

export type TokenPair = {
  accessToken: string
  refreshToken: string
}

/**
 * What `POST /auth/login` can answer. A correct password with a second factor
 * enrolled does not produce a session - it produces a challenge, and the code
 * is the next request. Modelling it as an outcome rather than an error keeps
 * the caller from treating "one more step" as "something went wrong".
 */
export type LoginOutcome =
  | { status: "authenticated"; tokens: TokenPair }
  | { status: "mfaRequired"; challengeToken: string }

export type LoginInput = {
  email: string
  password: string
}

export type VerifyMfaInput = {
  challengeToken: string
  code: string
}

export type RegisterInput = {
  email: string
  password: string
  displayName: string
}

export type ResetPasswordInput = {
  token: string
  newPassword: string
}
