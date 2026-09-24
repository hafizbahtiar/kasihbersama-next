import type {
  RecurrenceFreq,
  RecurringInput,
  RecurringTask,
  Task,
  TaskInput,
  TaskPriority,
  TaskStatus,
} from "@/lib/domain/task"
import type { TaskRepository } from "@/lib/domain/task-repository"
import type { ApiClient } from "@/lib/infrastructure/api/client"

type ApiTask = {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  due_on?: string
  due_at?: string
  position: number
  assignee_member_id?: string
  assignee_name?: string
  person_id?: string
  person_name?: string
  checklist_total: number
  checklist_done: number
  template_task_id?: string
  checklist?: { id: string; label: string; is_done: boolean }[]
}

function mapTask(api: ApiTask): Task {
  return {
    id: api.id,
    title: api.title,
    description: api.description,
    status: api.status as TaskStatus,
    priority: api.priority as TaskPriority,
    dueOn: api.due_on,
    dueAt: api.due_at,
    position: api.position,
    assigneeMemberId: api.assignee_member_id,
    assigneeName: api.assignee_name,
    personId: api.person_id,
    personName: api.person_name,
    checklistTotal: api.checklist_total,
    checklistDone: api.checklist_done,
    templateTaskId: api.template_task_id,
    checklist: api.checklist?.map((it) => ({
      id: it.id,
      label: it.label,
      isDone: it.is_done,
    })),
  }
}

type ApiRecurring = {
  task: ApiTask
  freq: string
  interval: number
  days_of_week: number[]
  day_of_month?: number
  lead_days: number
  starts_on: string
  until?: string
  max_count?: number
  is_active: boolean
  spawned: number
}

function mapRecurring(api: ApiRecurring): RecurringTask {
  return {
    task: mapTask(api.task),
    freq: api.freq as RecurrenceFreq,
    interval: api.interval,
    daysOfWeek: api.days_of_week ?? [],
    dayOfMonth: api.day_of_month,
    leadDays: api.lead_days,
    startsOn: api.starts_on,
    until: api.until,
    maxCount: api.max_count,
    isActive: api.is_active,
    spawned: api.spawned,
  }
}

function recurringBody(input: RecurringInput) {
  // Ganti penuh: medan kosong bermakna "tiada" (bukan "jangan sentuh").
  return JSON.stringify({
    title: input.title,
    description: input.description || undefined,
    priority: input.priority,
    assignee_member_id: input.assigneeMemberId || undefined,
    person_id: input.personId || undefined,
    freq: input.freq,
    interval: input.interval,
    days_of_week: input.freq === "weekly" ? input.daysOfWeek : undefined,
    day_of_month: input.freq === "monthly" ? input.dayOfMonth : undefined,
    starts_on: input.startsOn,
    until: input.until || undefined,
    max_count: input.maxCount || undefined,
    is_active: input.isActive,
  })
}

export class ApiTaskRepository implements TaskRepository {
  constructor(private readonly client: ApiClient) {}

  private base(circleId: string) {
    return `/circles/${circleId}/tasks`
  }

  listTasks(circleId: string, filter?: { includeCancelled?: boolean }) {
    const query = filter?.includeCancelled ? "?include_cancelled=true" : ""
    return this.client
      .request<{ data: ApiTask[] }>(`${this.base(circleId)}${query}`)
      .then((body) => (body.data ?? []).map(mapTask))
  }

  getTask(circleId: string, taskId: string) {
    return this.client
      .request<{ task: ApiTask }>(`${this.base(circleId)}/${taskId}`)
      .then((body) => mapTask(body.task))
  }

  createTask(circleId: string, input: TaskInput) {
    // Cipta: nilai kosong = tiada; pelayan menolak "" untuk tarikh.
    return this.client.request<void>(this.base(circleId), {
      method: "POST",
      body: JSON.stringify({
        title: input.title,
        description: input.description || undefined,
        priority: input.priority,
        due_on: input.dueOn || undefined,
        due_at: input.dueAt || undefined,
        assignee_member_id: input.assigneeMemberId || undefined,
        person_id: input.personId || undefined,
      }),
    })
  }

  updateTask(circleId: string, taskId: string, input: TaskInput) {
    // Sunting: "" sengaja dihantar - ia MEMBUANG penerima/person/tarikh di pelayan.
    // Tarikh: due_at bila ada waktu, jika tidak due_on (kosong = buang tarikh).
    return this.client.request<void>(`${this.base(circleId)}/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify({
        title: input.title,
        description: input.description,
        priority: input.priority,
        ...(input.dueAt ? { due_at: input.dueAt } : { due_on: input.dueOn }),
        assignee_member_id: input.assigneeMemberId,
        person_id: input.personId,
      }),
    })
  }

  setStatus(circleId: string, taskId: string, status: TaskStatus) {
    return this.client.request<void>(`${this.base(circleId)}/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    })
  }

  deleteTask(circleId: string, taskId: string) {
    return this.client.request<void>(`${this.base(circleId)}/${taskId}`, {
      method: "DELETE",
    })
  }

  addChecklistItem(circleId: string, taskId: string, label: string) {
    return this.client
      .request<{ task: ApiTask }>(
        `${this.base(circleId)}/${taskId}/checklist`,
        {
          method: "POST",
          body: JSON.stringify({ label }),
        }
      )
      .then((body) => mapTask(body.task))
  }

  setChecklistItem(
    circleId: string,
    taskId: string,
    itemId: string,
    isDone: boolean
  ) {
    return this.client
      .request<{ task: ApiTask }>(
        `${this.base(circleId)}/${taskId}/checklist/${itemId}`,
        { method: "PATCH", body: JSON.stringify({ is_done: isDone }) }
      )
      .then((body) => mapTask(body.task))
  }

  deleteChecklistItem(circleId: string, taskId: string, itemId: string) {
    return this.client
      .request<{ task: ApiTask }>(
        `${this.base(circleId)}/${taskId}/checklist/${itemId}`,
        { method: "DELETE" }
      )
      .then((body) => mapTask(body.task))
  }

  listRecurring(circleId: string) {
    return this.client
      .request<{ data: ApiRecurring[] }>(`${this.base(circleId)}/recurring`)
      .then((body) => (body.data ?? []).map(mapRecurring))
  }

  createRecurring(circleId: string, input: RecurringInput) {
    return this.client.request<void>(`${this.base(circleId)}/recurring`, {
      method: "POST",
      body: recurringBody(input),
    })
  }

  replaceRecurring(circleId: string, taskId: string, input: RecurringInput) {
    return this.client.request<void>(
      `${this.base(circleId)}/recurring/${taskId}`,
      { method: "PUT", body: recurringBody(input) }
    )
  }
}
