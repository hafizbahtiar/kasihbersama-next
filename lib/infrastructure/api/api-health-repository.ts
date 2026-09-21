import type {
  AllergySeverity,
  BloodType,
  ConditionStatus,
  HealthAllergy,
  HealthCondition,
  HealthProfile,
} from "@/lib/domain/health"
import type { HealthRepository } from "@/lib/domain/health-repository"
import type { ApiClient } from "@/lib/infrastructure/api/client"

type ApiProfile = {
  blood_type?: string
  is_organ_donor?: boolean
  emergency_contact_name?: string
  emergency_contact_phone?: string
  insurance_provider?: string
  insurance_policy_no?: string
  notes?: string
  updated_at?: string
}

type ApiCondition = {
  id: string
  name: string
  status: string
  diagnosed_on?: string
  resolved_on?: string
  notes?: string
  created_at: string
}

type ApiAllergy = {
  id: string
  allergen: string
  reaction?: string
  severity: string
  noted_on?: string
}

function mapProfile(api: ApiProfile): HealthProfile {
  return {
    bloodType: api.blood_type ? (api.blood_type as BloodType) : undefined,
    isOrganDonor: api.is_organ_donor,
    emergencyContactName: api.emergency_contact_name,
    emergencyContactPhone: api.emergency_contact_phone,
    insuranceProvider: api.insurance_provider,
    insurancePolicyNo: api.insurance_policy_no,
    notes: api.notes,
    updatedAt: api.updated_at,
  }
}

function mapCondition(api: ApiCondition): HealthCondition {
  return {
    id: api.id,
    name: api.name,
    status: api.status as ConditionStatus,
    diagnosedOn: api.diagnosed_on,
    resolvedOn: api.resolved_on,
    notes: api.notes,
    createdAt: api.created_at,
  }
}

function mapAllergy(api: ApiAllergy): HealthAllergy {
  return {
    id: api.id,
    allergen: api.allergen,
    reaction: api.reaction,
    severity: api.severity as AllergySeverity,
    notedOn: api.noted_on,
  }
}

export class ApiHealthRepository implements HealthRepository {
  constructor(private readonly client: ApiClient) {}

  private base(circleId: string, personId: string) {
    return `/circles/${circleId}/persons/${personId}/health`
  }

  getProfile(circleId: string, personId: string) {
    return this.client
      .request<{ exists: boolean; profile: ApiProfile }>(
        this.base(circleId, personId)
      )
      .then((body) => ({
        exists: body.exists,
        profile: mapProfile(body.profile ?? {}),
      }))
  }

  saveProfile(circleId: string, personId: string, profile: HealthProfile) {
    // PUT dan bukan PATCH: borang ini disunting sekaligus, jadi setiap medan
    // dihantar - termasuk yang kosong, yang bermakna "buang".
    return this.client
      .request<{ profile: ApiProfile }>(this.base(circleId, personId), {
        method: "PUT",
        body: JSON.stringify({
          blood_type: profile.bloodType ?? "",
          is_organ_donor: profile.isOrganDonor,
          emergency_contact_name: profile.emergencyContactName ?? "",
          emergency_contact_phone: profile.emergencyContactPhone ?? "",
          insurance_provider: profile.insuranceProvider ?? "",
          insurance_policy_no: profile.insurancePolicyNo ?? "",
          notes: profile.notes ?? "",
        }),
      })
      .then((body) => mapProfile(body.profile))
  }

  listConditions(circleId: string, personId: string) {
    return this.client
      .request<{ data: ApiCondition[] }>(
        `${this.base(circleId, personId)}/conditions`
      )
      .then((body) => (body.data ?? []).map(mapCondition))
  }

  createCondition(
    circleId: string,
    personId: string,
    input: {
      name: string
      status?: ConditionStatus
      diagnosedOn?: string
      notes?: string
    }
  ) {
    return this.client.request<void>(
      `${this.base(circleId, personId)}/conditions`,
      {
        method: "POST",
        body: JSON.stringify({
          name: input.name,
          status: input.status,
          diagnosed_on: input.diagnosedOn || undefined,
          notes: input.notes || undefined,
        }),
      }
    )
  }

  updateCondition(
    circleId: string,
    personId: string,
    conditionId: string,
    patch: { status?: ConditionStatus; notes?: string }
  ) {
    return this.client.request<void>(
      `${this.base(circleId, personId)}/conditions/${conditionId}`,
      { method: "PATCH", body: JSON.stringify(patch) }
    )
  }

  deleteCondition(circleId: string, personId: string, conditionId: string) {
    return this.client.request<void>(
      `${this.base(circleId, personId)}/conditions/${conditionId}`,
      { method: "DELETE" }
    )
  }

  listAllergies(circleId: string, personId: string) {
    return this.client
      .request<{ data: ApiAllergy[] }>(
        `${this.base(circleId, personId)}/allergies`
      )
      .then((body) => (body.data ?? []).map(mapAllergy))
  }

  createAllergy(
    circleId: string,
    personId: string,
    input: {
      allergen: string
      reaction?: string
      severity?: AllergySeverity
      notedOn?: string
    }
  ) {
    return this.client.request<void>(
      `${this.base(circleId, personId)}/allergies`,
      {
        method: "POST",
        body: JSON.stringify({
          allergen: input.allergen,
          reaction: input.reaction || undefined,
          severity: input.severity,
          noted_on: input.notedOn || undefined,
        }),
      }
    )
  }

  deleteAllergy(circleId: string, personId: string, allergyId: string) {
    return this.client.request<void>(
      `${this.base(circleId, personId)}/allergies/${allergyId}`,
      { method: "DELETE" }
    )
  }
}
