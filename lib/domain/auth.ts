export type AuthUser = {
  id: string
  email: string
  displayName: string
  emailVerified: boolean
}

export type TokenPair = {
  accessToken: string
  refreshToken: string
}

export type LoginInput = {
  email: string
  password: string
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
