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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  buildComparisonGroups,
  PRICING_PLANS,
  priceFor,
  type BillingPeriod,
} from "@/lib/domain/pricing"
import { cn } from "@/lib/utils"

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
  const comparisonGroups = buildComparisonGroups(limits)
  const columnCount = PRICING_PLANS.length + 1

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
        Plain HTML table - not react-aria's Table collection. RAC requires
        globally unique column ids; three compare sections sharing free/family/
        care_home columns crashed the page. Native table supports colSpan for
        section headers, which RAC does not.
      */}
      <div className="overflow-x-auto">
        <table
          aria-label="Banding pelan"
          className="w-full min-w-[34rem] caption-bottom text-sm"
        >
          <thead className="[&_tr]:border-b">
            <tr>
              <th
                scope="col"
                className="h-11 w-[14rem] px-4 text-left align-middle font-medium whitespace-nowrap text-foreground"
              >
                Ciri
              </th>
              {PRICING_PLANS.map((plan) => (
                <th
                  key={plan.id}
                  scope="col"
                  className="h-11 px-4 text-center align-middle font-medium whitespace-nowrap text-foreground"
                >
                  <span className="flex flex-col items-center gap-1">
                    <span className="flex items-center gap-2 font-medium text-foreground">
                      {plan.name}
                      {plan.id === "free" ? (
                        <Badge variant="secondary">Sekarang</Badge>
                      ) : null}
                    </span>
                    {priceFor(plan, period) > 0 ? (
                      <span className="text-xs font-normal text-muted-foreground">
                        RM
                        <NumberFlow value={priceFor(plan, period)} /> sebulan
                      </span>
                    ) : null}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisonGroups.map((group) => (
              <Fragment key={group.title}>
                <tr className="border-b bg-muted/30">
                  <th
                    scope="rowgroup"
                    colSpan={columnCount}
                    className="px-4 py-2 text-left align-middle font-heading text-sm tracking-tight"
                  >
                    {group.title}
                  </th>
                </tr>
                {group.rows.map((row) => (
                  <tr
                    key={`${group.title}-${row.label}`}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    <th
                      scope="row"
                      className="px-4 py-3 text-left align-middle font-medium whitespace-nowrap"
                    >
                      {row.label}
                    </th>
                    {PRICING_PLANS.map((plan) => (
                      <td
                        key={plan.id}
                        className={cn(
                          "px-4 py-3 text-center align-middle whitespace-nowrap",
                          plan.highlighted && "bg-primary/5"
                        )}
                      >
                        <span className="inline-flex items-center justify-center">
                          <Cell value={row.values[plan.id]} />
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <Alert>
        <IconInfoCircle />
        <AlertTitle>Harga belum dibuka</AlertTitle>
        <AlertDescription>
          Pembayaran belum disambungkan. Lajur Percuma menunjukkan katalog had
          percuma dari pelayan; penggunaan sebenar akaun anda ada di halaman
          Penggunaan.
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
