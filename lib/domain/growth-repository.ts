import type {
  GrowthChart,
  GrowthIndicator,
  ImmunisationBook,
  MilestoneBook,
  MilestoneItem,
  RecordMilestoneInput as RecordMilestoneArgs,
  ImmunisationRecord,
  RecordImmunisationInput,
  UpdateImmunisationInput,
} from "@/lib/domain/growth"

export interface GrowthRepository {
  /**
   * Throws GrowthChartNotReadyError when the profile lacks a date of birth or
   * a coded gender, carrying the missing list so the UI can say which.
   */
  getGrowthChart(
    profileId: string,
    indicator: GrowthIndicator
  ): Promise<GrowthChart>
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
  getMilestoneBook(profileId: string): Promise<MilestoneBook>
  recordMilestone(
    profileId: string,
    input: RecordMilestoneArgs
  ): Promise<MilestoneItem>
  deleteMilestone(profileId: string, milestoneId: string): Promise<void>
}
