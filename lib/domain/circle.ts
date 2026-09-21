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
 * A circle role - one of the six system roles, or a custom one this circle
 * defined (docs/02 §5.2). The server enforces every fence; `rank` is here so the
 * pickers can hide what the caller could never grant.
 */
export type CircleRole = {
  id: string
  key: string
  name: string
  description?: string
  rank: number
  isSystem: boolean
  permKeys: string[]
}

export type CircleRoleInput = {
  key: string
  name: string
  description?: string
  rank: number
  permKeys: string[]
}

/** Sparse: an absent key is "do not touch". `key` never changes. */
export type CircleRolePatch = Partial<Omit<CircleRoleInput, "key">>

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
  /** BAKI bulan selepas `ageYears`, bukan jumlah bulan. */
  ageMonths?: number
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
  ageMonths?: number
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

/**
 * Umur untuk dipaparkan. Bulan disebut hanya apabila ia bermakna: "71 tahun 3
 * bulan" ialah ketepatan yang tiada siapa minta, tetapi "0 tahun" untuk seorang
 * bayi lapan bulan menyembunyikan satu-satunya nombor yang penting.
 */
export function ageLabel(years?: number, months?: number) {
  if (typeof years !== "number") {
    return "—"
  }
  if (years === 0) {
    return `${months ?? 0} bulan`
  }
  if (years < 3 && months) {
    return `${years} tahun ${months} bulan`
  }
  return `${years} tahun`
}

/** One address of a person (`person_addresses`). Full access only. */
export type PersonAddress = {
  id: string
  label: string
  line1: string
  line2?: string
  city: string
  postcode?: string
  state?: string
  country: string
  notes?: string
  isPrimary: boolean
}

export type PersonAddressInput = Omit<PersonAddress, "id">

export type RelationshipKind =
  | "parent"
  | "child"
  | "spouse"
  | "sibling"
  | "grandparent"
  | "grandchild"
  | "guardian"
  | "other"

/** Read as "person ini ialah <label> kepada <related person>" - (A, B, parent) = A ibu B. */
export const RELATIONSHIP_KIND_LABELS: Record<RelationshipKind, string> = {
  parent: "Ibu/bapa",
  child: "Anak",
  spouse: "Pasangan",
  sibling: "Adik-beradik",
  grandparent: "Datuk/nenek",
  grandchild: "Cucu",
  guardian: "Penjaga",
  other: "Lain-lain",
}

/** One edge, seen from the person being viewed. The server writes the inverse. */
export type PersonRelationship = {
  id: string
  relatedPersonId: string
  relatedPersonName: string
  kind: RelationshipKind
  label?: string
}
