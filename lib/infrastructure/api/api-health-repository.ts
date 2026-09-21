import type {
  AllergySeverity,
  AppointmentStatus,
  BloodType,
  ConditionStatus,
  HealthAllergy,
  HealthAppointment,
  HealthCondition,
  HealthProfile,
  HealthVisit,
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

type ApiAppointment = {
  id: string
  purpose: string
  starts_at: string
  ends_at?: string
  location_note?: string
  status: string
  notes?: string
  created_at: string
}

type ApiVisit = {
  id: string
  visited_on: string
  reason?: string
  diagnosis?: string
  notes?: string
  cost_amount?: string
  cost_currency?: string
  follow_up_on?: string
  created_at: string
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

function mapAppointment(api: ApiAppointment): HealthAppointment {
  return {
    id: api.id,
    purpose: api.purpose,
    startsAt: api.starts_at,
    endsAt: api.ends_at,
    locationNote: api.location_note,
    status: api.status as AppointmentStatus,
    notes: api.notes,
    createdAt: api.created_at,
  }
}

function mapVisit(api: ApiVisit): HealthVisit {
  return {
    id: api.id,
    visitedOn: api.visited_on,
    reason: api.reason,
    diagnosis: api.diagnosis,
    notes: api.notes,
    costAmount: api.cost_amount,
    costCurrency: api.cost_currency,
    followUpOn: api.follow_up_on,
    createdAt: api.created_at,
  }
}

/**
 * `<input type="datetime-local">` memberi "2026-10-05T10:30" tanpa zon - masa
 * TEMPATAN pelayar. Menghantarnya begitu bermakna janji temu 10:30 pagi menjadi
 * 6:30 petang di Malaysia, jadi penukaran hidup di sempadan ini dan bukan dalam
 * setiap borang.
 */
function toUtc(local: string) {
  return new Date(local).toISOString()
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

  listAppointments(circleId: string, personId: string) {
    return this.client
      .request<{ data: ApiAppointment[] }>(
        `${this.base(circleId, personId)}/appointments`
      )
      .then((body) => (body.data ?? []).map(mapAppointment))
  }

  createAppointment(
    circleId: string,
    personId: string,
    input: {
      purpose: string
      startsAt: string
      endsAt?: string
      locationNote?: string
      status?: AppointmentStatus
      notes?: string
    }
  ) {
    return this.client.request<void>(
      `${this.base(circleId, personId)}/appointments`,
      {
        method: "POST",
        body: JSON.stringify({
          purpose: input.purpose,
          starts_at: toUtc(input.startsAt),
          ends_at: input.endsAt ? toUtc(input.endsAt) : undefined,
          location_note: input.locationNote || undefined,
          status: input.status,
          notes: input.notes || undefined,
        }),
      }
    )
  }

  updateAppointment(
    circleId: string,
    personId: string,
    appointmentId: string,
    patch: { status?: AppointmentStatus }
  ) {
    return this.client.request<void>(
      `${this.base(circleId, personId)}/appointments/${appointmentId}`,
      { method: "PATCH", body: JSON.stringify(patch) }
    )
  }

  deleteAppointment(circleId: string, personId: string, appointmentId: string) {
    return this.client.request<void>(
      `${this.base(circleId, personId)}/appointments/${appointmentId}`,
      { method: "DELETE" }
    )
  }

  listVisits(circleId: string, personId: string) {
    return this.client
      .request<{ data: ApiVisit[] }>(`${this.base(circleId, personId)}/visits`)
      .then((body) => (body.data ?? []).map(mapVisit))
  }

  createVisit(
    circleId: string,
    personId: string,
    input: {
      visitedOn: string
      reason?: string
      diagnosis?: string
      notes?: string
      costAmount?: string
      costCurrency?: string
      followUpOn?: string
    }
  ) {
    return this.client.request<void>(
      `${this.base(circleId, personId)}/visits`,
      {
        method: "POST",
        body: JSON.stringify({
          visited_on: input.visitedOn,
          reason: input.reason || undefined,
          diagnosis: input.diagnosis || undefined,
          notes: input.notes || undefined,
          cost_amount: input.costAmount || undefined,
          cost_currency: input.costCurrency || undefined,
          follow_up_on: input.followUpOn || undefined,
        }),
      }
    )
  }

  deleteVisit(circleId: string, personId: string, visitId: string) {
    return this.client.request<void>(
      `${this.base(circleId, personId)}/visits/${visitId}`,
      { method: "DELETE" }
    )
  }
}
