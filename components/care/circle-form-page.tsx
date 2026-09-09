"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { CareFormShell } from "@/components/care/care-form-shell"
import { useCareData } from "@/components/care/care-data-provider"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { fieldValue } from "@/lib/application/form-value"

export function CircleFormPage() {
  const router = useRouter()
  const { createCircle } = useCareData()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const dirty = Boolean(name || description)

  return (
    <CareFormShell
      title="Kumpulan baharu"
      description="Kumpulan untuk beberapa profil jagaan."
      backHref="/circles"
      dirty={dirty}
      onSubmit={() => {
        if (!name.trim()) {
          return
        }
        void createCircle({
          name: name.trim(),
          description: description.trim(),
        }).then((created) => {
          router.push(`/circles/${created.id}`)
        })
      }}
    >
      <FieldGroup>
        <Field>
          <FieldLabel>Nama</FieldLabel>
          <Input
            className="h-11 bg-background"
            value={name}
            onChange={(event) => setName(fieldValue(event))}
          />
        </Field>
        <Field>
          <FieldLabel>Keterangan</FieldLabel>
          <Textarea
            className="min-h-24"
            value={description}
            onChange={(event) => setDescription(fieldValue(event))}
          />
        </Field>
      </FieldGroup>
    </CareFormShell>
  )
}
