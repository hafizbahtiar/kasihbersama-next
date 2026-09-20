"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { ResponsiveDialog } from "@/components/responsive-dialog"
import { Button } from "@/components/ui/button"
import { DateField } from "@/components/ui/date-field"
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
import { getCircleRepository } from "@/lib/composition/circle-repository"
import {
  SEX_OPTIONS,
  type CirclePerson,
  type CirclePersonDetail,
  type PersonPatch,
} from "@/lib/domain/circle"
import { isApiError, messageForApiError } from "@/lib/infrastructure/api/errors"

/** Sentinel: the Select needs an id, and "no answer" is a real choice here. */
const NO_SEX = "none"

/**
 * Edits one person.
 *
 * The list row is not enough to fill this form: it carries no birth date and
 * no notes, because the list is filtered by `person_access` and the restricted
 * fields belong to the single-record read. So the dialog reads the person on
 * open, and the fields it may write back are exactly `fieldsReadable` - a
 * hidden field that was never shown must never be sent, or saving would blank
 * what the reader could not see.
 *
 * Mounted only while open, so `isOpen` is always true here.
 */
export function PersonEditDialog({
  circleId,
  person,
  onOpenChange,
  onSaved,
}: {
  circleId: string
  person: CirclePerson
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const [detail, setDetail] = useState<CirclePersonDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Seeded from the list row so the form is legible while the read is in
  // flight; the read replaces every value when it lands.
  const [fullName, setFullName] = useState(person.fullName)
  const [preferredName, setPreferredName] = useState(
    person.preferredName ?? ""
  )
  const [sex, setSex] = useState(person.sex ?? "")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setLoadError(null)
      try {
        const loaded = await getCircleRepository().getPerson(
          circleId,
          person.id
        )
        if (cancelled) {
          return
        }
        setDetail(loaded)
        setFullName(loaded.fullName)
        setPreferredName(loaded.preferredName ?? "")
        setSex(loaded.sex ?? "")
        setDateOfBirth(loaded.dateOfBirth ?? "")
        setNotes(loaded.notes ?? "")
      } catch (cause) {
        if (!cancelled) {
          setLoadError(
            isApiError(cause)
              ? messageForApiError(cause)
              : "Gagal memuatkan orang."
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [circleId, person.id])

  const readable = detail?.fieldsReadable ?? []
  const canEditBirthDate = readable.includes("date_of_birth")
  const canEditNotes = readable.includes("notes")
  // Anything another client stored is still offered, so the control never
  // opens blank on a value it does not know.
  const sexOptions =
    sex && !SEX_OPTIONS.some((option) => option.id === sex)
      ? [...SEX_OPTIONS, { id: sex, label: sex }]
      : SEX_OPTIONS

  async function save() {
    const patch: PersonPatch = {
      fullName: fullName.trim(),
      preferredName: preferredName.trim(),
      sex,
    }
    // An empty birth date means "still unknown", not "clear it": the endpoint
    // ignores "", and dropping the key keeps the meaning on this side too.
    if (canEditBirthDate && dateOfBirth) {
      patch.dateOfBirth = dateOfBirth
    }
    if (canEditNotes) {
      patch.notes = notes
    }

    setIsSaving(true)
    try {
      await getCircleRepository().updatePerson(circleId, person.id, patch)
      toast.success("Orang dikemas kini.")
      onSaved()
      onOpenChange(false)
    } catch (cause) {
      toast.error(
        isApiError(cause) ? messageForApiError(cause) : "Gagal menyimpan orang."
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <ResponsiveDialog
      isOpen
      onOpenChange={onOpenChange}
      title="Kemas kini orang"
      description={person.fullName}
      footer={
        <>
          <Button variant="outline" onPress={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            isDisabled={
              isSaving || isLoading || fullName.trim().length === 0
            }
            onPress={() => {
              void save()
            }}
          >
            Simpan
          </Button>
        </>
      }
    >
      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : loadError ? (
        <p className="text-sm text-destructive">{loadError}</p>
      ) : (
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="person-full-name">Nama penuh</FieldLabel>
            <Input
              id="person-full-name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="person-preferred-name">
              Nama panggilan
            </FieldLabel>
            <Input
              id="person-preferred-name"
              value={preferredName}
              placeholder="Pilihan"
              onChange={(event) => setPreferredName(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>Jantina</FieldLabel>
            <Select
              className="w-full"
              aria-label="Jantina"
              value={sex === "" ? NO_SEX : sex}
              onChange={(key) => {
                const next = String(key ?? NO_SEX)
                setSex(next === NO_SEX ? "" : next)
              }}
            >
              <SelectTrigger size="xl" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem id={NO_SEX}>Tidak dinyatakan</SelectItem>
                {sexOptions.map((option) => (
                  <SelectItem key={option.id} id={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {canEditBirthDate ? (
            <Field>
              <FieldLabel>Tarikh lahir</FieldLabel>
              <DateField
                aria-label="Tarikh lahir"
                value={dateOfBirth}
                onChange={setDateOfBirth}
              />
            </Field>
          ) : null}

          {canEditNotes ? (
            <Field>
              <FieldLabel htmlFor="person-notes">Nota</FieldLabel>
              <Textarea
                id="person-notes"
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
              <FieldDescription>
                Hanya ahli yang polisi field benarkan melihat nota ini.
              </FieldDescription>
            </Field>
          ) : null}

          {!canEditBirthDate && !canEditNotes ? (
            <p className="text-sm text-muted-foreground">
              Medan terhad (tarikh lahir dan nota) tidak dikongsi dengan anda,
              jadi ia tidak boleh disunting di sini.
            </p>
          ) : null}
        </FieldGroup>
      )}
    </ResponsiveDialog>
  )
}
