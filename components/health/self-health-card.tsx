"use client"

import { useEffect, useState } from "react"
import { IconDroplet, IconPhone, IconRotate } from "@tabler/icons-react"
import { toast } from "sonner"

import { CardFace, FaceRow } from "@/components/health/person-health"
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { StatusChip } from "@/components/status-chip"
import { getHealthRepository } from "@/lib/composition/health-repository"
import { BLOOD_TYPES, type BloodType, type HealthProfile } from "@/lib/domain/health"
import { isApiError, messageForApiError } from "@/lib/infrastructure/api/errors"
import { cn } from "@/lib/utils"

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

  const update = (patch: HealthProfile) => setDraft({ ...draft, ...patch })

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <Card>
        <CardHeader>
          <CardTitle>Kad kecemasan</CardTitle>
          <CardDescription>
            Maklumat perubatan anda yang dibaca semasa kecemasan. Medan yang
            dikosongkan akan dibuang.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col gap-5">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : (
            <FieldGroup>
              <Field>
                <FieldLabel>Jenis darah</FieldLabel>
                <Select
                  className="w-full"
                  aria-label="Jenis darah"
                  value={draft.bloodType ?? ""}
                  onChange={(key) =>
                    update({ bloodType: (key || undefined) as BloodType })
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
                  onChange={(value) => update({ isOrganDonor: value })}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="self-name">Kenalan kecemasan</FieldLabel>
                <Input
                  id="self-name"
                  value={draft.emergencyContactName ?? ""}
                  onChange={(event) =>
                    update({ emergencyContactName: event.target.value })
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
                    update({ emergencyContactPhone: event.target.value })
                  }
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="self-insurer">Insurans</FieldLabel>
                <Input
                  id="self-insurer"
                  value={draft.insuranceProvider ?? ""}
                  onChange={(event) =>
                    update({ insuranceProvider: event.target.value })
                  }
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="self-policy">Nombor polisi</FieldLabel>
                <Input
                  id="self-policy"
                  value={draft.insurancePolicyNo ?? ""}
                  onChange={(event) =>
                    update({ insurancePolicyNo: event.target.value })
                  }
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="self-notes">Nota</FieldLabel>
                <Textarea
                  id="self-notes"
                  rows={3}
                  value={draft.notes ?? ""}
                  onChange={(event) => update({ notes: event.target.value })}
                />
              </Field>
            </FieldGroup>
          )}
        </CardContent>
        <CardFooter className="justify-end">
          <Button isDisabled={loading || saving} onPress={() => void save()}>
            {saving ? "Menyimpan..." : "Simpan kad"}
          </Button>
        </CardFooter>
      </Card>

      <SelfCardPreview profile={draft} />
    </div>
  )
}

/**
 * Pratonton langsung: apa yang anda taip di sebelah kiri, kad itu rupanya di sini.
 * Bentuknya sama dengan kad sebenar dalam rekod kesihatan (CardFace/FaceRow) supaya
 * tiada dua rupa "kad kecemasan" dalam aplikasi.
 * ponytail: skop /v1/me hanya mendedahkan profil, jadi baris "Alahan" tidak hadir di
 * sini walaupun kad sebenar memaparkannya. Naik taraf: tambah baris itu bila /v1/me
 * mendedahkan senarai alahan sendiri.
 */
function SelfCardPreview({ profile }: { profile: HealthProfile }) {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <Card className="lg:sticky lg:top-4">
      <CardHeader>
        <CardTitle>Pratonton kad</CardTitle>
        <CardDescription>Sepuluh saat pertama - apa yang dibaca.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="perspective-distant">
          <div
            className={cn(
              "relative min-h-72 transition-transform duration-500 ease-out transform-3d",
              isFlipped && "rotate-y-180"
            )}
          >
            <CardFace className="relative">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs tracking-wide text-muted-foreground uppercase">
                    Kad kecemasan
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Sepuluh saat pertama
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-xl border bg-muted/40 px-3 py-2">
                  <IconDroplet className="size-5 text-destructive" />
                  <span className="font-heading text-2xl leading-none tabular-nums">
                    {profile.bloodType ?? "?"}
                  </span>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <FaceRow label="Hubungi">
                  <p className="text-sm font-medium">
                    {profile.emergencyContactName || "Kenalan belum diisi"}
                  </p>
                  {profile.emergencyContactPhone ? (
                    <a
                      href={`tel:${profile.emergencyContactPhone}`}
                      className="inline-flex items-center gap-1.5 text-sm underline underline-offset-4"
                    >
                      <IconPhone className="size-4" />
                      {profile.emergencyContactPhone}
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Nombor belum diisi
                    </span>
                  )}
                </FaceRow>

                {profile.isOrganDonor ? (
                  <StatusChip tone="positive" label="Penderma organ" />
                ) : null}
              </div>
            </CardFace>

            <CardFace className="absolute inset-0 rotate-y-180">
              <p className="text-xs tracking-wide text-muted-foreground uppercase">
                Di kaunter
              </p>
              <div className="mt-4 space-y-3">
                <FaceRow label="Insurans">
                  <span className="text-sm">
                    {profile.insuranceProvider || "Tiada"}
                  </span>
                </FaceRow>
                <FaceRow label="Nombor polisi">
                  <span className="text-sm tabular-nums">
                    {profile.insurancePolicyNo || "Tiada"}
                  </span>
                </FaceRow>
                <FaceRow label="Nota">
                  <p className="text-sm whitespace-pre-line">
                    {profile.notes || "Tiada nota."}
                  </p>
                </FaceRow>
              </div>
            </CardFace>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onPress={() => setIsFlipped((v) => !v)}
        >
          <IconRotate />
          {isFlipped ? "Tunjuk depan" : "Balikkan kad"}
        </Button>
      </CardContent>
    </Card>
  )
}