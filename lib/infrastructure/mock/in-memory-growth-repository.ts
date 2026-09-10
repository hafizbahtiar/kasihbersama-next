import { buildImmunisationBook } from "@/lib/application/immunisation-book"
import { scheduleDoseById } from "@/lib/application/national-immunisation-schedule"
import { GrowthChartNotReadyError } from "@/lib/infrastructure/api/errors"
import {
  MOCK_MILESTONE_SCHEDULE_VERSION,
  mockMilestoneItems,
} from "@/lib/application/milestone-checklist"
import { buildMockGrowthChart } from "@/lib/infrastructure/mock/growth-chart-fixture"
import type {
  GrowthIndicator,
  GrowthRequirement,
  ImmunisationRecord,
  RecordMilestoneInput as RecordMilestoneArgs,
  RecordImmunisationInput,
  UpdateImmunisationInput,
} from "@/lib/domain/growth"
import type { GrowthRepository } from "@/lib/domain/growth-repository"
import { careSeed } from "@/lib/infrastructure/mock/care-seed"

let recordSeq = 0

function nextRecordId() {
  recordSeq += 1
  return `imm-${recordSeq}`
}

type StoredRecord = ImmunisationRecord & { profileId: string }

export class InMemoryGrowthRepository implements GrowthRepository {
  private records: StoredRecord[]
  private milestones: Array<RecordMilestoneArgs & { profileId: string }> = []

  constructor(seed: StoredRecord[] = []) {
    this.records = seed.map((row) => ({ ...row }))
  }

  private profileFields(profileId: string) {
    const profile = careSeed.profiles.find((item) => item.id === profileId)
    return {
      dateOfBirth: profile?.dateOfBirth,
      gender: profile?.gender,
    }
  }

  async getGrowthChart(profileId: string, indicator: GrowthIndicator) {
    const { dateOfBirth, gender } = this.profileFields(profileId)
    // The same preconditions the server enforces, refused the same way. A
    // mock that always produced a chart would let the UI ship without ever
    // meeting the screen a parent actually hits first.
    const missing: GrowthRequirement[] = []
    if (!dateOfBirth) {
      missing.push("date_of_birth")
    }
    if (gender !== "male" && gender !== "female") {
      missing.push("gender")
    }
    if (missing.length > 0) {
      throw new GrowthChartNotReadyError(
        "Profil belum lengkap untuk carta tumbesaran.",
        missing
      )
    }
    return buildMockGrowthChart(indicator, {
      dateOfBirth: dateOfBirth as string,
      gender: gender as string,
    })
  }

  async getMilestoneBook(profileId: string) {
    const { dateOfBirth } = this.profileFields(profileId)
    const marked = this.milestones.filter(
      (item) => item.profileId === profileId
    )
    const items = mockMilestoneItems().map((item) => {
      const record = marked.find((row) => row.milestoneId === item.milestoneId)
      return record
        ? {
            ...item,
            status: "achieved" as const,
            achievedAt: record.achievedAt,
            note: record.note,
          }
        : item
    })
    // A missing date of birth costs the age hint and nothing else - the
    // checklist is still usable, so it is still returned. That is the server's
    // behaviour too, and it differs from the growth chart on purpose.
    const ageMonths = dateOfBirth
      ? Math.max(
          0,
          Math.floor(
            (Date.now() - new Date(dateOfBirth).getTime()) /
              (30.4375 * 86_400_000)
          )
        )
      : undefined
    return {
      ready: Boolean(dateOfBirth),
      missing: dateOfBirth ? [] : (["date_of_birth"] as GrowthRequirement[]),
      messages: dateOfBirth
        ? {}
        : {
            date_of_birth:
              "Tambah tarikh lahir untuk melihat julat umur biasa.",
          },
      scheduleVersion: MOCK_MILESTONE_SCHEDULE_VERSION,
      source: "placeholder",
      ageMonths,
      items,
    }
  }

  async recordMilestone(profileId: string, input: RecordMilestoneArgs) {
    const existing = this.milestones.find(
      (item) =>
        item.profileId === profileId && item.milestoneId === input.milestoneId
    )
    if (existing) {
      existing.achievedAt = input.achievedAt
      existing.note = input.note
    } else {
      this.milestones.push({ profileId, ...input })
    }
    const definition = mockMilestoneItems().find(
      (item) => item.milestoneId === input.milestoneId
    )
    if (!definition) {
      throw new Error("Milestone tidak dikenali.")
    }
    return {
      ...definition,
      status: "achieved" as const,
      achievedAt: input.achievedAt,
      note: input.note,
    }
  }

  async deleteMilestone(profileId: string, milestoneId: string) {
    this.milestones = this.milestones.filter(
      (item) =>
        !(item.profileId === profileId && item.milestoneId === milestoneId)
    )
  }

  async getImmunisationBook(profileId: string) {
    const records = this.records
      .filter((item) => item.profileId === profileId)
      .map(({ profileId: _, ...record }) => record)
    return buildImmunisationBook(this.profileFields(profileId), records)
  }

  async recordImmunisation(profileId: string, input: RecordImmunisationInput) {
    if (!scheduleDoseById(input.scheduleDoseId)) {
      throw new Error("unknown schedule_dose_id")
    }
    if (
      this.records.some(
        (item) =>
          item.profileId === profileId &&
          item.scheduleDoseId === input.scheduleDoseId
      )
    ) {
      throw new Error("dose already recorded")
    }
    const record: StoredRecord = {
      id: nextRecordId(),
      profileId,
      scheduleDoseId: input.scheduleDoseId,
      givenAt: input.givenAt,
      note: input.note,
    }
    this.records.unshift(record)
    const { profileId: _, ...view } = record
    return view
  }

  async updateImmunisation(
    profileId: string,
    recordId: string,
    patch: UpdateImmunisationInput
  ) {
    const record = this.records.find(
      (item) => item.profileId === profileId && item.id === recordId
    )
    if (!record) {
      throw new Error("not found")
    }
    if (patch.givenAt !== undefined) {
      record.givenAt = patch.givenAt
    }
    if (patch.note !== undefined) {
      record.note = patch.note
    }
    const { profileId: _, ...view } = record
    return { ...view }
  }

  async deleteImmunisation(profileId: string, recordId: string) {
    const before = this.records.length
    this.records = this.records.filter(
      (item) => !(item.profileId === profileId && item.id === recordId)
    )
    if (this.records.length === before) {
      throw new Error("not found")
    }
  }
}

/** Demo records for the infant profile in care-seed. */
export const growthSeed: StoredRecord[] = [
  {
    id: "imm-bcg",
    profileId: "cp-7",
    scheduleDoseId: "bcg",
    givenAt: "2024-01-15",
    note: "Klinik Kesihatan Ampang",
  },
  {
    id: "imm-hep1",
    profileId: "cp-7",
    scheduleDoseId: "hep_b_1",
    givenAt: "2024-01-15",
  },
]
