import type {
  ImmunisationBook,
  ImmunisationRecord,
  RecordImmunisationInput,
  UpdateImmunisationInput,
} from "@/lib/domain/growth"

export interface GrowthRepository {
  getImmunisationBook(profileId: string): Promise<ImmunisationBook>
  recordImmunisation(
    profileId: string,
    input: RecordImmunisationInput
  ): Promise<ImmunisationRecord>
  updateImmunisation(
    profileId: string,
    recordId: string,
    patch: UpdateImmunisationInput
  ): Promise<ImmunisationRecord>
  deleteImmunisation(profileId: string, recordId: string): Promise<void>
}
