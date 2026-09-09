"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  IconAlertTriangle,
  IconHeartbeat,
  IconShieldHalf,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { useAuth } from "@/components/auth/auth-provider"
import { AsyncStateBanner } from "@/components/care/async-state"
import { PageHeader } from "@/components/care/page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
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
import { Textarea } from "@/components/ui/textarea"
import { useOwnHealthProfile } from "@/hooks/use-own-health-profile"
import { formatPersonNameInput } from "@/lib/application/format-person-name"
import { fieldValue } from "@/lib/application/form-value"
import {
  BLOOD_TYPE_OPTIONS,
  GENDER_OPTIONS,
  type CareProfile,
} from "@/lib/domain/care"
import { isApiError, messageForApiError } from "@/lib/infrastructure/api/errors"

type FormState = {
  legalName: string
  dateOfBirth: string
  gender: string
  bloodType: string
  allergySummary: string
  conditionSummary: string
  primaryClinic: string
  primaryDoctor: string
  emergencyNote: string
}

function formFromProfile(profile: CareProfile): FormState {
  return {
    legalName: profile.legalName ?? "",
    dateOfBirth: profile.dateOfBirth ?? "",
    gender: profile.gender ?? "",
    bloodType: profile.bloodType ?? "",
    allergySummary: profile.allergySummary ?? "",
    conditionSummary: profile.conditionSummary ?? "",
    primaryClinic: profile.primaryClinic ?? "",
    primaryDoctor: profile.primaryDoctor ?? "",
    emergencyNote: profile.emergencyNote ?? "",
  }
}

const empty: FormState = {
  legalName: "",
  dateOfBirth: "",
  gender: "",
  bloodType: "",
  allergySummary: "",
  conditionSummary: "",
  primaryClinic: "",
  primaryDoctor: "",
  emergencyNote: "",
}

export function OwnHealthPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { profile, isLoading, error, reload, save } = useOwnHealthProfile()
  const [form, setForm] = useState<FormState>(empty)
  const [isSaving, setIsSaving] = useState(false)

  // Seeded once per record, not on every change to it.
  //
  // Re-seeding whenever `profile` changed meant a save overwrote the form with
  // whatever the response happened to contain - so a field the server dropped
  // came back blank while the toast said it saved, and anything typed during a
  // background reload was thrown away mid-edit.
  const seededFor = useRef<string | null>(null)

  useEffect(() => {
    if (!profile || seededFor.current === profile.id) {
      return
    }
    seededFor.current = profile.id
    setForm(formFromProfile(profile))
  }, [profile])

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function submit() {
    if (isLoading) {
      // Saving before the first read lands sends a create where an update was
      // meant. The endpoint handles that correctly now, but the request is
      // still the wrong one to send.
      return
    }
    setIsSaving(true)
    try {
      const payload = {
        ...form,
        legalName: formatPersonNameInput(form.legalName).trim(),
      }
      const saved = await save({ displayName: user?.displayName, ...payload })
      setForm(formFromProfile(saved))
      toast.success("Maklumat kesihatan disimpan.")
    } catch (cause) {
      toast.error(
        isApiError(cause) ? messageForApiError(cause) : "Gagal menyimpan."
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Kesihatan saya"
        description="Maklumat kesihatan anda sendiri, bukan orang yang anda jaga."
        actions={
          profile ? (
            <Button
              variant="outline"
              onPress={() => {
                // The id travels in the URL. The previous version set the
                // selected profile and navigated, which looked right and was
                // not: the provider rejects an id that is absent from the
                // loaded snapshot and falls back to the default profile, so
                // this button showed a relative's card.
                router.push(`/emergency-card?profile=${profile.id}`)
              }}
            >
              <IconAlertTriangle />
              Lihat kad kecemasan saya
            </Button>
          ) : null
        }
      />

      <AsyncStateBanner
        error={error}
        onRetry={() => {
          void reload()
        }}
        label="Gagal memuatkan maklumat kesihatan."
      />

      {/*
        Two sentences, not a paragraph. Someone opening this page needs to know
        what it is for and who it is about - nothing else.
      */}
      <Alert>
        <IconShieldHalf />
        <AlertTitle>Untuk kecemasan</AlertTitle>
        <AlertDescription>
          Isi apa yang berguna kepada doktor jika anda tidak boleh bercakap.
          Biarkan kosong yang anda tak mahu simpan.
        </AlertDescription>
      </Alert>

      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <>
          {!profile ? (
            <Alert>
              <IconHeartbeat />
              <AlertTitle>Belum disediakan</AlertTitle>
              <AlertDescription>
                Isi mana-mana medan di bawah dan tekan simpan. Rekod anda
                dicipta kali pertama anda menyimpan.
              </AlertDescription>
            </Alert>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Asas</CardTitle>
              <CardDescription>
                Nama penuh, tarikh lahir, jantina dan jenis darah.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="legal-name">
                    Nama penuh (seperti dalam MyKad)
                  </FieldLabel>
                  <Input
                    id="legal-name"
                    size="xl"
                    className="bg-background"
                    value={form.legalName}
                    onChange={(event) =>
                      set(
                        "legalName",
                        formatPersonNameInput(fieldValue(event))
                      )
                    }
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>Tarikh lahir</FieldLabel>
                    <DatePicker
                      size="xl"
                      value={form.dateOfBirth}
                      onChange={(value) => set("dateOfBirth", value)}
                      className="bg-background"
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Jenis darah</FieldLabel>
                    {/* A select, not free text: there are eight blood groups
                        and a typo in this field is a clinical hazard, not a
                        cosmetic one. */}
                    <Select
                      className="w-full"
                      value={form.bloodType || null}
                      onChange={(key) => set("bloodType", String(key ?? ""))}
                      placeholder="Pilih jenis darah"
                    >
                      <SelectTrigger size="xl" className="w-full bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BLOOD_TYPE_OPTIONS.map((item) => (
                          <SelectItem key={item.value} id={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>Jantina</FieldLabel>
                    <Select
                      className="w-full"
                      value={form.gender || null}
                      onChange={(key) => set("gender", String(key ?? ""))}
                      placeholder="Pilih jantina"
                    >
                      <SelectTrigger size="xl" className="w-full bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GENDER_OPTIONS.map((item) => (
                          <SelectItem key={item.value} id={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Perubatan</CardTitle>
              <CardDescription>
                Alahan, keadaan kesihatan, klinik dan doktor utama.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="allergies">Alahan</FieldLabel>
                  <Textarea
                    id="allergies"
                    className="min-h-20"
                    placeholder="Contoh: Penisilin, kacang"
                    value={form.allergySummary}
                    onChange={(event) =>
                      set("allergySummary", fieldValue(event))
                    }
                  />
                  <FieldDescription>
                    Ini yang paling penting dalam kecemasan.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="conditions">
                    Keadaan kesihatan
                  </FieldLabel>
                  <Textarea
                    id="conditions"
                    className="min-h-20"
                    placeholder="Contoh: Diabetes jenis 2, asma"
                    value={form.conditionSummary}
                    onChange={(event) =>
                      set("conditionSummary", fieldValue(event))
                    }
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="clinic">Klinik utama</FieldLabel>
                    <Input
                      id="clinic"
                      size="xl"
                      className="bg-background"
                      value={form.primaryClinic}
                      onChange={(event) =>
                        set("primaryClinic", fieldValue(event))
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="doctor">Doktor utama</FieldLabel>
                    <Input
                      id="doctor"
                      size="xl"
                      className="bg-background"
                      value={form.primaryDoctor}
                      onChange={(event) =>
                        set("primaryDoctor", fieldValue(event))
                      }
                    />
                  </Field>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Nota kecemasan</CardTitle>
              <CardDescription>
                Apa yang orang perlu tahu serta-merta.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Field>
                <FieldLabel htmlFor="emergency-note" className="sr-only">
                  Nota kecemasan
                </FieldLabel>
                <Textarea
                  id="emergency-note"
                  className="min-h-24"
                  placeholder="Contoh: Hubungi Aisyah 012-3456789 dahulu."
                  value={form.emergencyNote}
                  onChange={(event) => set("emergencyNote", fieldValue(event))}
                />
              </Field>
            </CardContent>
            <CardFooter className="justify-end">
              <Button
                isDisabled={isSaving || isLoading}
                onPress={() => {
                  void submit()
                }}
              >
                {isSaving ? "Menyimpan..." : "Simpan"}
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  )
}
