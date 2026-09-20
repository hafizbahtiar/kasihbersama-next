import type {
  CircleInvitation,
  CircleMember,
  CirclePerson,
  CircleType,
  MembershipStatus,
} from "@/lib/domain/circle"
import type { CircleRepository } from "@/lib/domain/circle-repository"
import type { Page } from "@/lib/domain/pagination"
import type { ApiClient } from "@/lib/infrastructure/api/client"
import type { PageResponse } from "@/lib/infrastructure/api/types"

type ApiMember = {
  id: string
  user_id: string
  display_name?: string
  email?: string
  role_key: string
  nickname?: string
  status: string
  joined_at: string
}

type ApiInvitation = {
  id: string
  email: string
  role_key: string
  status: string
  expires_at: string
}

function mapMember(api: ApiMember): CircleMember {
  return {
    id: api.id,
    userId: api.user_id,
    // A member row always has a user behind it; the blank is only what the
    // wire shape allows, and an empty name should read as unknown, not "".
    displayName: api.display_name ?? "Ahli tanpa nama",
    email: api.email ?? "",
    roleKey: api.role_key,
    nickname: api.nickname,
    status: api.status as MembershipStatus,
    joinedAt: api.joined_at,
  }
}

function mapInvitation(api: ApiInvitation): CircleInvitation {
  return {
    id: api.id,
    email: api.email,
    roleKey: api.role_key,
    status: api.status,
    expiresAt: api.expires_at,
  }
}

export class ApiCircleRepository implements CircleRepository {
  constructor(private readonly client: ApiClient) {}

  createCircle(input: { name: string; type?: CircleType; timezone?: string }) {
    return this.client
      .request<{ circle: { id: string } }>("/circles", {
        method: "POST",
        body: JSON.stringify({
          name: input.name,
          type: input.type,
          timezone: input.timezone,
        }),
      })
      .then((body) => body.circle.id)
  }

  listMembers(circleId: string, cursor?: string): Promise<Page<CircleMember>> {
    const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""
    return this.client
      .request<PageResponse<ApiMember>>(`/circles/${circleId}/members${query}`)
      .then((body) => ({
        data: (body.data ?? []).map(mapMember),
        hasMore: body.meta?.has_more ?? false,
        nextCursor: body.meta?.next_cursor,
      }))
  }

  changeMemberRole(circleId: string, memberId: string, roleKey: string) {
    return this.client.request<void>(
      `/circles/${circleId}/members/${memberId}/role`,
      { method: "PATCH", body: JSON.stringify({ role_key: roleKey }) }
    )
  }

  setMemberStatus(
    circleId: string,
    memberId: string,
    status: Extract<MembershipStatus, "active" | "suspended">
  ) {
    return this.client.request<void>(
      `/circles/${circleId}/members/${memberId}/status`,
      { method: "PATCH", body: JSON.stringify({ status }) }
    )
  }

  removeMember(circleId: string, memberId: string) {
    return this.client.request<void>(
      `/circles/${circleId}/members/${memberId}`,
      { method: "DELETE" }
    )
  }

  leaveCircle(circleId: string) {
    return this.client.request<void>(`/circles/${circleId}/leave`, {
      method: "POST",
    })
  }

  transferOwnership(circleId: string, memberId: string) {
    return this.client.request<void>(`/circles/${circleId}/transfer-ownership`, {
      method: "POST",
      body: JSON.stringify({ new_owner_member_id: memberId }),
    })
  }

  listInvitations(circleId: string) {
    return this.client
      .request<{ data: ApiInvitation[] }>(`/circles/${circleId}/invitations`)
      .then((body) => (body.data ?? []).map(mapInvitation))
  }

  invite(circleId: string, input: { email: string; roleKey?: string }) {
    return this.client
      .request<{ invitation: ApiInvitation }>(
        `/circles/${circleId}/invitations`,
        {
          method: "POST",
          body: JSON.stringify({
            email: input.email,
            role_key: input.roleKey,
          }),
        }
      )
      .then((body) => mapInvitation(body.invitation))
  }

  revokeInvitation(circleId: string, invitationId: string) {
    return this.client.request<void>(
      `/circles/${circleId}/invitations/${invitationId}`,
      { method: "DELETE" }
    )
  }

  acceptInvitation(token: string) {
    return this.client.request<void>("/circles/invitations/accept", {
      method: "POST",
      body: JSON.stringify({ token }),
    })
  }

  createPerson(
    circleId: string,
    input: {
      fullName: string
      preferredName?: string
      dateOfBirth?: string
      sex?: string
    }
  ): Promise<CirclePerson> {
    return this.client
      .request<{ person: { id: string; circle_id: string; full_name: string } }>(
        `/circles/${circleId}/persons`,
        {
          method: "POST",
          body: JSON.stringify({
            full_name: input.fullName,
            preferred_name: input.preferredName,
            date_of_birth: input.dateOfBirth,
            sex: input.sex,
          }),
        }
      )
      .then((body) => ({
        id: body.person.id,
        circleId: body.person.circle_id,
        fullName: body.person.full_name,
      }))
  }

  switchCircle(circleId: string) {
    return this.client.request<void>("/auth/switch-circle", {
      method: "POST",
      body: JSON.stringify({ circle_id: circleId }),
    })
  }
}
