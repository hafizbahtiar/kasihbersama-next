import type { GrowthRepository } from "@/lib/domain/growth-repository"
import {
  GrowthChartNotReadyError,
  isApiError,
} from "@/lib/infrastructure/api/errors"
import type {
  GrowthChart,
  GrowthIndicator,
  ImmunisationBook,
  MilestoneBook,
  RecordMilestoneInput as RecordMilestoneArgs,
  ImmunisationRecord,
  RecordImmunisationInput,
  UpdateImmunisationInput,
} from "@/lib/domain/growth"
import type { ApiClient } from "@/lib/infrastructure/api/client"
import {
  mapGrowthChart,
  mapImmunisationBook,
  mapMilestoneBook,
  mapMilestoneItem,
  type ApiGrowthChart,
  type ApiImmunisationBook,
  type ApiMilestoneBook,
} from "@/lib/infrastructure/api/mappers/growth"

type ApiMilestoneItemResp = Parameters<typeof mapMilestoneItem>[0]

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

  async getGrowthChart(
    profileId: string,
    indicator: GrowthIndicator
  ): Promise<GrowthChart> {
    try {
      const row = await this.client.request<ApiGrowthChart>(
        `/care-profiles/${profileId}/growth/chart?indicator=${indicator}`
      )
      return mapGrowthChart(row)
    } catch (cause) {
      // 409 carries the missing preconditions; anything else is not ours to
      // reinterpret. Note a 404 here is ambiguous by design on the server
      // side - it is what FEATURE_GROWTH_CHART answers when the feature is
      // off - so it is left to the generic handler rather than dressed up.
      if (isApiError(cause) && cause.code === "not_ready") {
        const missing = Array.isArray(cause.details?.missing)
          ? (cause.details.missing as string[])
          : []
        throw new GrowthChartNotReadyError(cause.message, missing)
      }
      throw cause
    }
  }

  async getMilestoneBook(profileId: string): Promise<MilestoneBook> {
    const row = await this.client.request<ApiMilestoneBook>(
      `/care-profiles/${profileId}/milestones`
    )
    return mapMilestoneBook(row)
  }

  async recordMilestone(profileId: string, input: RecordMilestoneArgs) {
    const row = await this.client.request<ApiMilestoneItemResp>(
      `/care-profiles/${profileId}/milestones`,
      {
        method: "POST",
        body: JSON.stringify({
          milestone_id: input.milestoneId,
          achieved_at: input.achievedAt,
          note: input.note,
        }),
      }
    )
    return mapMilestoneItem(row)
  }

  async deleteMilestone(profileId: string, milestoneId: string) {
    await this.client.request<void>(
      `/care-profiles/${profileId}/milestones/${milestoneId}`,
      { method: "DELETE" }
    )
  }

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
