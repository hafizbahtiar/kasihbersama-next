import type {
  CareLog,
  CareLogFlag,
  CareLogInput,
  CareLogKind,
  CareLogVisibility,
  CareNeed,
  CareShift,
  CareShiftInput,
  CareShiftStatus,
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

type ApiShift = {
  id: string
  caregiver_person_id: string
  caregiver_name: string
  starts_at: string
  ends_at: string
  status: string
  started_at?: string
  ended_at?: string
  handover_note?: string
  handover_at?: string
  replaced_shift_id?: string
  note?: string
}

function mapShift(api: ApiShift): CareShift {
  return {
    id: api.id,
    caregiverPersonId: api.caregiver_person_id,
    caregiverName: api.caregiver_name,
    startsAt: api.starts_at,
    endsAt: api.ends_at,
    status: api.status as CareShiftStatus,
    startedAt: api.started_at,
    endedAt: api.ended_at,
    handoverNote: api.handover_note,
    handoverAt: api.handover_at,
    replacedShiftId: api.replaced_shift_id,
    note: api.note,
  }
}

function shiftBody(input: CareShiftInput) {
  return JSON.stringify({
    caregiver_person_id: input.caregiverPersonId,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    note: input.note,
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

  listShifts(circleId: string, personId: string, before?: CareShift) {
    const query = before
      ? `?${new URLSearchParams({ before: before.startsAt, before_id: before.id })}`
      : ""
    return this.client
      .request<{ data: ApiShift[] }>(
        `${this.base(circleId, personId)}/shifts${query}`
      )
      .then((body) => (body.data ?? []).map(mapShift))
  }

  createShift(circleId: string, personId: string, input: CareShiftInput) {
    return this.client.request<void>(
      `${this.base(circleId, personId)}/shifts`,
      {
        method: "POST",
        body: shiftBody(input),
      }
    )
  }

  updateShift(
    circleId: string,
    personId: string,
    shiftId: string,
    input: CareShiftInput
  ) {
    return this.client.request<void>(
      `${this.base(circleId, personId)}/shifts/${shiftId}`,
      { method: "PATCH", body: shiftBody(input) }
    )
  }

  private shiftAction(
    circleId: string,
    personId: string,
    shiftId: string,
    action: string,
    body: object = {}
  ) {
    return this.client.request<void>(
      `${this.base(circleId, personId)}/shifts/${shiftId}/${action}`,
      { method: "POST", body: JSON.stringify(body) }
    )
  }

  startShift(circleId: string, personId: string, shiftId: string) {
    return this.shiftAction(circleId, personId, shiftId, "start")
  }

  endShift(
    circleId: string,
    personId: string,
    shiftId: string,
    handoverNote: string
  ) {
    return this.shiftAction(circleId, personId, shiftId, "end", {
      handover_note: handoverNote,
    })
  }

  recordHandover(
    circleId: string,
    personId: string,
    shiftId: string,
    handoverNote: string
  ) {
    return this.shiftAction(circleId, personId, shiftId, "handover", {
      handover_note: handoverNote,
    })
  }

  cancelShift(circleId: string, personId: string, shiftId: string) {
    return this.shiftAction(circleId, personId, shiftId, "cancel")
  }

  replaceShift(
    circleId: string,
    personId: string,
    shiftId: string,
    caregiverPersonId: string
  ) {
    return this.shiftAction(circleId, personId, shiftId, "replace", {
      caregiver_person_id: caregiverPersonId,
    })
  }
}
