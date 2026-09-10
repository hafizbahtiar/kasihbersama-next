import {
  GROWTH_INDICATOR_LABELS,
  type GrowthBand,
  type GrowthChart,
  type GrowthIndicator,
  type GrowthPoint,
} from "@/lib/domain/growth"

/**
 * ILLUSTRATIVE GROWTH CURVES FOR DEV AND MOCK MODE - NOT WHO REFERENCE DATA.
 *
 * The real chart reads WHO Child Growth Standards LMS parameters through the
 * API. Those tables are not in the product yet: WHO publications are
 * CC BY-NC-SA 3.0 IGO and WHO's data policy permits non-commercial use only,
 * so a product with paid plans needs written permission first.
 *
 * These curves exist so the chart component can be built and seen working
 * rather than shipped blind. They use the same LMS maths and anchor points in
 * roughly the right place, which makes the *shape* honest - growth is fast
 * early and decelerates sharply, and a straight line would have hidden every
 * layout problem a real curve exposes. The numbers themselves are not
 * clinical and must never be presented as such.
 */
const SYNTHETIC = "ILUSTRASI PEMBANGUNAN - BUKAN DATA RUJUKAN WHO"

type Anchor = { months: number; median: number }

/** Median anchors per indicator, interpolated between. Illustrative only. */
const ANCHORS: Record<GrowthIndicator, Anchor[]> = {
  weight_for_age: [
    { months: 0, median: 3.3 },
    { months: 3, median: 6.4 },
    { months: 6, median: 7.9 },
    { months: 12, median: 9.6 },
    { months: 24, median: 12.2 },
    { months: 60, median: 18.3 },
  ],
  length_height_for_age: [
    { months: 0, median: 49.9 },
    { months: 3, median: 61.4 },
    { months: 6, median: 67.6 },
    { months: 12, median: 75.7 },
    { months: 24, median: 87.1 },
    { months: 60, median: 110.0 },
  ],
  head_circumference_for_age: [
    { months: 0, median: 34.5 },
    { months: 3, median: 40.5 },
    { months: 6, median: 43.3 },
    { months: 12, median: 46.1 },
    { months: 24, median: 48.3 },
    { months: 60, median: 51.5 },
  ],
}

/** Spread widens with age, which is why a constant S looks wrong on a chart. */
const SIGMA: Record<GrowthIndicator, { start: number; end: number }> = {
  weight_for_age: { start: 0.14, end: 0.11 },
  length_height_for_age: { start: 0.038, end: 0.042 },
  head_circumference_for_age: { start: 0.037, end: 0.031 },
}

const SKEW: Record<GrowthIndicator, number> = {
  weight_for_age: 0.3,
  length_height_for_age: 1,
  head_circumference_for_age: 1,
}

const DAYS_PER_MONTH = 30.4375
const MAX_AGE_DAYS = 1856
const BAND_Z = [-3, -2, 0, 2, 3]

function medianAt(indicator: GrowthIndicator, ageDays: number): number {
  const months = ageDays / DAYS_PER_MONTH
  const anchors = ANCHORS[indicator]
  for (let i = 1; i < anchors.length; i += 1) {
    const previous = anchors[i - 1]
    const current = anchors[i]
    if (months <= current.months) {
      const span = current.months - previous.months
      const t = span === 0 ? 0 : (months - previous.months) / span
      return previous.median + (current.median - previous.median) * t
    }
  }
  return anchors[anchors.length - 1].median
}

function sigmaAt(indicator: GrowthIndicator, ageDays: number): number {
  const { start, end } = SIGMA[indicator]
  const t = Math.min(ageDays / MAX_AGE_DAYS, 1)
  return start + (end - start) * t
}

/** The LMS inverse, same formula the server uses to draw its bands. */
function valueAtZ(l: number, m: number, s: number, z: number): number {
  if (Math.abs(l) < 1e-7) {
    return m * Math.exp(s * z)
  }
  return m * Math.pow(1 + l * s * z, 1 / l)
}

function buildBands(indicator: GrowthIndicator, toDays: number): GrowthBand[] {
  const stride = Math.max(1, Math.ceil((toDays + 1) / 120))
  return BAND_Z.map((z) => {
    const points = []
    for (let day = 0; day <= toDays; day += stride) {
      const l = SKEW[indicator]
      points.push({
        ageDays: day,
        value:
          Math.round(
            valueAtZ(l, medianAt(indicator, day), sigmaAt(indicator, day), z) *
              10
          ) / 10,
      })
    }
    return { z, points }
  })
}

/**
 * A child tracking a little below the median, with one reading past the
 * reference range so the "no z-score" path is visible in dev rather than only
 * in production.
 */
function buildPoints(
  indicator: GrowthIndicator,
  dateOfBirth: string
): GrowthPoint[] {
  const birth = new Date(dateOfBirth)
  const sampleDays = [3, 42, 100, 190, 320, 430]
  return sampleDays.map((ageDays, index) => {
    const l = SKEW[indicator]
    const m = medianAt(indicator, ageDays)
    const s = sigmaAt(indicator, ageDays)
    const z = -0.4 - index * 0.12
    const measured = new Date(birth.getTime() + ageDays * 86_400_000)
    const inRange = ageDays <= MAX_AGE_DAYS
    return {
      readingId: `${indicator}-${ageDays}`,
      readingType: indicator === "weight_for_age" ? "weight" : "length_lying",
      measuredAt: measured.toISOString(),
      ageDays,
      plotAgeDays: ageDays,
      usesCorrectedAge: false,
      value: Math.round(valueAtZ(l, m, s, z) * 10) / 10,
      z: inRange ? Math.round(z * 100) / 100 : null,
      reason: inRange ? undefined : "age_out_of_reference_range",
    }
  })
}

export function buildMockGrowthChart(
  indicator: GrowthIndicator,
  input: { dateOfBirth: string; gender: string }
): GrowthChart {
  const points = buildPoints(indicator, input.dateOfBirth)
  const lastAge = points.reduce((max, item) => Math.max(max, item.ageDays), 0)
  const toDays = Math.min(Math.max(lastAge + 60, 400), MAX_AGE_DAYS)
  return {
    indicator,
    unit: indicator === "weight_for_age" ? "kg" : "cm",
    sex: input.gender,
    referenceFromDays: 0,
    referenceToDays: toDays,
    bands: buildBands(indicator, toDays),
    points,
  }
}

export const MOCK_GROWTH_CHART_NOTICE = `${SYNTHETIC} (${Object.values(
  GROWTH_INDICATOR_LABELS
).length} penunjuk)`
