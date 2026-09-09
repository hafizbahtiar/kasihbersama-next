"use client"

import { useState } from "react"
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
 * Those figures are the free-plan catalogue (`limits` on bootstrap), not
 * this account's live caps. A family-plan account still sees "1 profil"
 * in the Percuma column if that is what the env currently advertises.
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

      {/*
        One table per group, not one table with colSpan section rows.
        `ui/table` is react-aria's Table - a collection component like Menu, so
        a Fragment wrapper or a spanning cell is not a valid child and the page
        fails to render rather than degrading. RAC has no colSpan at all. This
        is the same mistake as the account menu's plain <div>; the lesson is
        that in this project a shadcn primitive is usually a collection.
      */}
      {COMPARISON_GROUPS.map((group, groupIndex) => (
        <section key={group.title} className="space-y-2">
          <h2 className="font-heading text-sm tracking-tight">{group.title}</h2>
          <div className="overflow-x-auto">
            <Table
              aria-label={`Banding pelan: ${group.title}`}
              selectionMode="none"
              className="min-w-[34rem]"
            >
              <TableHeader>
                <TableHead isRowHeader className="w-[14rem]">
                  Ciri
                </TableHead>
                {PRICING_PLANS.map((plan) => (
                  <TableHead key={plan.id} className="text-center">
                    {/* The price rides along with the first group only; on
                        every later table the plan name is enough and a
                        repeated price is noise. */}
                    {groupIndex === 0 ? (
                      <span className="flex flex-col items-center gap-1">
                        <span className="flex items-center gap-2 font-medium text-foreground">
                          {plan.name}
                          {plan.id === "free" ? (
                            <Badge variant="secondary">Sekarang</Badge>
                          ) : null}
                        </span>
                        <span className="text-xs font-normal text-muted-foreground">
                          {priceFor(plan, period) === 0 ? (
                            "Percuma"
                          ) : (
                            <>
                              RM
                              <NumberFlow value={priceFor(plan, period)} />{" "}
                              sebulan
                            </>
                          )}
                        </span>
                      </span>
                    ) : (
                      plan.name
                    )}
                  </TableHead>
                ))}
              </TableHeader>
              <TableBody>
                {group.rows.map((row) => (
                  <TableRow key={row.label} id={row.label}>
                    <TableCell id="label" className="font-medium">
                      {row.label}
                    </TableCell>
                    {PRICING_PLANS.map((plan) => (
                      <TableCell
                        key={plan.id}
                        id={plan.id}
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
              </TableBody>
            </Table>
          </div>
        </section>
      ))}

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
