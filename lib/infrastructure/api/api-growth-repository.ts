import type { GrowthRepository } from "@/lib/domain/growth-repository"
import type {
  ImmunisationBook,
  ImmunisationRecord,
  RecordImmunisationInput,
  UpdateImmunisationInput,
} from "@/lib/domain/growth"
import type { ApiClient } from "@/lib/infrastructure/api/client"
import {
  mapImmunisationBook,
  type ApiImmunisationBook,
} from "@/lib/infrastructure/api/mappers/growth"

type ApiImmunisationRecordResp = {
  id: string
  schedule_dose_id: string
  given_at: string
  note?: string
}

function mapRecordResp(row: ApiImmunisationRecordResp): ImmunisationRecord {
  return {
    id: row.id,
    scheduleDoseId: row.schedule_dose_id,
    givenAt: row.given_at,
    note: row.note,
  }
}

export class ApiGrowthRepository implements GrowthRepository {
  constructor(private readonly client: ApiClient) {}

  async getImmunisationBook(profileId: string): Promise<ImmunisationBook> {
    const row = await this.client.request<ApiImmunisationBook>(
      `/care-profiles/${profileId}/immunisations`
    )
    return mapImmunisationBook(row)
  }

  async recordImmunisation(
    profileId: string,
    input: RecordImmunisationInput
  ): Promise<ImmunisationRecord> {
    const row = await this.client.request<ApiImmunisationRecordResp>(
      `/care-profiles/${profileId}/immunisations`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schedule_dose_id: input.scheduleDoseId,
          given_at: input.givenAt,
          note: input.note ?? "",
        }),
      }
    )
    return mapRecordResp(row)
  }

  async updateImmunisation(
    profileId: string,
    recordId: string,
    patch: UpdateImmunisationInput
  ): Promise<ImmunisationRecord> {
    const row = await this.client.request<ApiImmunisationRecordResp>(
      `/care-profiles/${profileId}/immunisations/${recordId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          given_at: patch.givenAt,
          note: patch.note,
        }),
      }
    )
    return mapRecordResp(row)
  }

  async deleteImmunisation(profileId: string, recordId: string): Promise<void> {
    await this.client.request<void>(
      `/care-profiles/${profileId}/immunisations/${recordId}`,
      { method: "DELETE" }
    )
  }
}
