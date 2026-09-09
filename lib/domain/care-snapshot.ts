import type {
  Appointment,
  CareClaim,
  CareCircle,
  CareDocument,
  CareInvite,
  CareLog,
  CareMember,
  CareProfile,
  CareTask,
  Medication,
  MedicationEvent,
  MedicationSchedule,
  VitalReading,
} from "@/lib/domain/care"

export type CareSnapshot = {
  profiles: CareProfile[]
  circles: CareCircle[]
  members: CareMember[]
  invites: CareInvite[]
  claims: CareClaim[]
  logs: CareLog[]
  medications: Medication[]
  schedules: MedicationSchedule[]
  events: MedicationEvent[]
  appointments: Appointment[]
  tasks: CareTask[]
  vitals: VitalReading[]
  documents: CareDocument[]
}

export function emptyCareSnapshot(): CareSnapshot {
  return {
    profiles: [],
    circles: [],
    members: [],
    invites: [],
    claims: [],
    logs: [],
    medications: [],
    schedules: [],
    events: [],
    appointments: [],
    tasks: [],
    vitals: [],
    documents: [],
  }
}
