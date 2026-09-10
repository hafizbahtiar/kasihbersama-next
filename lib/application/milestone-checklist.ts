import type { MilestoneItem } from "@/lib/domain/growth"

/**
 * PLACEHOLDER CHECKLIST FOR MOCK MODE - NOT CLINICAL GUIDANCE.
 *
 * Mirrors the backend's placeholder set so dev mode shows the same rows. The
 * real content is a licensing and clinical-content decision still open; see
 * the backend's milestone_schedule.go.
 */
const RAW: Array<[string, MilestoneItem["domain"], string, number, number]> = [
  ["social_smile", "social", "Senyum kepada orang", 1, 3],
  ["head_control", "motor_gross", "Menahan kepala tanpa sokongan", 2, 4],
  ["coo", "language", "Mengeluarkan bunyi 'ooh' dan 'aah'", 2, 4],
  ["grasp_object", "motor_fine", "Menggenggam objek yang dihulur", 3, 6],
  ["roll_over", "motor_gross", "Meniarap dan menterbalik badan", 4, 7],
  ["babble", "language", "Membebel suku kata seperti 'ba-ba'", 4, 8],
  ["sit_unsupported", "motor_gross", "Duduk tanpa sokongan", 6, 9],
  ["stranger_aware", "social", "Kenal orang yang dikenali dan yang asing", 6, 10],
  ["pincer_grasp", "motor_fine", "Mengutip objek kecil dengan ibu jari dan telunjuk", 8, 12],
  ["crawl", "motor_gross", "Merangkak", 7, 12],
  ["first_word", "language", "Sebut perkataan pertama yang bermakna", 10, 15],
  ["stand_alone", "motor_gross", "Berdiri sendiri", 9, 14],
  ["walk_alone", "motor_gross", "Berjalan sendiri", 11, 18],
  ["point_to_ask", "social", "Menunjuk untuk meminta sesuatu", 12, 18],
  ["scribble", "motor_fine", "Mencoret dengan pensel atau krayon", 13, 20],
  ["two_word_phrase", "language", "Cantum dua perkataan", 18, 30],
  ["run", "motor_gross", "Berlari", 18, 24],
  ["parallel_play", "social", "Bermain di sebelah kanak-kanak lain", 20, 30],
  ["stack_blocks", "motor_fine", "Menyusun beberapa blok", 18, 30],
  ["short_sentence", "language", "Bercakap ayat pendek", 24, 36],
  ["jump_two_feet", "motor_gross", "Melompat dengan dua kaki", 24, 36],
  ["pretend_play", "social", "Bermain pura-pura", 24, 36],
]

export const MOCK_MILESTONE_SCHEDULE_VERSION = "placeholder-2026-09"

export function mockMilestoneItems(): MilestoneItem[] {
  return RAW.map(([milestoneId, domain, label, from, to]) => ({
    milestoneId,
    domain,
    label,
    typicalFromMonths: from,
    typicalToMonths: to,
    status: "not_recorded" as const,
  }))
}
