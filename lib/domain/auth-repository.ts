import type {
  AuthUser,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  TokenPair,
} from "@/lib/domain/auth"

export interface AuthRepository {
  login(input: LoginInput): Promise<TokenPair>
  register(input: RegisterInput): Promise<TokenPair>
  refresh(refreshToken: string): Promise<TokenPair>
  logout(refreshToken: string): Promise<void>
  logoutAll(): Promise<void>
  verifyEmail(token: string): Promise<void>
  resendVerification(): Promise<void>
  forgotPassword(email: string): Promise<void>
  resetPassword(input: ResetPasswordInput): Promise<void>
  me(): Promise<AuthUser>
}
