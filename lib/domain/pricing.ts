import type { PlatformLimits } from "@/lib/domain/platform"

/**
 * Plans.
 *
 * What scales in this product is not seats or storage or API calls - it is
 * **how many people you look after** and **how many relatives share the
 * load**. Those two numbers are already enforced by the backend
 * (`MAX_PROFILES_FREE`, `MAX_MEMBERS_FREE`, `checkProfileQuota`), so the plans
 * are drawn around them rather than around an invented feature matrix.
 *
 * The free tier's numbers are deliberately NOT written here. They are read
 * from `/bootstrap` at render time, because they are configuration the server
 * can change and a pricing page that disagrees with the limit actually being
 * enforced on your account is worse than no pricing page.
 */
export type BillingPeriod = "monthly" | "yearly"

export type PricingPlan = {
  id: "free" | "family" | "care_home"
  name: string
  /** One line on who this is for. Not a slogan. */
  audience: string
  /** Ringgit per month. Yearly is billed once at 10x, so two months are free. */
  monthlyPrice: number
  /** Set for the plan the page leads with, not for "most popular" theatre. */
  highlighted?: boolean
  /** Resolved against live server limits so the free column cannot go stale. */
  limits: (server: PlatformLimits) => {
    profiles: string
    members: string
    upload: string
  }
  features: string[]
}

export const YEARLY_MONTHS_CHARGED = 10

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Percuma",
    audience: "Untuk seorang yang anda jaga.",
    monthlyPrice: 0,
    limits: (server) => ({
      profiles: `${server.maxProfilesFree} profil jagaan`,
      members: `${server.maxMembersFree} ahli setiap profil`,
      upload: `Fail sehingga ${server.maxUploadMb} MB`,
    }),
    features: [
      "Log jagaan, ubat dan jadual dos",
      "Temujanji dan tugasan",
      "Bacaan vital dan carta trend",
      "Kad kecemasan",
      "Ringkasan doktor",
    ],
  },
  {
    id: "family",
    name: "Keluarga",
    audience: "Bila adik-beradik berkongsi penjagaan ibu bapa.",
    monthlyPrice: 19,
    highlighted: true,
    limits: () => ({
      profiles: "5 profil jagaan",
      members: "10 ahli setiap profil",
      upload: "Fail sehingga 25 MB",
    }),
    features: [
      "Semua dalam Percuma",
      "Kumpulan jagaan untuk beberapa profil",
      "Sejarah audit penuh",
      "Peranan terperinci untuk penjaga upahan",
      "Simpanan dokumen 5 GB",
    ],
  },
  {
    id: "care_home",
    name: "Rumah Jagaan",
    audience: "Untuk pusat jagaan kecil dan penjaga bertauliah.",
    monthlyPrice: 89,
    limits: () => ({
      profiles: "Profil tanpa had",
      members: "Ahli tanpa had",
      upload: "Fail sehingga 100 MB",
    }),
    features: [
      "Semua dalam Keluarga",
      "Eksport data untuk rekod klinikal",
      "Log akses untuk pematuhan",
      "Sokongan keutamaan",
    ],
  },
]

export function priceFor(plan: PricingPlan, period: BillingPeriod) {
  if (plan.monthlyPrice === 0) {
    return 0
  }
  // Shown per month in both modes: comparing a monthly figure to an annual one
  // is the oldest trick on a pricing page, and it makes the cheaper option
  // look dearer.
  return period === "monthly"
    ? plan.monthlyPrice
    : Math.round((plan.monthlyPrice * YEARLY_MONTHS_CHARGED) / 12)
}
