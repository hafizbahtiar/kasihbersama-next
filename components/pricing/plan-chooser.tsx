"use client"

import NumberFlow from "@number-flow/react"
import { IconUsers } from "@tabler/icons-react"

import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import {
  PLAN_PROFILE_CAPS,
  PRICING_PLANS,
  planForProfileCount,
} from "@/lib/domain/pricing"

const MAX = 12

/**
 * The page's heading asks how many people you look after; this is where it is
 * answered.
 *
 * Interaction with a purpose rather than decoration: the plans differ on one
 * number, so let a carer set that number and watch the answer change, instead
 * of reading three feature lists to discover the same thing. Everything below
 * on the page highlights whatever this selects.
 */
export function PlanChooser({
  count,
  onCountChange,
}: {
  count: number
  onCountChange: (count: number) => void
}) {
  const planId = planForProfileCount(count)
  const plan = PRICING_PLANS.find((item) => item.id === planId)

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-medium">
            <IconUsers className="size-4 text-muted-foreground" />
            Saya menjaga
            <span className="font-heading text-2xl tracking-tight">
              <NumberFlow value={count} />
            </span>
            {count >= MAX ? "orang atau lebih" : "orang"}
          </p>
          <p className="text-sm text-muted-foreground">
            Pelan yang cukup:{" "}
            <span className="font-medium text-foreground">{plan?.name}</span>
          </p>
        </div>

        <Slider
          aria-label="Berapa ramai yang anda jaga"
          minValue={1}
          maxValue={MAX}
          step={1}
          value={count}
          onChange={(value) => {
            onCountChange(typeof value === "number" ? value : value[0])
          }}
        />

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1 orang</span>
          <span>
            Percuma menampung {PLAN_PROFILE_CAPS.free}; Keluarga{" "}
            {PLAN_PROFILE_CAPS.family}
          </span>
          <span>{MAX}+</span>
        </div>
      </CardContent>
    </Card>
  )
}
