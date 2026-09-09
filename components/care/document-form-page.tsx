"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { EmailVerifiedGate } from "@/components/auth/email-verified-gate"
import { CareFormShell } from "@/components/care/care-form-shell"
import { FileField } from "@/components/care/file-field"
import { SelectProfileEmpty } from "@/components/care/select-profile-empty"
import { useCareData } from "@/components/care/care-data-provider"
import { usePlatform } from "@/components/platform/platform-provider"
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
import {
  required,
  validateDateRange,
  validateUploadSize,
} from "@/lib/application/form-validation"
import { isMockDataEnabled } from "@/lib/infrastructure/config"
import { DOCUMENT_TYPE_LABELS, type DocumentType } from "@/lib/domain/care"
import { isApiError, messageForApiError } from "@/lib/infrastructure/api/errors"

const allowedTypes = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]

export function DocumentFormPage() {
  const router = useRouter()
  const apiMode = !isMockDataEnabled()
  const { accountLimits } = usePlatform()
  const { selectedProfile, uploadDocument, addDocument, updateDocument } =
    useCareData()
  const [title, setTitle] = useState("")
  const [documentType, setDocumentType] = useState<DocumentType>("lab_result")
  const [issueDate, setIssueDate] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [notes, setNotes] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const dirty = Boolean(title || notes || file || issueDate || expiryDate)

  return (
    <EmailVerifiedGate>
      <CareFormShell
        title="Muat naik dokumen"
        description="Muat naik fail penting. PDF atau gambar."
        backHref="/documents"
        dirty={dirty}
        submitLabel="Muat naik"
        isDisabled={!selectedProfile}
        onSubmit={() => {
          if (!selectedProfile || !file) {
            return
          }

          const nextErrors: Record<string, string> = {}
          const titleError = required(title, "Tajuk")
          if (titleError) {
            nextErrors.title = titleError
          }
          if (!allowedTypes.includes(file.type)) {
            nextErrors.file = "Jenis fail tidak dibenarkan. Guna PDF atau imej."
          }
          const sizeError = validateUploadSize(file.size, accountLimits.maxUploadMb)
          if (sizeError) {
            nextErrors.file = sizeError
          }
          const rangeError = validateDateRange(issueDate, expiryDate)
          if (rangeError) {
            nextErrors.expiryDate = rangeError
          }
          setErrors(nextErrors)
          if (Object.keys(nextErrors).length > 0) {
            toast.error("Sila betulkan medan yang ditandakan.")
            return
          }

          const payload = {
            file,
            title: title.trim(),
            documentType,
            issueDate: issueDate || undefined,
            expiryDate: expiryDate || undefined,
            notes: notes || undefined,
          }

          if (apiMode) {
            void uploadDocument(payload)
              .then(() => router.push("/documents"))
              .catch((error) => {
                toast.error(
                  isApiError(error)
                    ? messageForApiError(error)
                    : "Muat naik gagal."
                )
              })
            return
          }

          void addDocument({
            profileId: selectedProfile.id,
            title: title.trim(),
            documentType,
            filename: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
            issueDate: issueDate || undefined,
            expiryDate: expiryDate || undefined,
            notes: notes || undefined,
            createdAt: new Date().toISOString(),
            uploadState: "uploading",
            uploadProgress: 12,
          }).then((created) => {
            let progress = 12
            const timer = window.setInterval(() => {
              progress += 22
              if (progress >= 100) {
                window.clearInterval(timer)
                void updateDocument(created.id, {
                  uploadState: "processing",
                  uploadProgress: 100,
                })
                window.setTimeout(() => {
                  void updateDocument(created.id, { uploadState: "done" })
                }, 600)
                return
              }
              void updateDocument(created.id, { uploadProgress: progress })
            }, 280)
            router.push("/documents")
          })
        }}
      >
        {!selectedProfile ? (
          <SelectProfileEmpty />
        ) : (
          <FieldGroup>
            <Field data-invalid={Boolean(errors.title)}>
              <FieldLabel>Tajuk</FieldLabel>
              <Input
                size="xl"
                className="bg-background"
                value={title}
                onChange={(event) => setTitle(fieldValue(event))}
              />
              {errors.title ? <FieldError>{errors.title}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel>Jenis</FieldLabel>
              <Select
                className="w-full"
                value={documentType}
                onChange={(key) => setDocumentType(String(key) as DocumentType)}
              >
                <SelectTrigger size="xl" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DOCUMENT_TYPE_LABELS).map(
                    ([value, label]) => (
                      <SelectItem key={value} id={value}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </Field>
            <Field data-invalid={Boolean(errors.file)}>
              <FieldLabel>Fail</FieldLabel>
              <FileField
                value={file}
                onChange={setFile}
                accept=".pdf,image/jpeg,image/png,image/webp"
                hint={`PDF atau imej, maksimum ${accountLimits.maxUploadMb} MB`}
                isInvalid={Boolean(errors.file)}
              />
              {errors.file ? <FieldError>{errors.file}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel>Tarikh dikeluarkan</FieldLabel>
              <DatePicker
                size="xl"
                value={issueDate}
                onChange={setIssueDate}
                className="bg-background"
              />
            </Field>
            <Field data-invalid={Boolean(errors.expiryDate)}>
              <FieldLabel>Tarikh tamat</FieldLabel>
              <DatePicker
                size="xl"
                value={expiryDate}
                onChange={setExpiryDate}
                className="bg-background"
              />
              {errors.expiryDate ? (
                <FieldError>{errors.expiryDate}</FieldError>
              ) : null}
            </Field>
            <Field>
              <FieldLabel>Nota</FieldLabel>
              <Textarea
                className="min-h-20"
                value={notes}
                onChange={(event) => setNotes(fieldValue(event))}
              />
            </Field>
          </FieldGroup>
        )}
      </CareFormShell>
    </EmailVerifiedGate>
  )
}
