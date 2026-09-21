import type {
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
}