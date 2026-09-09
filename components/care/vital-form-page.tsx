"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { CareFormShell } from "@/components/care/care-form-shell"
import { useCareData } from "@/components/care/care-data-provider"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toDateTimeLocalValue } from "@/lib/application/care-format"
import { fieldValue } from "@/lib/application/form-value"
import {
  parseDateTimeLocal,
  parsePositiveNumber,
  required,
} from "@/lib/application/form-validation"
import { VITAL_TYPE_OPTIONS } from "@/lib/domain/care"

export function VitalFormPage() {
  const router = useRouter()
  const { selectedProfile, addVital } = useCareData()
  const [readingType, setReadingType] = useState("blood_pressure")
  const [valueNumeric, setValueNumeric] = useState("")
  const [valueText, setValueText] = useState("")
  const [unit, setUnit] = useState("mmHg")
  const [systolic, setSystolic] = useState("")
  const [diastolic, setDiastolic] = useState("")
  const [measuredAt, setMeasuredAt] = useState(() => toDateTimeLocalValue())
  const [note, setNote] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const dirty = Boolean(
    valueNumeric || valueText || systolic || diastolic || note
  )

  return (
    <CareFormShell
      title="Bacaan vital baharu"
      backHref="/vitals"
      dirty={dirty}
      isDisabled={!selectedProfile}
      submitLabel="Simpan bacaan"
      onSubmit={() => {
        if (!selectedProfile) {
          return
        }

        const nextErrors: Record<string, string> = {}
        const measuredIso = parseDateTimeLocal(measuredAt)
        if (!measuredIso) {
          nextErrors.measuredAt = "Masa diukur tidak sah."
        }

        let systolicValue: number | undefined
        let diastolicValue: number | undefined
        let numericValue: number | undefined

        if (readingType === "blood_pressure") {
          const sys = parsePositiveNumber(systolic, "Sistolik")
          const dia = parsePositiveNumber(diastolic, "Diastolik")
          if ("error" in sys) {
            nextErrors.systolic = sys.error
          } else {
            systolicValue = sys.value
          }
          if ("error" in dia) {
            nextErrors.diastolic = dia.error
          } else {
            diastolicValue = dia.value
          }
        } else if (!valueNumeric.trim() && !valueText.trim()) {
          nextErrors.valueNumeric = "Nilai nombor atau teks diperlukan."
        } else if (valueNumeric.trim()) {
          const parsed = parsePositiveNumber(valueNumeric, "Nilai")
          if ("error" in parsed) {
            nextErrors.valueNumeric = parsed.error
          } else {
            numericValue = parsed.value
          }
        }

        setErrors(nextErrors)
        if (Object.keys(nextErrors).length > 0 || !measuredIso) {
          toast.error("Sila betulkan medan yang ditandakan.")
          return
        }

        void addVital({
          profileId: selectedProfile.id,
          readingType,
          unit,
          measuredAt: measuredIso,
          note: note || undefined,
          valueNumeric: numericValue,
          valueText: valueText || undefined,
          systolic: systolicValue,
          diastolic: diastolicValue,
        })
          .then(() => {
            toast.success("Bacaan ditambah.")
            router.push("/vitals")
          })
          .catch(() => undefined)
      }}
    >
      {!selectedProfile ? (
        <p className="text-sm text-muted-foreground">
          Pilih profil jagaan di header dahulu.
        </p>
      ) : (
        <FieldGroup>
          <Field>
            <FieldLabel>Jenis</FieldLabel>
            <Select
              className="w-full"
              selectedKey={readingType}
              onSelectionChange={(key) => {
                const next = String(key)
                setReadingType(next)
                setUnit(
                  next === "blood_pressure"
                    ? "mmHg"
                    : next === "blood_glucose"
                      ? "mmol/L"
                      : next === "pulse"
                        ? "bpm"
                        : next === "weight"
                          ? "kg"
                          : next === "temperature"
                            ? "°C"
                            : "%"
                )
              }}
            >
              <SelectTrigger className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VITAL_TYPE_OPTIONS.map((item) => (
                  <SelectItem key={item.value} id={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {readingType === "blood_pressure" ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field data-invalid={Boolean(errors.systolic)}>
                <FieldLabel>Sistolik</FieldLabel>
                <Input
                  className="h-11 bg-background"
                  inputMode="decimal"
                  value={systolic}
                  onChange={(event) => setSystolic(fieldValue(event))}
                />
                {errors.systolic ? <FieldError>{errors.systolic}</FieldError> : null}
              </Field>
              <Field data-invalid={Boolean(errors.diastolic)}>
                <FieldLabel>Diastolik</FieldLabel>
                <Input
                  className="h-11 bg-background"
                  inputMode="decimal"
                  value={diastolic}
                  onChange={(event) => setDiastolic(fieldValue(event))}
                />
                {errors.diastolic ? <FieldError>{errors.diastolic}</FieldError> : null}
              </Field>
            </div>
          ) : (
            <>
              <Field data-invalid={Boolean(errors.valueNumeric)}>
                <FieldLabel>Nilai nombor</FieldLabel>
                <Input
                  className="h-11 bg-background"
                  inputMode="decimal"
                  value={valueNumeric}
                  onChange={(event) => setValueNumeric(fieldValue(event))}
                />
                {errors.valueNumeric ? (
                  <FieldError>{errors.valueNumeric}</FieldError>
                ) : null}
              </Field>
              <Field>
                <FieldLabel>Nilai teks</FieldLabel>
                <Input
                  className="h-11 bg-background"
                  value={valueText}
                  onChange={(event) => setValueText(fieldValue(event))}
                />
              </Field>
            </>
          )}
          <Field>
            <FieldLabel>Unit</FieldLabel>
            <Input
              className="h-11 bg-background"
              value={unit}
              readOnly
            />
          </Field>
          <Field data-invalid={Boolean(errors.measuredAt)}>
            <FieldLabel>Masa diukur</FieldLabel>
            <Input
              type="datetime-local"
              className="h-11 bg-background"
              value={measuredAt}
              onChange={(event) => setMeasuredAt(fieldValue(event))}
            />
            {errors.measuredAt ? <FieldError>{errors.measuredAt}</FieldError> : null}
          </Field>
          <Field>
            <FieldLabel>Nota</FieldLabel>
            <Textarea
              className="min-h-20"
              value={note}
              onChange={(event) => setNote(fieldValue(event))}
            />
          </Field>
        </FieldGroup>
      )}
    </CareFormShell>
  )
}
