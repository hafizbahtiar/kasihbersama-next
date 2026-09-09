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
}

type PlanCatalogueLimits = {
  profiles: number | "unlimited"
  members: number | "unlimited"
  uploadMb: number
  /** Marketing pool size; not enforced on the server yet. */
  storageLabel: string
}

const PAID_PLAN_LIMITS: Record<
  Exclude<PricingPlan["id"], "free">,
  PlanCatalogueLimits
> = {
  family: {
    profiles: PLAN_PROFILE_CAPS.family,
    members: 10,
    uploadMb: 25,
    storageLabel: "5 GB",
  },
  care_home: {
    profiles: "unlimited",
    members: "unlimited",
    uploadMb: 100,
    storageLabel: "50 GB",
  },
}

function freePlanLimits(server: PlatformLimits): PlanCatalogueLimits {
  return {
    profiles: server.maxProfilesFree,
    members: server.maxMembersFree,
    uploadMb: server.maxUploadMb,
    storageLabel: "500 MB",
  }
}

function planCatalogueLimits(
  planId: PricingPlan["id"],
  server: PlatformLimits
): PlanCatalogueLimits {
  if (planId === "free") {
    return freePlanLimits(server)
  }
  return PAID_PLAN_LIMITS[planId]
}

function formatCountLimit(value: number | "unlimited") {
  return value === "unlimited" ? "Tanpa had" : String(value)
}

function formatUploadLimit(uploadMb: number) {
  return `${uploadMb} MB`
}

function limitsDisplayStrings(limits: PlanCatalogueLimits) {
  return {
    profiles:
      limits.profiles === "unlimited"
        ? "Profil tanpa had"
        : `${limits.profiles} profil jagaan`,
    members:
      limits.members === "unlimited"
        ? "Ahli tanpa had"
        : `${limits.members} ahli setiap profil`,
    upload: `Fail sehingga ${limits.uploadMb} MB`,
  }
}

/**
 * Built from the same catalogue numbers as PRICING_PLANS so the compare table
 * cannot drift from the cards on /pricing.
 */
export function buildComparisonGroups(server: PlatformLimits): Array<{
  title: string
  rows: ComparisonRow[]
}> {
  const limitsFor = (planId: PricingPlan["id"]) =>
    planCatalogueLimits(planId, server)

  const free = limitsFor("free")
  const family = limitsFor("family")
  const careHome = limitsFor("care_home")

  return [
    {
      title: "Had",
      rows: [
        {
          label: "Profil jagaan",
          values: {
            free: formatCountLimit(free.profiles),
            family: formatCountLimit(family.profiles),
            care_home: formatCountLimit(careHome.profiles),
          },
        },
        {
          label: "Ahli setiap profil",
          values: {
            free: formatCountLimit(free.members),
            family: formatCountLimit(family.members),
            care_home: formatCountLimit(careHome.members),
          },
        },
        {
          label: "Saiz fail setiap muat naik",
          values: {
            free: formatUploadLimit(free.uploadMb),
            family: formatUploadLimit(family.uploadMb),
            care_home: formatUploadLimit(careHome.uploadMb),
          },
        },
        {
          label: "Simpanan dokumen (pool)",
          values: {
            free: free.storageLabel,
            family: family.storageLabel,
            care_home: careHome.storageLabel,
          },
        },
      ],
    },
    {
      title: "Berkongsi penjagaan",
      rows: [
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
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Percuma",
    audience: "Untuk seorang yang anda jaga.",
    monthlyPrice: 0,
    limits: (server) =>
      limitsDisplayStrings(freePlanLimits(server)),
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
    limits: () => limitsDisplayStrings(PAID_PLAN_LIMITS.family),
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
    limits: () => limitsDisplayStrings(PAID_PLAN_LIMITS.care_home),
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
