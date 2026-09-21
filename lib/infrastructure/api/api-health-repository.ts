import type {
  AllergySeverity,
  AppointmentStatus,
  DoseStatus,
  HealthDose,
  HealthMedication,
  HealthSchedule,
  Immunisation,
  MedicationForm,
  BloodType,
  ConditionStatus,
  HealthAllergy,
  HealthAppointment,
  HealthCondition,
  HealthProfile,
  HealthVisit,
  VitalReading,
  VitalType,
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

type ApiMedication = {
  id: string
  name: string
  form: string
  strength?: string
  instructions?: string
  started_on: string
  ended_on?: string
  is_active: boolean
  quantity_left?: string
  refill_due_on?: string
  notes?: string
}

type ApiSchedule = {
  id: string
  time_of_day: string
  days_of_week?: number[]
  dose_amount: string
  dose_unit: string
  with_food?: boolean
  starts_on: string
  ends_on?: string
  is_active: boolean
}

type ApiDose = {
  schedule_id: string
  medication_id: string
  name: string
  form?: string
  strength?: string
  instructions?: string
  time_of_day: string
  scheduled_at: string
  dose_amount: string
  dose_unit: string
  with_food?: boolean
  status?: string
  recorded_at?: string
  note?: string
}

type ApiVitalType = {
  id: string
  key: string
  name: string
  unit: string
  has_secondary: boolean
  secondary_unit?: string
}

type ApiVitalReading = {
  id: string
  vital_type_id: string
  value_primary: string
  value_secondary?: string
  measured_at: string
  note?: string
  created_at: string
}

type ApiImmunisation = {
  id: string
  vaccine: string
  dose_number?: number
  given_on?: string
  batch_no?: string
  next_due_on?: string
  notes?: string
  created_at: string
}

function mapMedication(api: ApiMedication): HealthMedication {
  return {
    id: api.id,
    name: api.name,
    form: api.form as MedicationForm,
    strength: api.strength,
    instructions: api.instructions,
    startedOn: api.started_on,
    endedOn: api.ended_on,
    isActive: api.is_active,
    quantityLeft: api.quantity_left,
    refillDueOn: api.refill_due_on,
    notes: api.notes,
  }
}

function mapSchedule(api: ApiSchedule): HealthSchedule {
  return {
    id: api.id,
    timeOfDay: api.time_of_day,
    daysOfWeek: api.days_of_week,
    doseAmount: api.dose_amount,
    doseUnit: api.dose_unit,
    withFood: api.with_food,
    startsOn: api.starts_on,
    endsOn: api.ends_on,
    isActive: api.is_active,
  }
}

function mapDose(api: ApiDose): HealthDose {
  return {
    scheduleId: api.schedule_id,
    medicationId: api.medication_id,
    name: api.name,
    form: api.form as MedicationForm | undefined,
    strength: api.strength,
    instructions: api.instructions,
    timeOfDay: api.time_of_day,
    scheduledAt: api.scheduled_at,
    doseAmount: api.dose_amount,
    doseUnit: api.dose_unit,
    withFood: api.with_food,
    status: api.status as DoseStatus | undefined,
    recordedAt: api.recorded_at,
    note: api.note,
  }
}

function mapVitalType(api: ApiVitalType): VitalType {
  return {
    id: api.id,
    key: api.key,
    name: api.name,
    unit: api.unit,
    hasSecondary: api.has_secondary,
    secondaryUnit: api.secondary_unit,
  }
}

function mapVitalReading(api: ApiVitalReading): VitalReading {
  return {
    id: api.id,
    vitalTypeId: api.vital_type_id,
    valuePrimary: api.value_primary,
    valueSecondary: api.value_secondary,
    measuredAt: api.measured_at,
    note: api.note,
    createdAt: api.created_at,
  }
}

function mapImmunisation(api: ApiImmunisation): Immunisation {
  return {
    id: api.id,
    vaccine: api.vaccine,
    doseNumber: api.dose_number,
    givenOn: api.given_on,
    batchNo: api.batch_no,
    nextDueOn: api.next_due_on,
    notes: api.notes,
    createdAt: api.created_at,
  }
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

  listMedications(circleId: string, personId: string) {
    return this.client
      .request<{ data: ApiMedication[] }>(
        `${this.base(circleId, personId)}/medications`
      )
      .then((body) => (body.data ?? []).map(mapMedication))
  }

  createMedication(
    circleId: string,
    personId: string,
    input: {
      name: string
      form?: MedicationForm
      strength?: string
      instructions?: string
      startedOn: string
      endedOn?: string
      quantityLeft?: string
      refillDueOn?: string
      notes?: string
    }
  ) {
    return this.client.request<void>(
      `${this.base(circleId, personId)}/medications`,
      {
        method: "POST",
        body: JSON.stringify({
          name: input.name,
          form: input.form,
          strength: input.strength || undefined,
          instructions: input.instructions || undefined,
          started_on: input.startedOn,
          ended_on: input.endedOn || undefined,
          quantity_left: input.quantityLeft || undefined,
          refill_due_on: input.refillDueOn || undefined,
          notes: input.notes || undefined,
        }),
      }
    )
  }

  updateMedication(
    circleId: string,
    personId: string,
    medicationId: string,
    patch: { isActive?: boolean; endedOn?: string; quantityLeft?: string }
  ) {
    return this.client.request<void>(
      `${this.base(circleId, personId)}/medications/${medicationId}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          is_active: patch.isActive,
          ended_on: patch.endedOn,
          quantity_left: patch.quantityLeft,
        }),
      }
    )
  }

  deleteMedication(circleId: string, personId: string, medicationId: string) {
    return this.client.request<void>(
      `${this.base(circleId, personId)}/medications/${medicationId}`,
      { method: "DELETE" }
    )
  }

  listSchedules(circleId: string, personId: string, medicationId: string) {
    return this.client
      .request<{ data: ApiSchedule[] }>(
        `${this.base(circleId, personId)}/medications/${medicationId}/schedules`
      )
      .then((body) => (body.data ?? []).map(mapSchedule))
  }

  createSchedule(
    circleId: string,
    personId: string,
    medicationId: string,
    input: {
      timeOfDay: string
      daysOfWeek?: number[]
      doseAmount: string
      doseUnit?: string
      withFood?: boolean
    }
  ) {
    return this.client.request<void>(
      `${this.base(circleId, personId)}/medications/${medicationId}/schedules`,
      {
        method: "POST",
        body: JSON.stringify({
          time_of_day: input.timeOfDay,
          // Tujuh hari dan senarai kosong bermakna perkara yang sama; pelayan
          // menormalkannya, jadi klien tidak perlu.
          days_of_week: input.daysOfWeek?.length ? input.daysOfWeek : undefined,
          dose_amount: input.doseAmount,
          dose_unit: input.doseUnit || undefined,
          with_food: input.withFood,
        }),
      }
    )
  }

  deleteSchedule(circleId: string, personId: string, scheduleId: string) {
    return this.client.request<void>(
      `${this.base(circleId, personId)}/schedules/${scheduleId}`,
      { method: "DELETE" }
    )
  }

  listDoses(circleId: string, personId: string, date: string) {
    return this.client
      .request<{ date: string; data: ApiDose[] }>(
        `${this.base(circleId, personId)}/doses?date=${date}`
      )
      .then((body) => (body.data ?? []).map(mapDose))
  }

  recordDose(
    circleId: string,
    personId: string,
    input: {
      scheduleId: string
      scheduledAt: string
      status: DoseStatus
      note?: string
    }
  ) {
    return this.client.request<void>(`${this.base(circleId, personId)}/doses`, {
      method: "POST",
      body: JSON.stringify({
        schedule_id: input.scheduleId,
        scheduled_at: input.scheduledAt,
        status: input.status,
        note: input.note || undefined,
      }),
    })
  }

  listVitalTypes(circleId: string, personId: string) {
    return this.client
      .request<{ data: ApiVitalType[] }>(
        `${this.base(circleId, personId)}/vitals/types`
      )
      .then((body) => (body.data ?? []).map(mapVitalType))
  }

  listVitalReadings(circleId: string, personId: string) {
    return this.client
      .request<{ data: ApiVitalReading[] }>(
        `${this.base(circleId, personId)}/vitals`
      )
      .then((body) => (body.data ?? []).map(mapVitalReading))
  }

  recordVitalReading(
    circleId: string,
    personId: string,
    input: {
      vitalTypeId: string
      valuePrimary: string
      valueSecondary?: string
      measuredAt: string
      note?: string
    }
  ) {
    return this.client.request<void>(
      `${this.base(circleId, personId)}/vitals`,
      {
        method: "POST",
        body: JSON.stringify({
          vital_type_id: input.vitalTypeId,
          value_primary: input.valuePrimary,
          value_secondary: input.valueSecondary || undefined,
          measured_at: toUtc(input.measuredAt),
          note: input.note || undefined,
        }),
      }
    )
  }

  deleteVitalReading(
    circleId: string,
    personId: string,
    readingId: string
  ) {
    return this.client.request<void>(
      `${this.base(circleId, personId)}/vitals/${readingId}`,
      { method: "DELETE" }
    )
  }

  listImmunisations(circleId: string, personId: string) {
    return this.client
      .request<{ data: ApiImmunisation[] }>(
        `${this.base(circleId, personId)}/immunisations`
      )
      .then((body) => (body.data ?? []).map(mapImmunisation))
  }

  createImmunisation(
    circleId: string,
    personId: string,
    input: {
      vaccine: string
      doseNumber?: number
      givenOn?: string
      batchNo?: string
      nextDueOn?: string
      notes?: string
    }
  ) {
    return this.client.request<void>(
      `${this.base(circleId, personId)}/immunisations`,
      {
        method: "POST",
        body: JSON.stringify({
          vaccine: input.vaccine,
          dose_number: input.doseNumber,
          given_on: input.givenOn || undefined,
          batch_no: input.batchNo || undefined,
          next_due_on: input.nextDueOn || undefined,
          notes: input.notes || undefined,
        }),
      }
    )
  }

  updateImmunisation(
    circleId: string,
    personId: string,
    immunisationId: string,
    patch: {
      vaccine?: string
      doseNumber?: number
      givenOn?: string
      batchNo?: string
      nextDueOn?: string
      notes?: string
    }
  ) {
    return this.client.request<void>(
      `${this.base(circleId, personId)}/immunisations/${immunisationId}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          // Kosongkan makna "buang" di sini: pelayan membezakannya daripada medan
          // yang tak dihantar (PATCH), kecuali dose_number yang tiada nilai sen.
          vaccine: patch.vaccine,
          dose_number: patch.doseNumber,
          given_on: patch.givenOn,
          batch_no: patch.batchNo,
          next_due_on: patch.nextDueOn,
          notes: patch.notes,
        }),
      }
    )
  }

  deleteImmunisation(
    circleId: string,
    personId: string,
    immunisationId: string
  ) {
    return this.client.request<void>(
      `${this.base(circleId, personId)}/immunisations/${immunisationId}`,
      { method: "DELETE" }
    )
  }
}
