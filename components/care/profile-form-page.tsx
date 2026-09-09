"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { ApiFieldGapNotice } from "@/components/care/api-field-gap-notice"
import { CareFormShell } from "@/components/care/care-form-shell"
import { useCareData } from "@/components/care/care-data-provider"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { fieldValue } from "@/lib/application/form-value"
import { parseDate, required } from "@/lib/application/form-validation"
import { isMockDataEnabled } from "@/lib/infrastructure/config"
import { RELATION_OPTIONS } from "@/lib/domain/care"

export function ProfileFormPage({ profileId }: { profileId?: string }) {
  const router = useRouter()
  const apiMode = !isMockDataEnabled()
  const { snapshot, createProfile, updateProfile, linkProfileToCircle } =
    useCareData()
  const existing = snapshot.profiles.find((item) => item.id === profileId)
  const backHref = existing ? `/care-profiles/${existing.id}` : "/care-profiles"
  const [displayName, setDisplayName] = useState(existing?.displayName ?? "")
  const [relation, setRelation] = useState(existing?.relation ?? "")
  const [dateOfBirth, setDateOfBirth] = useState(existing?.dateOfBirth ?? "")
  const [notes, setNotes] = useState(existing?.notes ?? "")
  const [circleId, setCircleId] = useState(existing?.circleId ?? "")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const dirty = apiMode
    ? displayName !== (existing?.displayName ?? "")
    : displayName !== (existing?.displayName ?? "") ||
      relation !== (existing?.relation ?? "") ||
      dateOfBirth !== (existing?.dateOfBirth ?? "") ||
      notes !== (existing?.notes ?? "") ||
      circleId !== (existing?.circleId ?? "")

  return (
    <CareFormShell
      title={
        existing ? `Sunting ${existing.displayName}` : "Tambah profil jagaan"
      }
      description="Orang yang anda jaga."
      backHref={backHref}
      dirty={dirty}
      submitLabel={existing ? "Simpan" : "Cipta"}
      onSubmit={() => {
        const nextErrors: Record<string, string> = {}
        const nameError = required(displayName, "Nama")
        if (nameError) {
          nextErrors.displayName = nameError
        }
        if (!apiMode && !relation) {
          nextErrors.relation = "Hubungan diperlukan."
        }
        // date_of_birth is persisted in both modes since 2026-09-09, so the
        // check is no longer mock-only.
        if (dateOfBirth && !parseDate(dateOfBirth)) {
          nextErrors.dateOfBirth = "Tarikh lahir tidak sah."
        }
        setErrors(nextErrors)
        if (Object.keys(nextErrors).length > 0) {
          toast.error("Sila betulkan medan yang ditandakan.")
          return
        }

        if (existing) {
          void updateProfile(
            existing.id,
            apiMode
              ? { displayName: displayName.trim(), dateOfBirth }
              : {
                  displayName: displayName.trim(),
                  relation,
                  dateOfBirth,
                  notes,
                }
          )
            .then(() => {
              if (!apiMode && circleId) {
                return linkProfileToCircle(existing.id, circleId)
              }
            })
            .then(() => router.push(`/care-profiles/${existing.id}`))
            .catch(() => undefined)
          return
        }

        void createProfile(
          apiMode
            ? { displayName: displayName.trim(), dateOfBirth }
            : {
                displayName: displayName.trim(),
                relation,
                dateOfBirth,
                notes,
              }
        )
          .then((created) => {
            if (!apiMode && circleId) {
              return linkProfileToCircle(created.id, circleId).then(
                () => created
              )
            }
            return created
          })
          .then((created) => router.push(`/care-profiles/${created.id}`))
          .catch(() => undefined)
      }}
    >
      <FieldGroup>
        {apiMode ? (
          <ApiFieldGapNotice>
            Hubungan, nota, dan pilihan kumpulan kekal dalam mod mock. Nama dan
            tarikh lahir disimpan.
          </ApiFieldGapNotice>
        ) : null}
        <Field data-invalid={Boolean(errors.displayName)}>
          <FieldLabel>Nama</FieldLabel>
          <Input
            className="h-11 bg-background"
            value={displayName}
            onChange={(event) => setDisplayName(fieldValue(event))}
          />
          {errors.displayName ? (
            <FieldError>{errors.displayName}</FieldError>
          ) : null}
        </Field>
        {!apiMode ? (
          <>
            <Field data-invalid={Boolean(errors.relation)}>
              <FieldLabel>Hubungan</FieldLabel>
              <Select
                className="w-full"
                selectedKey={relation || null}
                onSelectionChange={(key) => setRelation(String(key ?? ""))}
                placeholder="Pilih hubungan"
              >
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RELATION_OPTIONS.map((item) => (
                    <SelectItem key={item.value} id={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.relation ? (
                <FieldError>{errors.relation}</FieldError>
              ) : null}
            </Field>
            <Field data-invalid={Boolean(errors.dateOfBirth)}>
              <FieldLabel>Tarikh lahir</FieldLabel>
              <DatePicker
                value={dateOfBirth}
                onChange={setDateOfBirth}
                className="bg-background"
              />
              {errors.dateOfBirth ? (
                <FieldError>{errors.dateOfBirth}</FieldError>
              ) : null}
            </Field>
            <Field>
              <FieldLabel>Kumpulan</FieldLabel>
              <Select
                className="w-full"
                selectedKey={circleId || null}
                onSelectionChange={(key) => setCircleId(String(key ?? ""))}
                placeholder="Pilih kumpulan"
              >
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {snapshot.circles
                    .filter((item) => !item.archived)
                    .map((circle) => (
                      <SelectItem key={circle.id} id={circle.id}>
                        {circle.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Nota</FieldLabel>
              <Textarea
                className="min-h-28"
                value={notes}
                onChange={(event) => setNotes(fieldValue(event))}
              />
            </Field>
          </>
        ) : null}
      </FieldGroup>
    </CareFormShell>
  )
}
