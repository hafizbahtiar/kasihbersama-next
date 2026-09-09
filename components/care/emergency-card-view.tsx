"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  IconAlertTriangle,
  IconDroplet,
  IconNfc,
  IconRotate,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AsyncStateBanner } from "@/components/care/async-state"
import { getCareRepository } from "@/lib/composition/care-repository"
import { formatDate } from "@/lib/application/care-format"
import type { EmergencyCard } from "@/lib/domain/care"
import { ApiError, normalizeApiError } from "@/lib/infrastructure/api/errors"
import { cn } from "@/lib/utils"

/** How far the card leans toward the pointer, in degrees. */
const MAX_TILT = 10

function Field({
  label,
  value,
  className,
}: {
  label: string
  value?: string
  className?: string
}) {
  if (!value) {
    return null
  }
  return (
    <div className={cn("min-w-0 space-y-0.5", className)}>
      <p className="text-[0.65rem] tracking-widest text-muted-foreground uppercase">
        {label}
      </p>
      {/* truncate on the card face, wrap in print: the card is a fixed
          rectangle, the paper is not. */}
      <p className="truncate text-sm print:overflow-visible print:whitespace-normal">
        {value}
      </p>
    </div>
  )
}

/**
 * The emergency card as a physical object.
 *
 * It takes `profileId` explicitly rather than reading the selected care
 * profile, and that is the fix for a real bug: `selectedProfileId` silently
 * falls back to the default profile when the id is not in the loaded snapshot,
 * so "preview my own card" from /my-health showed whichever relative happened
 * to be selected. A preview of a specific person's card must name that person.
 *
 * The 3D is CSS transforms, not three.js. A card is two flat faces and one
 * rotation - a WebGL context, a scene graph and a render loop would be a large
 * amount of machinery to draw a rectangle, and it would cost the text its
 * selectability and its screen-reader access. The tilt tracks the pointer
 * directly and is deliberately *not* animated: an eased tilt lags behind the
 * finger and feels broken. Only the flip is timed.
 */
export function EmergencyCardView({
  profileId,
  className,
}: {
  profileId: string
  className?: string
}) {
  const [card, setCard] = useState<EmergencyCard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [flipped, setFlipped] = useState(false)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const frameRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setCard(await getCareRepository().getEmergencyCard(profileId))
    } catch (cause) {
      setError(normalizeApiError(cause))
      setCard(null)
    } finally {
      setIsLoading(false)
    }
  }, [profileId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  function handlePointer(event: React.PointerEvent<HTMLDivElement>) {
    const box = frameRef.current?.getBoundingClientRect()
    if (!box) {
      return
    }
    const px = (event.clientX - box.left) / box.width - 0.5
    const py = (event.clientY - box.top) / box.height - 0.5
    setTilt({ x: -py * MAX_TILT * 2, y: px * MAX_TILT * 2 })
  }

  if (isLoading) {
    return <Skeleton className={cn("h-64 w-full max-w-md", className)} />
  }

  if (error || !card) {
    return (
      <AsyncStateBanner
        error={error}
        onRetry={() => {
          void load()
        }}
        label="Gagal memuatkan kad kecemasan."
      />
    )
  }

  return (
    <div className={cn("w-full max-w-md space-y-3", className)}>
      {/*
        The 3D card is a screen object. Printing it would put one face on the
        paper with the allergy line clamped to two lines and the whole back -
        conditions, clinic, emergency note - missing. Someone printing this is
        making the copy that goes in a handbag, so print gets its own flat
        rendering below and the card itself is hidden.
      */}
      <div
        ref={frameRef}
        data-print-hide
        style={{ perspective: "1200px" }}
        onPointerMove={handlePointer}
        onPointerLeave={() => setTilt({ x: 0, y: 0 })}
      >
        <div
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y + (flipped ? 180 : 0)}deg)`,
          }}
          className={cn(
            "relative aspect-[1.586/1] w-full transition-transform duration-500 ease-out",
            // The tilt must not be eased or it trails the pointer; only the
            // flip is timed, and reduced motion drops both.
            "motion-reduce:transition-none"
          )}
        >
          {/* Front: the two facts that change what a clinician does next. */}
          <div
            style={{ backfaceVisibility: "hidden" }}
            className="absolute inset-0 flex flex-col justify-between rounded-2xl bg-card p-5 shadow-lg ring-1 ring-foreground/10"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[0.65rem] tracking-widest text-muted-foreground uppercase">
                  Kad kecemasan
                </p>
                <p className="truncate font-heading text-xl tracking-tight">
                  {card.displayName}
                </p>
              </div>
              {card.bloodType ? (
                <Badge variant="destructive" className="shrink-0 text-sm">
                  <IconDroplet />
                  {card.bloodType}
                </Badge>
              ) : null}
            </div>

            <div className="rounded-lg bg-destructive/10 p-3 ring-1 ring-destructive/25">
              <p className="text-[0.65rem] tracking-widest text-destructive uppercase">
                Alahan
              </p>
              <p className="mt-0.5 line-clamp-2 text-sm font-medium">
                {card.allergySummary || "Tiada direkodkan"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Tarikh lahir"
                value={
                  card.dateOfBirth ? formatDate(card.dateOfBirth) : undefined
                }
              />
              <Field label="Nama penuh" value={card.legalName} />
            </div>
          </div>

          {/* Back: the detail a responder reads once the immediate danger is
              handled, plus the slot the NFC/QR link will occupy. */}
          <div
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
            className="absolute inset-0 flex flex-col justify-between rounded-2xl bg-card p-5 shadow-lg ring-1 ring-foreground/10"
          >
            <div className="space-y-3">
              <Field label="Keadaan kesihatan" value={card.conditionSummary} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Klinik" value={card.primaryClinic} />
                <Field label="Doktor" value={card.primaryDoctor} />
              </div>
              <Field label="Nota" value={card.emergencyNote} />
            </div>

            {/*
              Reserved, not pretending. A physical card with an NFC tag would
              carry a link straight to this profile - the slot is drawn now so
              the layout does not have to change when the tag exists, and it
              says it is unprovisioned rather than showing a fake code.
            */}
            <div className="flex items-center gap-2 border-t pt-3 text-muted-foreground">
              <IconNfc className="size-5 shrink-0" />
              <p className="text-[0.65rem] leading-tight">
                Kad fizikal NFC belum tersedia. Ruang ini untuk pautan terus ke
                profil ini.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Flat, complete, print-only. */}
      <div className="hidden space-y-3 print:block">
        <div>
          <p className="text-xs tracking-widest text-muted-foreground uppercase">
            Kad kecemasan
          </p>
          <p className="font-heading text-2xl tracking-tight">
            {card.displayName}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Jenis darah" value={card.bloodType} />
          <Field
            label="Tarikh lahir"
            value={card.dateOfBirth ? formatDate(card.dateOfBirth) : undefined}
          />
          <Field label="Nama penuh" value={card.legalName} />
          <Field label="Jantina" value={card.gender} />
        </div>
        <Field
          label="Alahan"
          value={card.allergySummary || "Tiada direkodkan"}
        />
        <Field label="Keadaan kesihatan" value={card.conditionSummary} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Klinik utama" value={card.primaryClinic} />
          <Field label="Doktor utama" value={card.primaryDoctor} />
        </div>
        <Field label="Nota kecemasan" value={card.emergencyNote} />
      </div>

      <div data-print-hide className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onPress={() => setFlipped((current) => !current)}
        >
          <IconRotate />
          {flipped ? "Lihat depan" : "Lihat belakang"}
        </Button>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <IconAlertTriangle className="size-3.5" />
          Bacaan direkodkan
        </p>
      </div>
    </div>
  )
}
