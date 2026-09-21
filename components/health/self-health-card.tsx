"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { getHealthRepository } from "@/lib/composition/health-repository"
import { BLOOD_TYPES, type BloodType, type HealthProfile } from "@/lib/domain/health"
import { isApiError, messageForApiError } from "@/lib/infrastructure/api/errors"

const EMPTY: HealthProfile = {}

// Kad kecemasan SAYA (skop /v1/me/health-profile), diisi lewat linked_user_id. Akaun
// yang belum dikaitkan dengan person: GET pulang {exists:false} (borang kosong), dan
// PUT ditolak 409 dengan mesej pelayan "kaitkan akaun dahulu". Itu cukup.
export function SelfHealthCard() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<HealthProfile>(EMPTY)

  useEffect(() => {
    let cancelled = false
    getHealthRepository()
      .getSelfProfile()
      .then(({ exists, profile }) => {
        if (!cancelled) {
          setDraft(exists ? profile : EMPTY)
        }
      })
      .catch((cause) => {
        if (!cancelled) {
          toast.error(
            isApiError(cause) ? messageForApiError(cause) : "Gagal memuat kad."
          )
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function save() {
    setSaving(true)
    try {
      await getHealthRepository().saveSelfProfile(draft)
      toast.success("Kad kecemasan disimpan.")
    } catch (cause) {
      toast.error(
        isApiError(cause) ? messageForApiError(cause) : "Gagal menyimpan."
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kad kecemasan</CardTitle>
        <CardDescription>
          Maklumat perubatan anda sendiri yang dibaca semasa kecemasan. Medan
          yang dikosongkan akan dibuang.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : (
          <>
            <Field>
              <FieldLabel>Jenis darah</FieldLabel>
              <Select
                className="w-full"
                aria-label="Jenis darah"
                value={draft.bloodType ?? ""}
                onChange={(key) =>
                  setDraft({ ...draft, bloodType: (key || undefined) as BloodType })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BLOOD_TYPES.map((type) => (
                    <SelectItem key={type} id={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field orientation="horizontal">
              <div className="min-w-0 space-y-0.5">
                <FieldLabel>Penderma organ</FieldLabel>
                <FieldDescription>Seperti tercatat pada kad.</FieldDescription>
              </div>
              <Switch
                aria-label="Penderma organ"
                isSelected={draft.isOrganDonor ?? false}
                onChange={(value) => setDraft({ ...draft, isOrganDonor: value })}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="self-name">Kenalan kecemasan</FieldLabel>
              <Input
                id="self-name"
                value={draft.emergencyContactName ?? ""}
                onChange={(event) =>
                  setDraft({ ...draft, emergencyContactName: event.target.value })
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="self-phone">Nombor telefon</FieldLabel>
              <Input
                id="self-phone"
                type="tel"
                value={draft.emergencyContactPhone ?? ""}
                onChange={(event) =>
                  setDraft({ ...draft, emergencyContactPhone: event.target.value })
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="self-insurer">Insurans</FieldLabel>
              <Input
                id="self-insurer"
                value={draft.insuranceProvider ?? ""}
                onChange={(event) =>
                  setDraft({ ...draft, insuranceProvider: event.target.value })
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="self-policy">Nombor polisi</FieldLabel>
              <Input
                id="self-policy"
                value={draft.insurancePolicyNo ?? ""}
                onChange={(event) =>
                  setDraft({ ...draft, insurancePolicyNo: event.target.value })
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="self-notes">Nota</FieldLabel>
              <Textarea
                id="self-notes"
                rows={3}
                value={draft.notes ?? ""}
                onChange={(event) =>
                  setDraft({ ...draft, notes: event.target.value })
                }
              />
            </Field>
          </>
        )}
      </CardContent>
      <CardFooter className="justify-end">
        <Button isDisabled={loading || saving} onPress={() => void save()}>
          {saving ? "Menyimpan..." : "Simpan kad"}
        </Button>
      </CardFooter>
    </Card>
  )
}