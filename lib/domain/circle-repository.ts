import type {
  CircleInvitation,
  CircleMember,
  CircleMembership,
  CircleRole,
  CircleRoleInput,
  CircleRolePatch,
  CirclePerson,
  CirclePersonDetail,
  CircleSettings,
  CircleSettingsPatch,
  CircleType,
  MembershipStatus,
  PersonAccessGrant,
  PersonAccessLevel,
  PersonAddress,
  PersonAddressInput,
  PersonRelationship,
  RelationshipKind,
  PersonPatch,
} from "@/lib/domain/circle"
import type { Page } from "@/lib/domain/pagination"

export interface CircleRepository {
  createCircle(input: {
    name: string
    type?: CircleType
    timezone?: string
  }): Promise<CircleMembership["id"]>

  listMembers(circleId: string, cursor?: string): Promise<Page<CircleMember>>
  changeMemberRole(
    circleId: string,
    memberId: string,
    roleKey: string
  ): Promise<void>
  /** Suspend or restore. Leaving and removing are separate routes on purpose. */
  setMemberStatus(
    circleId: string,
    memberId: string,
    status: Extract<MembershipStatus, "active" | "suspended">
  ): Promise<void>
  removeMember(circleId: string, memberId: string): Promise<void>
  leaveCircle(circleId: string): Promise<void>
  transferOwnership(circleId: string, memberId: string): Promise<void>

  /** System roles and this circle's custom ones - the role pickers' source. */
  listRoles(circleId: string): Promise<CircleRole[]>
  createRole(circleId: string, input: CircleRoleInput): Promise<void>
  updateRole(
    circleId: string,
    roleId: string,
    patch: CircleRolePatch
  ): Promise<void>
  /** Refused (409) while any member still holds the role. */
  deleteRole(circleId: string, roleId: string): Promise<void>

  /** Invitations still waiting - accepted ones are members, so they are not here. */
  listInvitations(circleId: string): Promise<CircleInvitation[]>
  invite(
    circleId: string,
    input: { email: string; roleKey?: string }
  ): Promise<CircleInvitation>
  revokeInvitation(circleId: string, invitationId: string): Promise<void>
  /** The token arrives by email; it is never in an API response. */
  acceptInvitation(token: string): Promise<void>

  /** Persons the caller may see. No grant means an empty list, not an error. */
  listPersons(circleId: string): Promise<CirclePerson[]>
  /** One person, projected to what the caller's access and field policies allow. */
  getPerson(circleId: string, personId: string): Promise<CirclePersonDetail>
  createPerson(
    circleId: string,
    input: {
      fullName: string
      preferredName?: string
      dateOfBirth?: string
      sex?: string
    }
  ): Promise<void>
  updatePerson(
    circleId: string,
    personId: string,
    patch: PersonPatch
  ): Promise<void>
  /** Soft delete: the records of other modules still point at this person. */
  deletePerson(circleId: string, personId: string): Promise<void>

  /** Who may see this person. Reading it is `core.person.share`, not `read`. */
  listPersonAccess(
    circleId: string,
    personId: string
  ): Promise<PersonAccessGrant[]>
  /** A second grant on the same pair changes the level rather than failing. */
  grantPersonAccess(
    circleId: string,
    personId: string,
    memberId: string,
    level: PersonAccessLevel
  ): Promise<void>
  revokePersonAccess(
    circleId: string,
    personId: string,
    memberId: string
  ): Promise<void>

  listAddresses(circleId: string, personId: string): Promise<PersonAddress[]>
  /** Marking one primary unsets the old primary in the same transaction. */
  createAddress(
    circleId: string,
    personId: string,
    input: PersonAddressInput
  ): Promise<void>
  updateAddress(
    circleId: string,
    personId: string,
    addressId: string,
    input: PersonAddressInput
  ): Promise<void>
  deleteAddress(
    circleId: string,
    personId: string,
    addressId: string
  ): Promise<void>

  /** Edges out of this person; ones the caller may not read are left out. */
  listRelationships(
    circleId: string,
    personId: string
  ): Promise<PersonRelationship[]>
  createRelationship(
    circleId: string,
    personId: string,
    input: { relatedPersonId: string; kind: RelationshipKind; label?: string }
  ): Promise<void>
  /** Removes both directions. */
  deleteRelationship(
    circleId: string,
    personId: string,
    relationshipId: string
  ): Promise<void>

  getCircle(circleId: string): Promise<CircleSettings>
  /**
   * Soft delete, and only when the owner is the last member left - deleting a
   * circle that still has members destroys other people's records.
   */
  deleteCircle(circleId: string): Promise<void>
  updateCircle(
    circleId: string,
    patch: CircleSettingsPatch
  ): Promise<CircleSettings>

  /** Makes this circle the session's active one. Bootstrap must be re-read after. */
  switchCircle(circleId: string): Promise<void>
}
