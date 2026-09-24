import type {
  CareLog,
  CareLogFlag,
  CareLogInput,
  CareLogKind,
  CareLogVisibility,
  CareNeed,
  CareNeedCategory,
  CareNeedPriority,
} from "@/lib/domain/care"
import type { CareRepository } from "@/lib/domain/care-repository"
import type { ApiClient } from "@/lib/infrastructure/api/client"

type ApiNeed = {
  id: string
  category: string
  instruction: string
  priority: string
  note?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

function mapNeed(api: ApiNeed): CareNeed {
  return {
    id: api.id,
    category: api.category as CareNeedCategory,
    instruction: api.instruction,
    priority: api.priority as CareNeedPriority,
    note: api.note,
    isActive: api.is_active,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  }
}

type ApiLog = {
  id: string
  kind: string
  title?: string
  body?: string
  flag: string
  visibility: string
  occurred_at: string
  recorded_by?: string
  recorded_by_label?: string
  created_at: string
  updated_at: string
}

function mapLog(api: ApiLog): CareLog {
  return {
    id: api.id,
    kind: api.kind as CareLogKind,
    title: api.title,
    body: api.body,
    flag: api.flag as CareLogFlag,
    visibility: api.visibility as CareLogVisibility,
    occurredAt: api.occurred_at,
    recordedBy: api.recorded_by,
    recordedByLabel: api.recorded_by_label,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  }
}

function logBody(input: CareLogInput) {
  return JSON.stringify({
    kind: input.kind,
    title: input.title,
    body: input.body,
    flag: input.flag,
    visibility: input.visibility,
    occurred_at: input.occurredAt,
  })
}

export class ApiCareRepository implements CareRepository {
  constructor(private readonly client: ApiClient) {}

  private base(circleId: string, personId: string) {
    return `/circles/${circleId}/persons/${personId}/care`
  }

  listNeeds(circleId: string, personId: string) {
    return this.client
      .request<{ data: ApiNeed[] }>(`${this.base(circleId, personId)}/needs`)
      .then((body) => (body.data ?? []).map(mapNeed))
  }

  createNeed(
    circleId: string,
    personId: string,
    input: {
      category: CareNeedCategory
      instruction: string
      priority?: CareNeedPriority
      note?: string
    }
  ) {
    return this.client.request<void>(`${this.base(circleId, personId)}/needs`, {
      method: "POST",
      body: JSON.stringify({
        category: input.category,
        instruction: input.instruction,
        priority: input.priority,
        note: input.note || undefined,
      }),
    })
  }

  updateNeed(
    circleId: string,
    personId: string,
    needId: string,
    patch: {
      category?: CareNeedCategory
      instruction?: string
      priority?: CareNeedPriority
      note?: string
      isActive?: boolean
    }
  ) {
    return this.client.request<void>(
      `${this.base(circleId, personId)}/needs/${needId}`,
      {
        method: "PATCH",
        // Kunci wayar ialah snake_case (`is_active`), bukan padanan TypeScript.
        // `note` sengaja dihantar walaupun kosong: string kosong MEMBUANG notul
        // di sisi pelayan (COALESCE), manakala key tercicir bermakna "jangan sentuh".
        body: JSON.stringify({
          category: patch.category,
          instruction: patch.instruction,
          priority: patch.priority,
          note: patch.note,
          is_active: patch.isActive,
        }),
      }
    )
  }

  deleteNeed(circleId: string, personId: string, needId: string) {
    return this.client.request<void>(
      `${this.base(circleId, personId)}/needs/${needId}`,
      { method: "DELETE" }
    )
  }

  listLogs(circleId: string, personId: string, before?: CareLog) {
    const query = before
      ? `?${new URLSearchParams({ before: before.occurredAt, before_id: before.id })}`
      : ""
    return this.client
      .request<{ data: ApiLog[] }>(
        `${this.base(circleId, personId)}/logs${query}`
      )
      .then((body) => (body.data ?? []).map(mapLog))
  }

  createLog(circleId: string, personId: string, input: CareLogInput) {
    return this.client.request<void>(`${this.base(circleId, personId)}/logs`, {
      method: "POST",
      body: logBody(input),
    })
  }

  updateLog(
    circleId: string,
    personId: string,
    logId: string,
    input: CareLogInput
  ) {
    // Borang menghantar setiap medan: "" pada tajuk/isi MEMBUANGNYA di pelayan.
    return this.client.request<void>(
      `${this.base(circleId, personId)}/logs/${logId}`,
      { method: "PATCH", body: logBody(input) }
    )
  }

  deleteLog(circleId: string, personId: string, logId: string) {
    return this.client.request<void>(
      `${this.base(circleId, personId)}/logs/${logId}`,
      { method: "DELETE" }
    )
  }
}
