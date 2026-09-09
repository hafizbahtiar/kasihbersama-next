"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDateTime } from "@/lib/application/care-format"
import type { VitalReading } from "@/lib/domain/care"
import { useHydrated } from "@/hooks/use-hydrated"
import { cn } from "@/lib/utils"

export type VitalChartPoint = {
  label: string
  [key: string]: string | number | null | undefined
}

export const pressureChartConfig = {
  systolic: { label: "Sistolik", color: "var(--primary)" },
  diastolic: { label: "Diastolik", color: "var(--muted-foreground)" },
} satisfies ChartConfig

export const numericChartConfig = {
  value: { label: "Nilai", color: "var(--primary)" },
} satisfies ChartConfig

export function toPressureChartData(vitals: VitalReading[]): VitalChartPoint[] {
  return vitals
    .filter((item) => item.readingType === "blood_pressure")
    .slice()
    .reverse()
    .map((item) => ({
      label: formatDateTime(item.measuredAt),
      systolic: item.systolic,
      diastolic: item.diastolic,
    }))
}

export function toNumericChartData(
  vitals: VitalReading[],
  readingType: string
): VitalChartPoint[] {
  return vitals
    .filter((item) => item.readingType === readingType)
    .slice()
    .reverse()
    .map((item) => ({
      label: formatDateTime(item.measuredAt),
      value: item.valueNumeric,
    }))
}

export function VitalChartWidget({
  title,
  description,
  data,
  config,
  series,
  className,
}: {
  title: string
  description?: string
  data: VitalChartPoint[]
  config: ChartConfig
  series: Array<{ dataKey: string; color: string }>
  className?: string
}) {
  const hydrated = useHydrated()

  return (
    <Card className={cn("min-w-0", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        {!hydrated ? (
          <Skeleton className="aspect-[16/9] w-full rounded-xl" />
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Tiada data untuk carta.
          </p>
        ) : (
          <ChartContainer config={config} className="aspect-[16/9]">
            <LineChart data={data}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" hide />
              <YAxis width={36} />
              <ChartTooltip content={<ChartTooltipContent />} />
              {series.map((item) => (
                <Line
                  key={item.dataKey}
                  dataKey={item.dataKey}
                  type="monotone"
                  stroke={item.color}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
