import type {
  CircleInvitation,
  CircleMember,
  CirclePerson,
  CirclePersonDetail,
  CircleSettings,
  CircleSettingsPatch,
  CircleType,
  MembershipStatus,
  PersonAccessGrant,
  PersonAccessLevel,
  PersonPatch,
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

type ApiPersonListRow = {
  id: string
  full_name: string
  preferred_name?: string
  sex?: string
  age_years?: number
  age_months?: number
  access_level: string
}

type ApiPersonDetail = ApiPersonListRow & {
  circle_id: string
  date_of_birth?: string
  notes?: string
  fields_readable?: string[]
}

type ApiPersonAccessGrant = {
  member_id: string
  display_name: string
  email?: string
  level: string
}

type ApiCircle = {
  id: string
  name: string
  type: string
  timezone: string
  currency: string
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

function mapPersonRow(api: ApiPersonListRow): CirclePerson {
  return {
    id: api.id,
    fullName: api.full_name,
    preferredName: api.preferred_name,
    sex: api.sex,
    ageYears: api.age_years,
    ageMonths: api.age_months,
    accessLevel: api.access_level as PersonAccessLevel,
  }
}

function mapPersonDetail(api: ApiPersonDetail): CirclePersonDetail {
  return {
    ...mapPersonRow(api),
    circleId: api.circle_id,
    dateOfBirth: api.date_of_birth,
    notes: api.notes,
    fieldsReadable: api.fields_readable ?? [],
  }
}

function mapCircle(api: ApiCircle): CircleSettings {
  return {
    id: api.id,
    name: api.name,
    type: api.type as CircleType,
    timezone: api.timezone,
    currency: api.currency,
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
  ) {
    return this.client.request<void>(`/circles/${circleId}/persons`, {
      method: "POST",
      body: JSON.stringify({
        full_name: input.fullName,
        preferred_name: input.preferredName,
        date_of_birth: input.dateOfBirth,
        sex: input.sex,
      }),
    })
  }

  listPersons(circleId: string) {
    return this.client
      .request<{ data: ApiPersonListRow[] }>(`/circles/${circleId}/persons`)
      .then((body) => (body.data ?? []).map(mapPersonRow))
  }

  getPerson(circleId: string, personId: string) {
    return this.client
      .request<{ person: ApiPersonDetail }>(
        `/circles/${circleId}/persons/${personId}`
      )
      .then((body) => mapPersonDetail(body.person))
  }

  updatePerson(circleId: string, personId: string, patch: PersonPatch) {
    // Sparse body, same contract as everywhere else: a key that is absent is
    // left alone. That is what keeps a summary-level reader - who never
    // received `date_of_birth` or `notes` - from blanking them by saving a
    // form it could not fill.
    const body: Record<string, unknown> = {}
    if (patch.fullName !== undefined) body.full_name = patch.fullName
    if (patch.preferredName !== undefined) {
      body.preferred_name = patch.preferredName
    }
    if (patch.dateOfBirth !== undefined) body.date_of_birth = patch.dateOfBirth
    if (patch.sex !== undefined) body.sex = patch.sex
    if (patch.notes !== undefined) body.notes = patch.notes

    return this.client.request<void>(
      `/circles/${circleId}/persons/${personId}`,
      { method: "PATCH", body: JSON.stringify(body) }
    )
  }

  deletePerson(circleId: string, personId: string) {
    return this.client.request<void>(
      `/circles/${circleId}/persons/${personId}`,
      { method: "DELETE" }
    )
  }

  listPersonAccess(circleId: string, personId: string) {
    return this.client
      .request<{ data: ApiPersonAccessGrant[] }>(
        `/circles/${circleId}/persons/${personId}/access`
      )
      .then((body) =>
        (body.data ?? []).map(
          (row): PersonAccessGrant => ({
            memberId: row.member_id,
            displayName: row.display_name,
            email: row.email ?? "",
            level: row.level as PersonAccessLevel,
          })
        )
      )
  }

  grantPersonAccess(
    circleId: string,
    personId: string,
    memberId: string,
    level: PersonAccessLevel
  ) {
    return this.client.request<void>(
      `/circles/${circleId}/persons/${personId}/access/${memberId}`,
      { method: "PUT", body: JSON.stringify({ level }) }
    )
  }

  revokePersonAccess(circleId: string, personId: string, memberId: string) {
    return this.client.request<void>(
      `/circles/${circleId}/persons/${personId}/access/${memberId}`,
      { method: "DELETE" }
    )
  }

  getCircle(circleId: string) {
    return this.client
      .request<{ circle: ApiCircle }>(`/circles/${circleId}`)
      .then((body) => mapCircle(body.circle))
  }

  deleteCircle(circleId: string) {
    return this.client.request<void>(`/circles/${circleId}`, {
      method: "DELETE",
    })
  }

  updateCircle(circleId: string, patch: CircleSettingsPatch) {
    const body: Record<string, unknown> = {}
    if (patch.name !== undefined) body.name = patch.name
    if (patch.type !== undefined) body.type = patch.type
    if (patch.timezone !== undefined) body.timezone = patch.timezone
    if (patch.currency !== undefined) body.currency = patch.currency

    return this.client
      .request<{ circle: ApiCircle }>(`/circles/${circleId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      })
      .then((response) => mapCircle(response.circle))
  }

  switchCircle(circleId: string) {
    return this.client.request<void>("/auth/switch-circle", {
      method: "POST",
      body: JSON.stringify({ circle_id: circleId }),
    })
  }
}
