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

/** How much of one person's record a member sees (`person_access.level`). */
export type PersonAccessLevel = "summary" | "full"

export const ACCESS_LEVEL_LABELS: Record<PersonAccessLevel, string> = {
  summary: "Ringkasan",
  full: "Penuh",
}

/**
 * The two values this app writes for `persons.sex`. The column is free text
 * (`varchar(20)`), so anything else a client stored is still rendered as-is.
 */
export const SEX_OPTIONS = [
  { id: "F", label: "Perempuan" },
  { id: "M", label: "Lelaki" },
] as const

export function sexLabel(sex: string) {
  return SEX_OPTIONS.find((option) => option.id === sex)?.label ?? sex
}

/**
 * A row in a circle's person list.
 *
 * `ageYears` and not a birth date: the list is filtered by `person_access`, and
 * a summary grant carries age alone. The full date and the notes live on the
 * single-record read, which is also the only place field policies apply.
 */
export type CirclePerson = {
  id: string
  fullName: string
  preferredName?: string
  sex?: string
  ageYears?: number
  accessLevel: PersonAccessLevel
}

/** One person read on its own - the projection the caller's own access allows. */
export type CirclePersonDetail = {
  id: string
  circleId: string
  fullName: string
  preferredName?: string
  sex?: string
  ageYears?: number
  /** Full access only, and only when the field policy says `read`. */
  dateOfBirth?: string
  /** Full access only, and only when the field policy says `read`. */
  notes?: string
  /**
   * Restricted fields the caller may write back, including ones that are empty.
   *
   * An absent value cannot be told apart from a value the policy dropped, so
   * this list is what tells the edit form whether `date_of_birth` is missing
   * or merely hidden - and a hidden field sent back would blank it.
   */
  fieldsReadable: string[]
  accessLevel: PersonAccessLevel
}

/** Sparse, like every other patch here: an absent key is "do not touch". */
export type PersonPatch = {
  fullName?: string
  preferredName?: string
  dateOfBirth?: string
  sex?: string
  notes?: string
}

/** One row of "who may see this person". */
export type PersonAccessGrant = {
  memberId: string
  displayName: string
  email: string
  level: PersonAccessLevel
}

export type CircleSettings = {
  id: string
  name: string
  type: CircleType
  timezone: string
  currency: string
}

export type CircleSettingsPatch = {
  name?: string
  type?: CircleType
  timezone?: string
  currency?: string
}
