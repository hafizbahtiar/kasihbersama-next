import type { CareSnapshot } from "@/lib/domain/care-snapshot"

export type DashboardStats = {
  profileCount: number
  activeMedicationCount: number
  upcomingAppointmentCount: number
  openTaskCount: number
  latestVital: string
}

export function buildDashboardStats(
  snapshot: CareSnapshot,
  profileId?: string
): DashboardStats {
  const medications = profileId
    ? snapshot.medications.filter((item) => item.profileId === profileId)
    : snapshot.medications
  const appointments = profileId
    ? snapshot.appointments.filter((item) => item.profileId === profileId)
    : snapshot.appointments
  const tasks = profileId
    ? snapshot.tasks.filter((item) => item.profileId === profileId)
    : snapshot.tasks
  const vitals = profileId
    ? snapshot.vitals.filter((item) => item.profileId === profileId)
    : snapshot.vitals

  const latestPressure = vitals.find(
    (item) => item.readingType === "blood_pressure"
  )

  return {
    profileCount: snapshot.profiles.filter((item) => item.status === "active")
      .length,
    activeMedicationCount: medications.filter((item) => item.status === "active")
      .length,
    upcomingAppointmentCount: appointments.filter(
      (item) => item.status === "scheduled"
    ).length,
    openTaskCount: tasks.filter(
      (item) => item.status === "open" || item.status === "in_progress"
    ).length,
    latestVital:
      latestPressure?.systolic != null && latestPressure.diastolic != null
        ? `${latestPressure.systolic}/${latestPressure.diastolic}`
        : "-",
  }
}
