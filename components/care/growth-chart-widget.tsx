"use client"

import { useMemo } from "react"
import {
  CartesianGrid,
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
} from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { GrowthChart } from "@/lib/domain/growth"

const DAYS_PER_MONTH = 30.4375

/**
 * The band keys, outermost first so the ±3 curves paint behind the ±2 ones.
 * Keyed by z rather than by name: naming them would invite a clinical label,
 * and this chart deliberately carries none.
 */
const BAND_KEYS: Record<number, string> = {
  [-3]: "zMinus3",
  [-2]: "zMinus2",
  [0]: "zMedian",
  [2]: "zPlus2",
  [3]: "zPlus3",
}

const config = {
  zMinus3: { label: "-3 SD", color: "var(--chart-4)" },
  zMinus2: { label: "-2 SD", color: "var(--chart-3)" },
  zMedian: { label: "Median", color: "var(--chart-2)" },
  zPlus2: { label: "+2 SD", color: "var(--chart-3)" },
  zPlus3: { label: "+3 SD", color: "var(--chart-4)" },
  child: { label: "Ukuran", color: "var(--chart-1)" },
} satisfies ChartConfig

type Row = Record<string, number | null> & { ageDays: number }

/**
 * Merges bands and measurements into one series keyed by age.
 *
 * Recharts wants a single dataset, and the two sources do not share x-values:
 * bands are sampled on a stride the server chose, measurements land on
 * whatever day the child was weighed. Every row therefore carries nulls for
 * the series it has no value for, and the band lines are drawn with
 * connectNulls so the stride does not read as a broken curve.
 */
function buildRows(chart: GrowthChart): Row[] {
  const byAge = new Map<number, Row>()

  const rowFor = (ageDays: number): Row => {
    const existing = byAge.get(ageDays)
    if (existing) {
      return existing
    }
    const created: Row = { ageDays }
    byAge.set(ageDays, created)
    return created
  }

  for (const band of chart.bands) {
    const key = BAND_KEYS[band.z]
    if (!key) {
      continue
    }
    for (const point of band.points) {
      rowFor(point.ageDays)[key] = point.value
    }
  }
  for (const point of chart.points) {
    // Plotted at plot age, which is corrected age for a preterm infant. Using
    // chronological age would place a baby born at 32 weeks well below the
    // band they actually belong on.
    rowFor(point.plotAgeDays).child = point.value
  }

  return [...byAge.values()].sort((a, b) => a.ageDays - b.ageDays)
}

export function GrowthChartWidget({ chart }: { chart: GrowthChart }) {
  const rows = useMemo(() => buildRows(chart), [chart])

  return (
    <ChartContainer config={config} className="aspect-[16/10] w-full">
      <ComposedChart data={rows}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="ageDays"
          type="number"
          domain={[chart.referenceFromDays, chart.referenceToDays]}
          tickFormatter={(value: number) =>
            `${Math.round(value / DAYS_PER_MONTH)}b`
          }
          tickMargin={8}
        />
        <YAxis width={40} unit={chart.unit} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const ageDays = payload?.[0]?.payload?.ageDays ?? 0
                const months = Math.round(ageDays / DAYS_PER_MONTH)
                return `${months} bulan (${ageDays} hari)`
              }}
            />
          }
        />
        {Object.entries(BAND_KEYS).map(([z, key]) => (
          <Line
            key={key}
            dataKey={key}
            type="monotone"
            stroke={`var(--color-${key})`}
            strokeWidth={Number(z) === 0 ? 2 : 1}
            strokeDasharray={Number(z) === 0 ? undefined : "4 4"}
            dot={false}
            connectNulls
            isAnimationActive={false}
          />
        ))}
        <Line
          dataKey="child"
          type="monotone"
          stroke="var(--color-child)"
          strokeWidth={2}
          connectNulls
          dot={false}
          isAnimationActive={false}
        />
        <Scatter dataKey="child" fill="var(--color-child)" />
      </ComposedChart>
    </ChartContainer>
  )
}
