import type { AuthUser } from "@/lib/domain/auth"
import type { ApiUserDTO } from "@/lib/infrastructure/api/types"

/**
 * The v0.2 user wire shape, mapped once for every endpoint that returns one.
 * Both `GET`/`PATCH /me` and the account routes answer with this same
 * `userDTO`, so a second copy of this mapping would be a second thing to keep
 * in step with the backend.
 */
export function mapAuthUser(user: ApiUserDTO): AuthUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    emailVerified: user.email_verified,
    status: user.status,
    locale: user.locale,
    timezone: user.timezone,
    givenName: user.given_name,
    familyName: user.family_name,
  }
}
