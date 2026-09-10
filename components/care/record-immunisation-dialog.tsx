"use client"

import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { getGrowthRepository } from "@/lib/composition/growth-repository"
import type { ImmunisationItem } from "@/lib/domain/growth"
import { isApiError, messageForApiError } from "@/lib/infrastructure/api/errors"

export function RecordImmunisationDialog({
  profileId,
  item,
  open,
  onOpenChange,
  onSaved,
  mode = "record",
  recordId,
  initialGivenAt,
  initialNote,
}: {
  profileId: string
  item: ImmunisationItem
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
  mode?: "record" | "edit"
  recordId?: string
  initialGivenAt?: string
  initialNote?: string
}) {
  if (!open) {
    return null
  }

  return (
    <RecordImmunisationDialogForm
      key={`${mode}-${item.scheduleDoseId}-${recordId ?? "new"}`}
      profileId={profileId}
      item={item}
      onOpenChange={onOpenChange}
      onSaved={onSaved}
      mode={mode}
      recordId={recordId}
      initialGivenAt={initialGivenAt}
      initialNote={initialNote}
    />
  )
}

function RecordImmunisationDialogForm({
  profileId,
  item,
  onOpenChange,
  onSaved,
  mode,
  recordId,
  initialGivenAt,
  initialNote,
}: {
  profileId: string
  item: ImmunisationItem
  onOpenChange: (open: boolean) => void
  onSaved: () => void
  mode: "record" | "edit"
  recordId?: string
  initialGivenAt?: string
  initialNote?: string
}) {
  const [givenAt, setGivenAt] = useState(initialGivenAt ?? item.dueDate ?? "")
  const [note, setNote] = useState(initialNote ?? "")
  const [error, setError] = useState<string>()
  const [isSaving, setIsSaving] = useState(false)

  async function save() {
    if (!givenAt.trim()) {
      setError("Tarikh diberi diperlukan.")
      return
    }

    setIsSaving(true)
    setError(undefined)
    try {
      const repo = getGrowthRepository()
      if (mode === "edit" && recordId) {
        await repo.updateImmunisation(profileId, recordId, {
          givenAt,
          note: note.trim() || undefined,
        })
        toast.success("Rekod imunisasi dikemas kini.")
      } else {
        await repo.recordImmunisation(profileId, {
          scheduleDoseId: item.scheduleDoseId,
          givenAt,
          note: note.trim() || undefined,
        })
        toast.success("Dos imunisasi direkodkan.")
      }
      onOpenChange(false)
      onSaved()
    } catch (cause) {
      const message = isApiError(cause)
        ? messageForApiError(cause)
        : cause instanceof Error
          ? cause.message
          : "Gagal menyimpan rekod."
      setError(message)
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog isOpen className="sm:max-w-md" onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>
          {mode === "edit" ? "Sunting rekod imunisasi" : "Rekod dos imunisasi"}
        </DialogTitle>
        <DialogDescription>
          {item.vaccine} — {item.label}
        </DialogDescription>
      </DialogHeader>
      <FieldGroup>
        <Field data-invalid={Boolean(error && !givenAt.trim())}>
          <FieldLabel>Tarikh diberi</FieldLabel>
          <DatePicker
            size="xl"
            value={givenAt}
            onChange={setGivenAt}
            className="bg-background"
          />
        </Field>
        <Field>
          <FieldLabel>Nota (pilihan)</FieldLabel>
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Contoh: Klinik kesihatan, nombor batch"
            rows={3}
          />
        </Field>
        {error ? <FieldError>{error}</FieldError> : null}
      </FieldGroup>
      <DialogFooter>
        <DialogClose variant="outline">Batal</DialogClose>
        <Button isDisabled={isSaving} onPress={() => void save()}>
          {mode === "edit" ? "Simpan" : "Rekod"}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
