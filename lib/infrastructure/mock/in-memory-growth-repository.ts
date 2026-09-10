import { buildImmunisationBook } from "@/lib/application/immunisation-book"
import { scheduleDoseById } from "@/lib/application/national-immunisation-schedule"
import type {
  ImmunisationRecord,
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
