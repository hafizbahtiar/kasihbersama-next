/**
 * Malaysian National Immunisation Programme (NIP) reference doses.
 *
 * Mirrors `internal/app/growth/immunisation_schedule.go` - static, versioned
 * in git. Bump SCHEDULE_VERSION when KKM updates the schedule.
 */
export const SCHEDULE_VERSION = "nip-2020"

export type ScheduleDose = {
  id: string
  vaccine: string
  label: string
  dueMonths: number
  dueDays: number
  sexFilter?: "female"
  regionNote?: string
}

export const NATIONAL_IMMUNISATION_SCHEDULE: ScheduleDose[] = [
  { id: "bcg", vaccine: "BCG", label: "Dos tunggal", dueMonths: 0, dueDays: 0 },
  { id: "hep_b_1", vaccine: "Hepatitis B", label: "Dos 1", dueMonths: 0, dueDays: 0 },
  { id: "hep_b_2", vaccine: "Hepatitis B", label: "Dos 2", dueMonths: 1, dueDays: 0 },
  { id: "hexa_1", vaccine: "DTaP-IPV-Hib-HepB", label: "Dos 1", dueMonths: 2, dueDays: 0 },
  { id: "hexa_2", vaccine: "DTaP-IPV-Hib-HepB", label: "Dos 2", dueMonths: 3, dueDays: 0 },
  { id: "pcv_1", vaccine: "Pneumokokal (PCV)", label: "Dos 1", dueMonths: 4, dueDays: 0 },
  { id: "hexa_3", vaccine: "DTaP-IPV-Hib-HepB", label: "Dos 3", dueMonths: 5, dueDays: 0 },
  { id: "pcv_2", vaccine: "Pneumokokal (PCV)", label: "Dos 2", dueMonths: 6, dueDays: 0 },
  { id: "mmr_1", vaccine: "MMR", label: "Dos 1", dueMonths: 12, dueDays: 0 },
  { id: "pcv_booster", vaccine: "Pneumokokal (PCV)", label: "Dos penggalak", dueMonths: 15, dueDays: 0 },
  { id: "hexa_booster", vaccine: "DTaP-IPV-Hib-HepB", label: "Dos penggalak", dueMonths: 18, dueDays: 0 },
  { id: "dt_booster", vaccine: "DT", label: "Dos penggalak", dueMonths: 84, dueDays: 0 },
  { id: "mmr_2", vaccine: "MMR", label: "Dos 2", dueMonths: 84, dueDays: 0 },
  { id: "hpv_1", vaccine: "HPV", label: "Dos 1", dueMonths: 156, dueDays: 0, sexFilter: "female" },
  { id: "hpv_2", vaccine: "HPV", label: "Dos 2", dueMonths: 162, dueDays: 0, sexFilter: "female" },
  { id: "tt_15y", vaccine: "Tetanus (TT)", label: "Dos penggalak", dueMonths: 180, dueDays: 0 },
  {
    id: "je_1",
    vaccine: "Japanese Encephalitis (JE)",
    label: "Dos 1",
    dueMonths: 9,
    dueDays: 0,
    regionNote: "Sarawak sahaja",
  },
]

export function scheduleDoseById(id: string) {
  return NATIONAL_IMMUNISATION_SCHEDULE.find((dose) => dose.id === id)
}
