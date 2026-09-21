import type {
  HealthAllergy,
  HealthAppointment,
  HealthCondition,
  HealthProfile,
  HealthVisit,
} from "@/lib/domain/health"

export interface HealthRepository {
  /**
   * `exists` palsu bermakna person ini belum ada kad kecemasan - keadaan sah,
   * bukan ralat. Skrin merender borang kosong, bukan mesej.
   */
  getProfile(
    circleId: string,
    personId: string
  ): Promise<{ exists: boolean; profile: HealthProfile }>
  /** Tulisan PENUH: medan yang dikosongkan pengguna memang bermakna "buang". */
  saveProfile(
    circleId: string,
    personId: string,
    profile: HealthProfile
  ): Promise<HealthProfile>

  listConditions(
    circleId: string,
    personId: string
  ): Promise<HealthCondition[]>
  createCondition(
    circleId: string,
    personId: string,
    input: {
      name: string
      status?: HealthCondition["status"]
      diagnosedOn?: string
      notes?: string
    }
  ): Promise<void>
  updateCondition(
    circleId: string,
    personId: string,
    conditionId: string,
    patch: { status?: HealthCondition["status"]; notes?: string }
  ): Promise<void>
  deleteCondition(
    circleId: string,
    personId: string,
    conditionId: string
  ): Promise<void>

  listAllergies(circleId: string, personId: string): Promise<HealthAllergy[]>
  createAllergy(
    circleId: string,
    personId: string,
    input: {
      allergen: string
      reaction?: string
      severity?: HealthAllergy["severity"]
      notedOn?: string
    }
  ): Promise<void>
  deleteAllergy(
    circleId: string,
    personId: string,
    allergyId: string
  ): Promise<void>

  listAppointments(
    circleId: string,
    personId: string
  ): Promise<HealthAppointment[]>
  createAppointment(
    circleId: string,
    personId: string,
    input: {
      purpose: string
      startsAt: string
      endsAt?: string
      locationNote?: string
      status?: HealthAppointment["status"]
      notes?: string
    }
  ): Promise<void>
  updateAppointment(
    circleId: string,
    personId: string,
    appointmentId: string,
    patch: { status?: HealthAppointment["status"] }
  ): Promise<void>
  deleteAppointment(
    circleId: string,
    personId: string,
    appointmentId: string
  ): Promise<void>

  listVisits(circleId: string, personId: string): Promise<HealthVisit[]>
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
  ): Promise<void>
  deleteVisit(
    circleId: string,
    personId: string,
    visitId: string
  ): Promise<void>
}
