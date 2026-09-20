"use client"

import { useState } from "react"
import { toast } from "sonner"

import { AsyncStateBanner } from "@/components/shared/async-state"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useCircleSettings } from "@/hooks/use-circle-settings"
import {
  CIRCLE_TYPE_LABELS,
  type CircleSettings,
  type CircleType,
} from "@/lib/domain/circle"
import { isApiError, messageForApiError } from "@/lib/infrastructure/api/errors"

const TYPES = Object.keys(CIRCLE_TYPE_LABELS) as CircleType[]

/**
 * The circle's own settings: name, type, timezone, currency.
 *
 * The three that are not the name are not decoration: currency and timezone
 * are what the money and reminder modules read to format an amount and to fire
 * a reminder at the right local hour.
 *
 * A card and not a table - this is a form (AGENTS.md §1), and the values are
 * single, not a list. The draft lives beside the loaded value instead of being
 * copied into state, so a save shows the server's answer without an effect
 * chasing it.
 */
export function CircleSettingsSection({
  circleId,
  canUpdate,
  onSaved,
}: {
  circleId: string
  canUpdate: boolean
  /** Fires after a save: the circle's name shows in the nav and header. */
  onSaved?: () => void
}) {
  const { settings, isLoading, error, save } = useCircleSettings(circleId)
  const [draft, setDraft] = useState<CircleSettings | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const value = draft ?? settings

  function edit(change: Partial<CircleSettings>) {
    if (!value) {
      return
    }
    setDraft({ ...value, ...change })
  }

  async function persist() {
    if (!value) {
      return
    }
    setIsSaving(true)
    try {
      await save({
        name: value.name.trim(),
        type: value.type,
        timezone: value.timezone.trim(),
        currency: value.currency.trim().toUpperCase(),
      })
      setDraft(null)
      toast.success("Tetapan circle disimpan.")
      onSaved?.()
    } catch (cause) {
      toast.error(
        isApiError(cause)
          ? messageForApiError(cause)
          : "Gagal menyimpan tetapan circle."
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tetapan circle</CardTitle>
        <CardDescription>
          Nama, jenis, zon waktu dan mata wang yang digunakan seluruh circle ini.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AsyncStateBanner
          error={error}
          label="Gagal memuatkan tetapan circle."
        />
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : value ? (
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="circle-name">Nama</FieldLabel>
              <Input
                id="circle-name"
                value={value.name}
                disabled={!canUpdate || isSaving}
                onChange={(event) => edit({ name: event.target.value })}
              />
            </Field>
            <Field>
              <FieldLabel>Jenis</FieldLabel>
              <Select
                className="w-full"
                aria-label="Jenis circle"
                isDisabled={!canUpdate || isSaving}
                value={value.type}
                onChange={(key) => {
                  const next = String(key ?? "")
                  if (next in CIRCLE_TYPE_LABELS) {
                    edit({ type: next as CircleType })
                  }
                }}
              >
                <SelectTrigger size="xl" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((type) => (
                    <SelectItem key={type} id={type}>
                      {CIRCLE_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="circle-timezone">Zon waktu</FieldLabel>
              <Input
                id="circle-timezone"
                value={value.timezone}
                disabled={!canUpdate || isSaving}
                placeholder="Asia/Kuala_Lumpur"
                onChange={(event) => edit({ timezone: event.target.value })}
              />
              <FieldDescription>
                Peringatan dan tarikh dijadualkan mengikut zon ini.
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="circle-currency">Mata wang</FieldLabel>
              <Input
                id="circle-currency"
                value={value.currency}
                maxLength={3}
                disabled={!canUpdate || isSaving}
                placeholder="MYR"
                onChange={(event) => edit({ currency: event.target.value })}
              />
              <FieldDescription>Kod tiga huruf, contoh MYR.</FieldDescription>
            </Field>
          </FieldGroup>
        ) : null}
      </CardContent>
      {canUpdate && value ? (
        <CardFooter className="justify-end">
          <Button
            isDisabled={
              isSaving ||
              draft === null ||
              value.name.trim().length === 0 ||
              value.currency.trim().length === 0
            }
            onPress={() => {
              void persist()
            }}
          >
            Simpan
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  )
}
