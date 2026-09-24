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
  /** Ada bila tugasan ini kejadian tugasan berulang. */
  templateTaskId?: string
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

export type RecurrenceFreq = "daily" | "weekly" | "monthly" | "yearly"

export const RECURRENCE_FREQ_LABELS: Record<RecurrenceFreq, string> = {
  daily: "Harian",
  weekly: "Mingguan",
  monthly: "Bulanan",
  yearly: "Tahunan",
}

export const RECURRENCE_FREQS = Object.keys(
  RECURRENCE_FREQ_LABELS
) as RecurrenceFreq[]

/**
 * Tugasan berulang: induk + peraturan. Induk menjana tugasan hari penuh
 * `leadDays` sebelum setiap tarikh akhir; setiap kejadian ialah tugasan sendiri.
 */
export type RecurringTask = {
  task: Task
  freq: RecurrenceFreq
  interval: number
  /** 1=Isnin..7=Ahad (mingguan); kosong = hari tarikh mula. */
  daysOfWeek: number[]
  /** 1..31, -1 = hari terakhir (bulanan); undefined = hari tarikh mula. */
  dayOfMonth?: number
  leadDays: number
  startsOn: string
  until?: string
  maxCount?: number
  isActive: boolean
  spawned: number
}

export type RecurringInput = {
  title: string
  description: string
  priority: TaskPriority
  assigneeMemberId: string
  personId: string
  freq: RecurrenceFreq
  interval: number
  daysOfWeek: number[]
  dayOfMonth?: number
  startsOn: string
  until: string
  maxCount?: number
  isActive: boolean
}
