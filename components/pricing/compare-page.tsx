"use client"

import { Fragment, useState } from "react"
import NumberFlow from "@number-flow/react"
import { IconCheck, IconInfoCircle, IconMinus } from "@tabler/icons-react"

import { BackButton } from "@/components/back-button"
import { PageHeader } from "@/components/care/page-header"
import { usePlatform } from "@/components/platform/platform-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  COMPARISON_GROUPS,
  PRICING_PLANS,
  priceFor,
  type BillingPeriod,
  type ComparisonRow,
  type PricingPlan,
} from "@/lib/domain/pricing"
import type { PlatformLimits } from "@/lib/domain/platform"
import { cn } from "@/lib/utils"

/**
 * The free column is read from the server wherever the row says to.
 *
 * The same promise the pricing page makes: the Free figures are the limits
 * being enforced on this account right now, not numbers typed into a table
 * that can quietly fall out of date with the deployment.
 */
function cellValue(
  row: ComparisonRow,
  plan: PricingPlan,
  limits: PlatformLimits
) {
  if (plan.id === "free" && row.liveFreeValue) {
    if (row.liveFreeValue === "profiles") {
      return String(limits.maxProfilesFree)
    }
    if (row.liveFreeValue === "members") {
      return String(limits.maxMembersFree)
    }
    return `${limits.maxUploadMb} MB`
  }
  return row.values[plan.id]
}

function Cell({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <>
        <IconCheck className="size-4 text-primary" aria-hidden />
        <span className="sr-only">Ada</span>
      </>
    )
  }
  if (value === false) {
    return (
      <>
        <IconMinus className="size-4 text-muted-foreground/50" aria-hidden />
        <span className="sr-only">Tiada</span>
      </>
    )
  }
  return <span className="text-sm">{value}</span>
}

export function ComparePage() {
  const { limits } = usePlatform()
  const [period, setPeriod] = useState<BillingPeriod>("yearly")

  return (
    <div className="flex flex-col gap-5">
      <div>
        <BackButton href="/pricing" />
      </div>

      <PageHeader
        title="Banding pelan"
        description="Setiap baris di bawah ialah perkara yang benar-benar berbeza antara pelan."
      />

      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup
          selectionMode="single"
          selectedKeys={[period]}
          onSelectionChange={(keys) => {
            const next = [...keys][0]
            if (next === "monthly" || next === "yearly") {
              setPeriod(next)
            }
          }}
          aria-label="Kitaran bayaran"
        >
          <ToggleGroupItem id="monthly">Bulanan</ToggleGroupItem>
          <ToggleGroupItem id="yearly">Tahunan</ToggleGroupItem>
        </ToggleGroup>
        <span className="text-sm text-muted-foreground">
          Bayaran tahunan: 2 bulan percuma.
        </span>
      </div>

      {/* The table scrolls inside itself; the page never scrolls sideways. */}
      <div className="overflow-x-auto">
        <Table className="min-w-[38rem]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[14rem]">Ciri</TableHead>
              {PRICING_PLANS.map((plan) => {
                const price = priceFor(plan, period)
                return (
                  <TableHead key={plan.id} className="text-center">
                    <span className="flex flex-col items-center gap-1">
                      <span className="flex items-center gap-2 font-medium text-foreground">
                        {plan.name}
                        {plan.id === "free" ? (
                          <Badge variant="secondary">Sekarang</Badge>
                        ) : null}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {price === 0 ? (
                          "Percuma"
                        ) : (
                          <>
                            RM
                            <NumberFlow value={price} /> sebulan
                          </>
                        )}
                      </span>
                    </span>
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>

          <TableBody>
            {COMPARISON_GROUPS.map((group) => (
              <Fragment key={group.title}>
                <TableRow className="bg-muted/40">
                  <TableCell
                    colSpan={PRICING_PLANS.length + 1}
                    className="text-xs font-medium tracking-widest uppercase"
                  >
                    {group.title}
                  </TableCell>
                </TableRow>
                {group.rows.map((row) => (
                  <TableRow key={`${group.title}-${row.label}`}>
                    <TableCell className="font-medium">{row.label}</TableCell>
                    {PRICING_PLANS.map((plan) => (
                      <TableCell
                        key={plan.id}
                        className={cn(
                          "text-center",
                          plan.highlighted && "bg-primary/5"
                        )}
                      >
                        <span className="inline-flex items-center justify-center">
                          <Cell value={cellValue(row, plan, limits)} />
                        </span>
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      <Alert>
        <IconInfoCircle />
        <AlertTitle>Harga belum dibuka</AlertTitle>
        <AlertDescription>
          Pembayaran belum disambungkan. Lajur Percuma menunjukkan had sebenar
          yang dikuatkuasakan pada akaun anda hari ini.
        </AlertDescription>
      </Alert>

      <div>
        <Button variant="outline" isDisabled>
          Belum dibuka
        </Button>
      </div>
    </div>
  )
}
