import type {
  CircleInvitation,
  CircleMember,
  CircleMembership,
  CirclePerson,
  CircleType,
  MembershipStatus,
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

  /** Invitations still waiting - accepted ones are members, so they are not here. */
  listInvitations(circleId: string): Promise<CircleInvitation[]>
  invite(
    circleId: string,
    input: { email: string; roleKey?: string }
  ): Promise<CircleInvitation>
  revokeInvitation(circleId: string, invitationId: string): Promise<void>
  /** The token arrives by email; it is never in an API response. */
  acceptInvitation(token: string): Promise<void>

  createPerson(
    circleId: string,
    input: {
      fullName: string
      preferredName?: string
      dateOfBirth?: string
      sex?: string
    }
  ): Promise<CirclePerson>

  /** Makes this circle the session's active one. Bootstrap must be re-read after. */
  switchCircle(circleId: string): Promise<void>
}
