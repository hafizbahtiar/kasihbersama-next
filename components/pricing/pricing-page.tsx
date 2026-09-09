"use client"

import { useState } from "react"
import NumberFlow from "@number-flow/react"
import { IconCheck, IconInfoCircle } from "@tabler/icons-react"

import { useCareData } from "@/components/care/care-data-provider"
import { PageHeader } from "@/components/care/page-header"
import { usePlatform } from "@/components/platform/platform-provider"
import { UsageAgainstYourLimit } from "@/components/pricing/usage-against-your-limit"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  PRICING_PLANS,
  priceFor,
  type BillingPeriod,
} from "@/lib/domain/pricing"
import { cn } from "@/lib/utils"

export function PricingPage() {
  const { limits } = usePlatform()
  const { snapshot } = useCareData()
  const [period, setPeriod] = useState<BillingPeriod>("yearly")

  return (
    <div className="flex flex-col gap-8">
      {/*
        The heading asks the question the plans actually answer. "Simple,
        transparent pricing" is what every pricing page says and it tells a
        carer nothing - what they are deciding is whether one profile is
        enough, which is exactly what the tiers differ on.
      */}
      <PageHeader
        title="Berapa ramai yang anda jaga?"
        description="Pelan berbeza pada satu perkara: berapa ramai orang anda jaga, dan berapa ramai keluarga berkongsi kerja itu."
      />

      <UsageAgainstYourLimit limits={limits} profiles={snapshot.profiles} />

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

      <div className="grid gap-4 lg:grid-cols-3">
        {PRICING_PLANS.map((plan) => {
          const price = priceFor(plan, period)
          const planLimits = plan.limits(limits)

          return (
            <Card
              key={plan.id}
              className={cn(
                "flex h-full flex-col",
                plan.highlighted && "ring-2 ring-primary"
              )}
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.highlighted ? <Badge>Paling sesuai</Badge> : null}
                </div>
                <CardDescription>{plan.audience}</CardDescription>

                <p className="pt-2">
                  {price === 0 ? (
                    <span className="font-heading text-3xl tracking-tight">
                      Percuma
                    </span>
                  ) : (
                    <>
                      <span className="font-heading text-3xl tracking-tight">
                        RM
                        <NumberFlow value={price} />
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {" "}
                        sebulan
                      </span>
                    </>
                  )}
                </p>
                {price > 0 && period === "yearly" ? (
                  <p className="text-xs text-muted-foreground">
                    Dibil sekali setahun.
                  </p>
                ) : null}
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                {/* The three enforced limits come first and share one shape
                    across every plan, because they are the only numbers a
                    carer has to compare. The feature list is secondary. */}
                <ul className="space-y-1.5 text-sm">
                  <li className="font-medium">{planLimits.profiles}</li>
                  <li className="font-medium">{planLimits.members}</li>
                  <li className="text-muted-foreground">{planLimits.upload}</li>
                </ul>
                <ul className="space-y-2 border-t pt-4 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <IconCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                {/*
                  Disabled on purpose. There is no billing integration in this
                  product yet, and a button that takes a decision nowhere is
                  worse than one that admits the plan is not on sale.
                */}
                <Button
                  className="w-full"
                  variant={plan.highlighted ? "default" : "outline"}
                  isDisabled={plan.id !== "free"}
                >
                  {plan.id === "free" ? "Pelan anda sekarang" : "Belum dibuka"}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <Alert>
        <IconInfoCircle />
        <AlertTitle>Harga belum dibuka</AlertTitle>
        <AlertDescription>
          Pembayaran belum disambungkan. Pelan Percuma di atas ialah had sebenar
          yang dikuatkuasakan pada akaun anda hari ini; dua lagi menunjukkan ke
          mana ia menuju.
        </AlertDescription>
      </Alert>
    </div>
  )
}
