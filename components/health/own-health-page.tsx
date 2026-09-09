"use client"

import { useEffect, useState } from "react"
import { IconHeartbeat, IconShieldHalf } from "@tabler/icons-react"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useOwnHealthProfile } from "@/hooks/use-own-health-profile"
import { fieldValue } from "@/lib/application/form-value"
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
  const { user } = useAuth()
  const { profile, isLoading, error, reload, save } = useOwnHealthProfile()
  const [form, setForm] = useState<FormState>(empty)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!profile) {
      return
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      legalName: profile.legalName ?? "",
      dateOfBirth: profile.dateOfBirth ?? "",
      gender: profile.gender ?? "",
      bloodType: profile.bloodType ?? "",
      allergySummary: profile.allergySummary ?? "",
      conditionSummary: profile.conditionSummary ?? "",
      primaryClinic: profile.primaryClinic ?? "",
      primaryDoctor: profile.primaryDoctor ?? "",
      emergencyNote: profile.emergencyNote ?? "",
    })
  }, [profile])

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function submit() {
    setIsSaving(true)
    try {
      await save({ displayName: user?.displayName, ...form })
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
                    onChange={(event) => set("legalName", fieldValue(event))}
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
                    <FieldLabel htmlFor="blood-type">Jenis darah</FieldLabel>
                    <Input
                      id="blood-type"
                      size="xl"
                      className="bg-background"
                      placeholder="Contoh: O+"
                      value={form.bloodType}
                      onChange={(event) => set("bloodType", fieldValue(event))}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="gender">Jantina</FieldLabel>
                    <Input
                      id="gender"
                      size="xl"
                      className="bg-background"
                      value={form.gender}
                      onChange={(event) => set("gender", fieldValue(event))}
                    />
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
                isDisabled={isSaving}
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
