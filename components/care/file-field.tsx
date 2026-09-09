"use client"

import { useRef, useState } from "react"
import { IconFileText, IconPhoto, IconUpload, IconX } from "@tabler/icons-react"

import {
  Attachment,
  AttachmentActions,
  AttachmentAction,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment"
import { cn } from "@/lib/utils"

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * The file picker for care documents.
 *
 * Built on the project's own `ui/attachment` rather than a styled
 * `<input type="file">`. The native control shows a browser-chrome button and
 * a filename that truncates from the wrong end, and it cannot show what the
 * app actually knows about the file - its size against the quota, its type,
 * whether the upload is still running.
 *
 * The native input stays, hidden: it is the only thing that can open a file
 * dialog. Everything visible is the shadcn component over it.
 */
export function FileField({
  value,
  onChange,
  accept,
  hint,
  isInvalid,
  state = "idle",
}: {
  value: File | null
  onChange: (file: File | null) => void
  accept?: string
  hint?: string
  isInvalid?: boolean
  /** Mirrors the upload lifecycle so the tile can shimmer while it runs. */
  state?: "idle" | "uploading" | "processing" | "error" | "done"
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  function pick(file: File | null) {
    onChange(file)
  }

  if (value) {
    const isImage = value.type.startsWith("image/")
    return (
      <>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(event) => pick(event.target.files?.[0] ?? null)}
        />
        <Attachment state={isInvalid ? "error" : state}>
          <AttachmentMedia>
            {isImage ? <IconPhoto /> : <IconFileText />}
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{value.name}</AttachmentTitle>
            <AttachmentDescription>
              {formatBytes(value.size)}
              {hint ? ` · ${hint}` : ""}
            </AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction
              aria-label="Buang fail"
              onPress={() => {
                pick(null)
                // Cleared explicitly: a file input keeps its previous value,
                // so re-picking the same file after removing it would fire no
                // change event and look broken.
                if (inputRef.current) {
                  inputRef.current.value = ""
                }
              }}
            >
              <IconX />
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
      </>
    )
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => pick(event.target.files?.[0] ?? null)}
      />
      {/*
        A button, not a div with a click handler: choosing a file has to work
        from the keyboard, and this is the control the FieldLabel points at.
      */}
      <button
        type="button"
        data-invalid={isInvalid || undefined}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          const dropped = event.dataTransfer.files?.[0]
          if (dropped) {
            pick(dropped)
          }
        }}
        className={cn(
          "flex w-full flex-col items-center gap-1.5 rounded-lg border border-dashed border-input bg-background px-4 py-6 text-sm transition-colors outline-none",
          "hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          isDragging && "border-ring bg-muted/50",
          isInvalid && "border-destructive"
        )}
      >
        <IconUpload className="size-5 text-muted-foreground" />
        <span className="font-medium">Pilih fail atau seret ke sini</span>
        {hint ? (
          <span className="text-xs text-muted-foreground">{hint}</span>
        ) : null}
      </button>
    </>
  )
}
