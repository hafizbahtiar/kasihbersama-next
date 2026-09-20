/**
 * Circles are the family unit: one circle, many members, many persons.
 *
 * `CircleMembership` is what bootstrap returns - the circle plus the caller's
 * own membership in it. `CircleMember` is a row in one circle's member list,
 * which is a different question and carries other people's names.
 */
export type CircleType = "family" | "household" | "caregiving" | "other"

export const CIRCLE_TYPE_LABELS: Record<CircleType, string> = {
  family: "Keluarga",
  household: "Rumah",
  caregiving: "Penjagaan",
  other: "Lain-lain",
}

export type CircleMembership = {
  id: string
  name: string
  type: CircleType
  ownerUserId: string
  timezone: string
  /** The caller's own membership id in this circle - nearly every circle route needs it. */
  memberId: string
  roleKey: string
  joinedAt: string
}

export type MembershipStatus = "invited" | "active" | "suspended" | "left"

export type CircleMember = {
  id: string
  userId: string
  displayName: string
  email: string
  roleKey: string
  nickname?: string
  status: MembershipStatus
  joinedAt: string
}

/**
 * The roles an invite or a role change may name. `owner` is deliberately absent:
 * there is exactly one, and it moves only through transfer-ownership.
 */
export const ASSIGNABLE_ROLES = [
  "admin",
  "caregiver",
  "member",
  "viewer",
  "child",
] as const

export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number]

export const ROLE_LABELS: Record<string, string> = {
  owner: "Pemilik",
  admin: "Pentadbir",
  caregiver: "Penjaga",
  member: "Ahli",
  viewer: "Pemerhati",
  child: "Anak",
}

export function roleLabel(roleKey: string) {
  return ROLE_LABELS[roleKey] ?? roleKey
}

export type CircleInvitation = {
  id: string
  email: string
  roleKey: string
  status: string
  expiresAt: string
}

export type CirclePerson = {
  id: string
  circleId: string
  fullName: string
}
