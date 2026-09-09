"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { IconFileDescription, IconSparkles } from "@tabler/icons-react"
import { toast } from "sonner"

import { AsyncStateBanner } from "@/components/care/async-state"
import { useCareProfile } from "@/components/care/care-data-provider"
import { PageHeader } from "@/components/care/page-header"
import { PermissionGate } from "@/components/care/permission-gate"
import { SelectProfileEmpty } from "@/components/care/select-profile-empty"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button, LinkButton } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Skeleton } from "@/components/ui/skeleton"
import { useSummaries } from "@/hooks/use-care-admin"
import { formatDate } from "@/lib/application/care-format"
import { validateDateRange } from "@/lib/application/form-validation"
import { isApiError, messageForApiError } from "@/lib/infrastructure/api/errors"

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function daysAgoISO(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().slice(0, 10)
}

export function SummariesPage() {
  const router = useRouter()
  const { selectedProfile } = useCareProfile()
  const summaries = useSummaries(selectedProfile?.id)
  const [periodStart, setPeriodStart] = useState(() => daysAgoISO(30))
  const [periodEnd, setPeriodEnd] = useState(() => todayISO())
  const [isCreating, setIsCreating] = useState(false)

  async function create() {
    const rangeError = validateDateRange(periodStart, periodEnd)
    if (rangeError) {
      toast.error(rangeError)
      return
    }
    setIsCreating(true)
    try {
      const created = await summaries.create({ periodStart, periodEnd })
      toast.success("Ringkasan disediakan.")
      // Straight to the artefact: the reason to make one is to read or print
      // it, and landing back on the list makes that an extra click every time.
      router.push(`/summaries/${created.id}`)
    } catch (cause) {
      toast.error(
        isApiError(cause)
          ? messageForApiError(cause)
          : "Gagal menyediakan ringkasan."
      )
    } finally {
      setIsCreating(false)
    }
  }

  if (!selectedProfile) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Ringkasan doktor" />
        <SelectProfileEmpty />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Ringkasan doktor"
        description="Kumpulkan rekod satu tempoh untuk dibawa ke temujanji."
      />

      <PermissionGate permission="can_export_summary">
        <Alert>
          <IconFileDescription />
          <AlertTitle>Apa yang masuk</AlertTitle>
          <AlertDescription>
            Log jagaan dan temujanji dalam tempoh yang dipilih, ubat semasa, dan
            julat bacaan vital. Semuanya daripada rekod anda sendiri.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Ringkasan baharu</CardTitle>
            <CardDescription>
              Pilih tempoh. Kedua-dua tarikh termasuk dalam ringkasan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Dari</FieldLabel>
                  <DatePicker
                    size="xl"
                    value={periodStart}
                    onChange={setPeriodStart}
                    className="bg-background"
                  />
                </Field>
                <Field>
                  <FieldLabel>Hingga</FieldLabel>
                  <DatePicker
                    size="xl"
                    value={periodEnd}
                    onChange={setPeriodEnd}
                    className="bg-background"
                  />
                </Field>
              </div>
            </FieldGroup>
          </CardContent>
          <CardFooter className="justify-end">
            <Button
              isDisabled={isCreating}
              onPress={() => {
                void create()
              }}
            >
              {isCreating ? "Menyediakan..." : "Sediakan ringkasan"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ringkasan tersimpan</CardTitle>
          </CardHeader>
          <CardContent>
            <AsyncStateBanner
              error={summaries.error}
              onRetry={() => {
                void summaries.reload()
              }}
              label="Gagal memuatkan ringkasan."
            />

            {summaries.isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : summaries.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada ringkasan. Sediakan yang pertama di atas.
              </p>
            ) : (
              <ItemGroup className="gap-3">
                {summaries.data.map((summary) => (
                  <Item key={summary.id} variant="muted">
                    <ItemMedia variant="icon">
                      <IconFileDescription />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle className="flex flex-wrap items-center gap-2">
                        {formatDate(summary.periodStart)} –{" "}
                        {formatDate(summary.periodEnd)}
                        {/* The badge only appears for model output. An
                            assembled summary invents nothing, so labelling it
                            would imply a caveat that does not apply. */}
                        {summary.generator === "ai" ? (
                          <Badge variant="outline">
                            <IconSparkles />
                            Dijana AI
                          </Badge>
                        ) : null}
                      </ItemTitle>
                      <ItemDescription>
                        {summary.content.logs.length} log ·{" "}
                        {summary.content.medications.length} ubat ·{" "}
                        {summary.content.appointments.length} temujanji
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <LinkButton
                        variant="outline"
                        size="sm"
                        href={`/summaries/${summary.id}`}
                      >
                        Lihat
                      </LinkButton>
                    </ItemActions>
                  </Item>
                ))}
              </ItemGroup>
            )}
          </CardContent>
        </Card>
      </PermissionGate>
    </div>
  )
}
