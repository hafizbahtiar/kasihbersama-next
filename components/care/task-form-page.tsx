"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CareFormShell } from "@/components/care/care-form-shell"
import { SelectProfileEmpty } from "@/components/care/select-profile-empty"
import { useCareData } from "@/components/care/care-data-provider"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { DateTimePicker } from "@/components/ui/date-picker"
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
import type { TaskStatus } from "@/lib/domain/care"

export function TaskFormPage() {
  const router = useRouter()
  const { snapshot, selectedProfile, addTask } = useCareData()
  const members = snapshot.members.filter(
    (item) => item.profileId === selectedProfile?.id
  )
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueAt, setDueAt] = useState(() => toDateTimeLocalValue())
  const [assigneeId, setAssigneeId] = useState("")
  const dirty = Boolean(title || description || assigneeId)

  return (
    <CareFormShell
      title="Tugasan baharu"
      description="Apa perlu dibuat, bila, dan oleh siapa."
      backHref="/tasks"
      dirty={dirty}
      isDisabled={!selectedProfile}
      onSubmit={() => {
        if (!selectedProfile || !title.trim()) {
          return
        }
        const member = members.find((item) => item.userId === assigneeId)
        void addTask({
          profileId: selectedProfile.id,
          title: title.trim(),
          description: description.trim(),
          dueAt: new Date(dueAt).toISOString(),
          assignedToUserId: assigneeId || undefined,
          assignedToName: member?.displayName ?? "Penjaga",
          status: "open" as TaskStatus,
        }).then(() => router.push("/tasks"))
      }}
    >
      {!selectedProfile ? (
        <SelectProfileEmpty />
      ) : (
        <FieldGroup>
          <Field>
            <FieldLabel>Tajuk</FieldLabel>
            <Input
              size="xl"
              className="bg-background"
              value={title}
              onChange={(event) => setTitle(fieldValue(event))}
            />
          </Field>
          <Field>
            <FieldLabel>Huraian</FieldLabel>
            <Textarea
              className="min-h-24"
              value={description}
              onChange={(event) => setDescription(fieldValue(event))}
            />
          </Field>
          <Field>
            <FieldLabel>Masa akhir</FieldLabel>
            <DateTimePicker
              size="xl"
              value={dueAt}
              onChange={setDueAt}
              className="bg-background"
            />
          </Field>
          <Field>
            <FieldLabel>Tugaskan kepada</FieldLabel>
            <Select
              className="w-full"
              value={assigneeId || null}
              onChange={(key) => setAssigneeId(String(key ?? ""))}
              placeholder="Pilih ahli"
            >
              <SelectTrigger size="xl" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.id} id={member.userId}>
                    {member.displayName}
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
