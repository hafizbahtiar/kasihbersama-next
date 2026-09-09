"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/components/auth/auth-provider"
import { CareFormShell } from "@/components/care/care-form-shell"
import { useCareData } from "@/components/care/care-data-provider"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
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
  LOG_TYPE_OPTIONS,
  VISIBILITY_LABELS,
  type LogVisibility,
} from "@/lib/domain/care"

export function CareLogFormPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { selectedProfile, addCareLog } = useCareData()
  const [logType, setLogType] = useState("note")
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [visibility, setVisibility] = useState<LogVisibility>("circle")
  const [occurredAt, setOccurredAt] = useState(() => toDateTimeLocalValue())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const dirty = Boolean(title || body)

  return (
    <CareFormShell
      title="Log jagaan baharu"
      backHref="/care-logs"
      dirty={dirty}
      isDisabled={!selectedProfile || isSubmitting}
      onSubmit={() => {
        if (!selectedProfile || !title.trim()) {
          return
        }
        setIsSubmitting(true)
        void addCareLog({
          profileId: selectedProfile.id,
          logType,
          title: title.trim(),
          body: body.trim(),
          visibility,
          occurredAt: new Date(occurredAt).toISOString(),
          createdBy: user?.displayName ?? "Penjaga",
        })
          .then(() => router.push("/care-logs"))
          .finally(() => setIsSubmitting(false))
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
              selectedKey={logType}
              onSelectionChange={(key) => setLogType(String(key))}
            >
              <SelectTrigger className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOG_TYPE_OPTIONS.map((item) => (
                  <SelectItem key={item.value} id={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Tajuk</FieldLabel>
            <Input
              className="h-11 bg-background"
              value={title}
              onChange={(event) => setTitle(fieldValue(event))}
            />
          </Field>
          <Field>
            <FieldLabel>Catatan</FieldLabel>
            <Textarea
              className="min-h-28"
              value={body}
              onChange={(event) => setBody(fieldValue(event))}
            />
          </Field>
          <Field>
            <FieldLabel>Masa kejadian</FieldLabel>
            <Input
              type="datetime-local"
              className="h-11 bg-background"
              value={occurredAt}
              onChange={(event) => setOccurredAt(fieldValue(event))}
            />
          </Field>
          <Field>
            <FieldLabel>Keterlihatan</FieldLabel>
            <Select
              className="w-full"
              selectedKey={visibility}
              onSelectionChange={(key) =>
                setVisibility(String(key) as LogVisibility)
              }
            >
              <SelectTrigger className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(VISIBILITY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} id={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
      )}
    </CareFormShell>
  )
}
