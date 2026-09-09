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

/** Profiles each plan allows, for the "how many do you look after?" chooser. */
export const PLAN_PROFILE_CAPS: Record<PricingPlan["id"], number> = {
  free: 1,
  family: 5,
  // Not literally unlimited in the data model; the number a household would
  // ever reach. Sized so the chooser can compare it like any other.
  care_home: 50,
}

/**
 * The plan that fits a given number of people.
 *
 * The page asks "how many do you look after?" and this answers it, rather than
 * leaving a carer to compare three feature lists to find out that the only
 * difference that matters to them is a single number.
 */
export function planForProfileCount(count: number): PricingPlan["id"] {
  if (count <= PLAN_PROFILE_CAPS.free) {
    return "free"
  }
  if (count <= PLAN_PROFILE_CAPS.family) {
    return "family"
  }
  return "care_home"
}

/**
 * The full comparison, for the dedicated compare page.
 *
 * Rows are what actually differs. A comparison table padded with rows every
 * plan shares is an old trick for making the paid column look longer, and a
 * carer reading it learns nothing.
 */
export type ComparisonRow = {
  label: string
  /** A tick, a cross, or a value per plan. */
  values: Record<PricingPlan["id"], string | boolean>
  /** Set when the free column must be read from the server, not from here. */
  liveFreeValue?: "profiles" | "members" | "upload"
}

export const COMPARISON_GROUPS: Array<{
  title: string
  rows: ComparisonRow[]
}> = [
  {
    title: "Had",
    rows: [
      {
        label: "Profil jagaan",
        liveFreeValue: "profiles",
        values: { free: "1", family: "5", care_home: "Tanpa had" },
      },
      {
        label: "Ahli setiap profil",
        liveFreeValue: "members",
        values: { free: "2", family: "10", care_home: "Tanpa had" },
      },
      {
        label: "Saiz fail",
        liveFreeValue: "upload",
        values: { free: "5 MB", family: "25 MB", care_home: "100 MB" },
      },
      {
        label: "Simpanan dokumen",
        values: { free: "500 MB", family: "5 GB", care_home: "50 GB" },
      },
    ],
  },
  {
    title: "Penjagaan harian",
    rows: [
      {
        label: "Log jagaan dan timeline",
        values: { free: true, family: true, care_home: true },
      },
      {
        label: "Ubat, jadual dan tanda dos",
        values: { free: true, family: true, care_home: true },
      },
      {
        label: "Temujanji dan tugasan",
        values: { free: true, family: true, care_home: true },
      },
      {
        label: "Bacaan vital dan carta trend",
        values: { free: true, family: true, care_home: true },
      },
      {
        label: "Kad kecemasan",
        values: { free: true, family: true, care_home: true },
      },
      {
        label: "Ringkasan doktor",
        values: { free: true, family: true, care_home: true },
      },
    ],
  },
  {
    title: "Berkongsi penjagaan",
    rows: [
      {
        label: "Jemput ahli keluarga",
        values: { free: true, family: true, care_home: true },
      },
      {
        label: "Kumpulan jagaan (beberapa profil)",
        values: { free: false, family: true, care_home: true },
      },
      {
        label: "Peranan terperinci untuk penjaga upahan",
        values: { free: false, family: true, care_home: true },
      },
      {
        label: "Sejarah audit penuh",
        values: { free: false, family: true, care_home: true },
      },
    ],
  },
  {
    title: "Rekod dan pematuhan",
    rows: [
      {
        label: "Muat turun data sendiri",
        values: { free: true, family: true, care_home: true },
      },
      {
        label: "Eksport untuk rekod klinikal",
        values: { free: false, family: false, care_home: true },
      },
      {
        label: "Log akses",
        values: { free: false, family: false, care_home: true },
      },
      {
        label: "Sokongan keutamaan",
        values: { free: false, family: false, care_home: true },
      },
    ],
  },
]

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
