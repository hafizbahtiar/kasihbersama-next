/**
 * Tugasan circle (docs/06): "Hantar mak ke klinik", "Bayar bil air". Satu penerima,
 * dan tarikh akhir SAMA ADA hari penuh (`dueOn`) ATAU waktu tertentu (`dueAt`).
 * `cancelled` hilang dari senarai lalai tetapi kekal sebagai sejarah.
 */
export type TaskStatus = "todo" | "doing" | "done" | "cancelled"

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Belum mula",
  doing: "Sedang dibuat",
  done: "Siap",
  cancelled: "Dibatalkan",
}

export type TaskPriority = "low" | "normal" | "high" | "urgent"

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Rendah",
  normal: "Biasa",
  high: "Tinggi",
  urgent: "Segera",
}

export const TASK_PRIORITIES = Object.keys(
  TASK_PRIORITY_LABELS
) as TaskPriority[]

export type TaskChecklistItem = {
  id: string
  label: string
  isDone: boolean
}

export type Task = {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  /** "YYYY-MM-DD", hari penuh. */
  dueOn?: string
  /** ISO, waktu tertentu. */
  dueAt?: string
  position: number
  assigneeMemberId?: string
  assigneeName?: string
  personId?: string
  personName?: string
  checklistTotal: number
  checklistDone: number
  /** Diisi pada bacaan satu tugasan sahaja. */
  checklist?: TaskChecklistItem[]
}

/** "" pada medan pilihan semasa sunting MEMBUANG nilai itu. */
export type TaskInput = {
  title: string
  description: string
  priority: TaskPriority
  dueOn: string
  dueAt: string
  assigneeMemberId: string
  personId: string
}
