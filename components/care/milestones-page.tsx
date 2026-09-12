"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"

import { AsyncStateBanner } from "@/components/care/async-state"
import { PageHeader } from "@/components/care/page-header"
import { SelectProfileEmpty } from "@/components/care/select-profile-empty"
import { useCareProfile } from "@/components/care/care-data-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/application/care-format"
import {
  MILESTONE_DOMAINS,
  MILESTONE_DOMAIN_LABELS,
  type MilestoneItem,
} from "@/lib/domain/growth"
import { useMilestoneBook } from "@/hooks/use-milestone-book"
import { isApiError } from "@/lib/infrastructure/api/errors"

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function MilestonesPage() {
  const { selectedProfile } = useCareProfile()
  const { book, isLoading, error, reload, mark, unmark } = useMilestoneBook(
    selectedProfile?.id
  )
  const [busyId, setBusyId] = useState<string | null>(null)

  const byDomain = useMemo(() => {
    const groups = new Map<string, MilestoneItem[]>()
    for (const item of book?.items ?? []) {
      const list = groups.get(item.domain) ?? []
      list.push(item)
      groups.set(item.domain, list)
    }
    return groups
  }, [book])

  if (!selectedProfile) {
    return <SelectProfileEmpty />
  }

  async function toggle(item: MilestoneItem) {
    setBusyId(item.milestoneId)
    try {
      if (item.status === "achieved") {
        await unmark(item.milestoneId)
      } else {
        await mark({ milestoneId: item.milestoneId, achievedAt: todayISO() })
      }
    } catch (cause) {
      toast.error(
        isApiError(cause) ? cause.message : "Gagal mengemas kini senarai semak."
      )
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Perkembangan"
        description={`Senarai semak perkembangan ${selectedProfile.displayName}.`}
      />

      {/*
        The framing comes before the list on purpose. A checklist with unticked
        rows reads as a score unless something says otherwise first, and "not
        yet" on a milestone is normal variation far more often than it is a
        finding. There is deliberately no progress bar, no count and no colour
        coding of unticked items.
      */}
      <Alert>
        <AlertTitle>Julat normal adalah luas</AlertTitle>
        <AlertDescription>
          Setiap kanak-kanak berkembang mengikut rentaknya sendiri. Item yang
          belum ditanda bukan tanda masalah - julat umur di sini hanya
          menunjukkan bila ia biasanya berlaku. Bincang dengan klinik jika anda
          ada kemusykilan.
        </AlertDescription>
      </Alert>

      {book?.source === "placeholder" ? (
        <Alert>
          <AlertTitle>Senarai contoh</AlertTitle>
          <AlertDescription>
            Kandungan senarai ini masih contoh untuk pembangunan dan belum
            berdasarkan rujukan klinikal rasmi.
          </AlertDescription>
        </Alert>
      ) : null}

      {book && !book.ready ? (
        <Alert>
          <AlertTitle>Tarikh lahir belum ditetapkan</AlertTitle>
          <AlertDescription>
            {book.messages.date_of_birth ??
              "Tambah tarikh lahir untuk melihat julat umur biasa."}
          </AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <AsyncStateBanner error={error} onRetry={() => void reload()} />
      ) : null}

      {isLoading && !book ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : null}

      {book
        ? MILESTONE_DOMAINS.filter((domain) => byDomain.has(domain)).map(
            (domain) => (
              <Card key={domain}>
                <CardHeader>
                  <CardTitle>{MILESTONE_DOMAIN_LABELS[domain]}</CardTitle>
                  <CardDescription>
                    Tanda item yang anak anda sudah lakukan.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {(byDomain.get(domain) ?? []).map((item) => {
                    const achieved = item.status === "achieved"
                    return (
                      <div
                        key={item.milestoneId}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                      >
                        <div className="min-w-0 space-y-1">
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">
                            Biasanya {item.typicalFromMonths}–
                            {item.typicalToMonths} bulan
                            {achieved && item.achievedAt
                              ? ` · ditanda ${formatDate(item.achievedAt)}`
                              : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {achieved ? (
                            <Badge variant="secondary">Sudah</Badge>
                          ) : null}
                          <Button
                            size="sm"
                            variant={achieved ? "outline" : "default"}
                            isDisabled={busyId === item.milestoneId}
                            onPress={() => void toggle(item)}
                          >
                            {achieved ? "Buang tanda" : "Tanda sudah"}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )
          )
        : null}
    </div>
  )
}
