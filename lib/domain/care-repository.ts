import type {
  CareLog,
  CareLogInput,
  CareNeed,
  CareNeedCategory,
  CareNeedPriority,
} from "@/lib/domain/care"

export interface CareRepository {
  /** Senarai penuh: termasuk yang ditutup, diisih kritikal dahulu oleh pelayan. */
  listNeeds(circleId: string, personId: string): Promise<CareNeed[]>
  createNeed(
    circleId: string,
    personId: string,
    input: {
      category: CareNeedCategory
      instruction: string
      priority?: CareNeedPriority
      note?: string
    }
  ): Promise<void>
  /** PATCH separa: medan yang tidak dihantar kekal. */
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
  ): Promise<void>
  deleteNeed(circleId: string, personId: string, needId: string): Promise<void>
  /**
   * Garis masa, terbaharu dahulu, 50 sehalaman. `before` ialah row terakhir
   * halaman sebelumnya (kursor keyset pelayan).
   */
  listLogs(
    circleId: string,
    personId: string,
    before?: CareLog
  ): Promise<CareLog[]>
  createLog(
    circleId: string,
    personId: string,
    input: CareLogInput
  ): Promise<void>
  /** Penulis sahaja; pelayan menolak yang lain dengan 403. */
  updateLog(
    circleId: string,
    personId: string,
    logId: string,
    input: CareLogInput
  ): Promise<void>
  /** Penulis, atau pemegang `care.log.manage`. Padam lembut. */
  deleteLog(circleId: string, personId: string, logId: string): Promise<void>
}
