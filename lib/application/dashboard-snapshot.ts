import type { CareRepository } from "@/lib/domain/care-repository"

export type DashboardSnapshot = {
  profileCount: number
  activeMedicationCount: number
  upcomingAppointmentCount: number
  latestVital: string
}

export async function createDashboardSnapshot(
  repository: CareRepository
): Promise<DashboardSnapshot> {
  const snapshot = await repository.getSnapshot()
  const latestPressure = snapshot.vitals.find(
    (item) => item.readingType === "blood_pressure"
  )

  return {
    profileCount: snapshot.profiles.filter((item) => item.status === "active")
      .length,
    activeMedicationCount: snapshot.medications.filter(
      (item) => item.status === "active"
    ).length,
    upcomingAppointmentCount: snapshot.appointments.filter(
      (item) => item.status === "scheduled"
    ).length,
    latestVital:
      latestPressure?.systolic != null && latestPressure.diastolic != null
        ? `${latestPressure.systolic}/${latestPressure.diastolic}`
        : "-",
  }
}
