"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { IconAlertTriangle } from "@tabler/icons-react"
import { toast } from "sonner"

import { BackButton } from "@/components/back-button"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes"
import type { ResourceRecord, ResourceSchema } from "@/lib/domain/resource"

type ResourceFormProps = {
  resource: ResourceSchema
  record?: ResourceRecord
  defaults?: Record<string, string>
  mode: "view" | "edit" | "new"
}

function fieldValue(event: unknown) {
  if (typeof event === "string") {
    return event
  }

  if (event && typeof event === "object" && "target" in event) {
    return String((event as { target: { value: string } }).target.value ?? "")
  }

  return ""
}

export function ResourceForm({
  resource,
  record,
  defaults,
  mode,
}: ResourceFormProps) {
  const router = useRouter()
  const readOnly = mode === "view"
  const listHref = `/${resource.slug}`
  const [values, setValues] = useState<Record<string, string>>(() => {
    if (record) {
      return { ...record }
    }

    return Object.fromEntries(
      resource.fields.map((field) => [field.name, defaults?.[field.name] ?? ""])
    )
  })
  // Snapshot the values the form opened with. useState (not useRef) so the
  // dirty check can read it during render.
  const [initialValues] = useState(() => JSON.stringify(values))
  const dirty = useMemo(
    () => !readOnly && JSON.stringify(values) !== initialValues,
    [initialValues, readOnly, values]
  )
  const { open, setOpen, requestLeave, confirmLeave, cancelLeave } =
    useUnsavedChangesGuard(dirty)

  function update(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  function goBack() {
    requestLeave(() => router.push(listHref))
  }

  function onSubmit() {
    toast.success(
      mode === "new"
        ? `${resource.singular} ditambah.`
        : `${resource.singular} disimpan.`
    )
    router.push(listHref)
  }

  const title =
    mode === "new"
      ? `Tambah ${resource.singular.toLowerCase()}`
      : mode === "edit"
        ? `Sunting ${record?.name ?? resource.singular.toLowerCase()}`
        : (record?.name ?? resource.singular)

  return (
    <div className="flex w-full flex-col gap-4">
      <BackButton
        href={readOnly ? listHref : undefined}
        onPress={readOnly ? undefined : goBack}
      />

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            id="resource-form"
            onSubmit={(event) => {
              event.preventDefault()
              onSubmit()
            }}
          >
            <FieldGroup>
              {resource.fields.map((field) => (
                <Field key={field.name}>
                  <FieldLabel htmlFor={field.name}>{field.label}</FieldLabel>
                  {field.type === "textarea" ? (
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={values[field.name] ?? ""}
                      onChange={(event) =>
                        update(field.name, fieldValue(event))
                      }
                      disabled={readOnly}
                      className="min-h-28"
                    />
                  ) : field.type === "select" ? (
                    <Select
                      className="w-full"
                      selectedKey={values[field.name] || null}
                      onSelectionChange={(key) =>
                        update(field.name, String(key ?? ""))
                      }
                      isDisabled={readOnly}
                      placeholder="Pilih"
                    >
                      <SelectTrigger size="xl" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(field.options ?? []).map((option) => (
                          <SelectItem key={option.value} id={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={field.name}
                      name={field.name}
                      type={
                        field.type === "date" || field.type === "time"
                          ? field.type
                          : "text"
                      }
                      value={values[field.name] ?? ""}
                      onChange={(event) =>
                        update(field.name, fieldValue(event))
                      }
                      disabled={readOnly}
                      size="xl"
                      className="bg-background"
                    />
                  )}
                </Field>
              ))}
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <BackButton
            appearance="action"
            href={readOnly ? listHref : undefined}
            onPress={readOnly ? undefined : goBack}
          />
          {mode === "view" && record ? (
            <Button
              onPress={() => router.push(`/${resource.slug}/${record.id}/edit`)}
            >
              Sunting
            </Button>
          ) : (
            <Button type="submit" form="resource-form">
              {mode === "new" ? "Cipta" : "Simpan"}
            </Button>
          )}
        </CardFooter>
      </Card>

      <ConfirmDialog
        isOpen={open}
        onOpenChange={(nextOpen) => {
          if (nextOpen) {
            setOpen(true)
            return
          }
          cancelLeave()
        }}
        title="Buang perubahan?"
        description="Anda sudah mula sunting. Jika keluar sekarang, perubahan ini tidak disimpan."
        confirmLabel="Keluar"
        cancelLabel="Teruskan sunting"
        variant="destructive"
        icon={<IconAlertTriangle />}
        onConfirm={confirmLeave}
      />
    </div>
  )
}
