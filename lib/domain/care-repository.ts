import type {
  CareLog,
  CareLogInput,
  CareNeed,
  CareRota,
  CareRotaInput,
  CareShift,
  CareShiftInput,
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
  /** Terkini dahulu, 50 sehalaman; `before` ialah row terakhir halaman sebelumnya. */
  listShifts(
    circleId: string,
    personId: string,
    before?: CareShift
  ): Promise<CareShift[]>
  createShift(
    circleId: string,
    personId: string,
    input: CareShiftInput
  ): Promise<void>
  /** Giliran yang belum bermula sahaja. */
  updateShift(
    circleId: string,
    personId: string,
    shiftId: string,
    input: CareShiftInput
  ): Promise<void>
  startShift(circleId: string, personId: string, shiftId: string): Promise<void>
  /** Nota serah tugas pilihan. */
  endShift(
    circleId: string,
    personId: string,
    shiftId: string,
    handoverNote: string
  ): Promise<void>
  /** Serah tugas untuk giliran yang sudah tamat. */
  recordHandover(
    circleId: string,
    personId: string,
    shiftId: string,
    handoverNote: string
  ): Promise<void>
  cancelShift(
    circleId: string,
    personId: string,
    shiftId: string
  ): Promise<void>
  /** Orang lain mengambil alih; asal kekal sebagai "diganti". */
  replaceShift(
    circleId: string,
    personId: string,
    shiftId: string,
    caregiverPersonId: string
  ): Promise<void>
  listRotas(circleId: string, personId: string): Promise<CareRota[]>
  /** Giliran dijana serta-merta oleh pelayan. */
  createRota(
    circleId: string,
    personId: string,
    input: CareRotaInput
  ): Promise<void>
  /** Giliran masa depan yang belum disentuh dijana semula. */
  updateRota(
    circleId: string,
    personId: string,
    rotaId: string,
    patch: Partial<CareRotaInput> & { isActive?: boolean }
  ): Promise<void>
}
