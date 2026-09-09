"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { CareFormShell } from "@/components/care/care-form-shell"
import { SelectProfileEmpty } from "@/components/care/select-profile-empty"
import { useCareData } from "@/components/care/care-data-provider"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { DateTimePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toDateTimeLocalValue } from "@/lib/application/care-format"
import { fieldValue } from "@/lib/application/form-value"
import { parseDateTimeLocal, required } from "@/lib/application/form-validation"

export function AppointmentFormPage() {
  const router = useRouter()
  const { selectedProfile, addAppointment } = useCareData()
  const [title, setTitle] = useState("")
  const [location, setLocation] = useState("")
  const [doctorName, setDoctorName] = useState("")
  const [appointmentAt, setAppointmentAt] = useState(() =>
    toDateTimeLocalValue()
  )
  const [notes, setNotes] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const dirty = Boolean(title || location || doctorName || notes)

  return (
    <CareFormShell
      title="Temujanji baharu"
      description="Doktor, tarikh, dan masa. Nota kalau perlu."
      backHref="/appointments"
      dirty={dirty}
      isDisabled={!selectedProfile}
      onSubmit={() => {
        if (!selectedProfile) {
          return
        }

        const nextErrors: Record<string, string> = {}
        const titleError = required(title, "Tajuk")
        if (titleError) {
          nextErrors.title = titleError
        }
        const appointmentIso = parseDateTimeLocal(appointmentAt)
        if (!appointmentIso) {
          nextErrors.appointmentAt = "Masa temujanji tidak sah."
        }
        setErrors(nextErrors)
        if (Object.keys(nextErrors).length > 0 || !appointmentIso) {
          toast.error("Sila betulkan medan yang ditandakan.")
          return
        }

        void addAppointment({
          profileId: selectedProfile.id,
          title: title.trim(),
          location,
          doctorName,
          appointmentAt: appointmentIso,
          notes,
          status: "scheduled",
        })
          .then(() => {
            toast.success("Temujanji ditambah.")
            router.push("/appointments")
          })
          .catch(() => undefined)
      }}
    >
      {!selectedProfile ? (
        <SelectProfileEmpty />
      ) : (
        <FieldGroup>
          <Field data-invalid={Boolean(errors.title)}>
            <FieldLabel>Tajuk</FieldLabel>
            <Input
              className="h-11 bg-background"
              value={title}
              onChange={(event) => setTitle(fieldValue(event))}
            />
            {errors.title ? <FieldError>{errors.title}</FieldError> : null}
          </Field>
          <Field>
            <FieldLabel>Tempat</FieldLabel>
            <Input
              className="h-11 bg-background"
              value={location}
              onChange={(event) => setLocation(fieldValue(event))}
            />
          </Field>
          <Field>
            <FieldLabel>Doktor</FieldLabel>
            <Input
              className="h-11 bg-background"
              value={doctorName}
              onChange={(event) => setDoctorName(fieldValue(event))}
            />
          </Field>
          <Field data-invalid={Boolean(errors.appointmentAt)}>
            <FieldLabel>Masa</FieldLabel>
            <DateTimePicker
              value={appointmentAt}
              onChange={setAppointmentAt}
              className="bg-background"
            />
            {errors.appointmentAt ? (
              <FieldError>{errors.appointmentAt}</FieldError>
            ) : null}
          </Field>
          <Field>
            <FieldLabel>Nota</FieldLabel>
            <Textarea
              className="min-h-24"
              value={notes}
              onChange={(event) => setNotes(fieldValue(event))}
            />
          </Field>
        </FieldGroup>
      )}
    </CareFormShell>
  )
}
