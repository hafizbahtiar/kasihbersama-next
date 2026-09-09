"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  IconAlertTriangle,
  IconDroplet,
  IconNfc,
  IconRotate,
} from "@tabler/icons-react"

import { AsyncStateBanner } from "@/components/care/async-state"
import { LogoMark } from "@/components/brand/logo-mark"
import { Button, LinkButton } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getCareRepository } from "@/lib/composition/care-repository"
import { formatDate } from "@/lib/application/care-format"
import type { EmergencyCard } from "@/lib/domain/care"
import { ApiError, normalizeApiError } from "@/lib/infrastructure/api/errors"
import { cn } from "@/lib/utils"

/** How far the card leans toward the pointer, in degrees. */
const MAX_TILT = 9

/**
 * Everything a card can carry beyond the name. If none of it is set there is
 * nothing to show, and a card reading "Tiada direkodkan" five times is worse
 * than one that admits it is empty.
 */
function isBlank(card: EmergencyCard) {
  return ![
    card.bloodType,
    card.allergySummary,
    card.conditionSummary,
    card.dateOfBirth,
    card.legalName,
    card.gender,
    card.primaryClinic,
    card.primaryDoctor,
    card.emergencyNote,
  ].some((value) => value && value.trim())
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-[0.6rem] leading-none font-medium tracking-[0.14em] text-muted-foreground uppercase">
      {children}
    </span>
  )
}

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
    <div className={cn("min-w-0 space-y-1", className)}>
      <Label>{label}</Label>
      {/* truncate on the card face, wrap in print: the card is a fixed
          rectangle, the paper is not. */}
      <p className="truncate text-[0.8rem] leading-snug print:overflow-visible print:whitespace-normal">
        {value}
      </p>
    </div>
  )
}

/**
 * The face shared by both sides: the ratio, the surface, the brand chip.
 *
 * A card is a physical object people already know, so it borrows that
 * vocabulary - 85.6 x 54 mm, the issuer mark in a corner, a quiet ground. The
 * one loud thing on it is the allergy block, because that is the field that
 * changes what a clinician does in the next minute; everything else stays
 * deliberately flat so the red is the only thing that shouts.
 */
function Face({
  children,
  className,
  style,
}: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      style={style}
      className={cn(
        "absolute inset-0 overflow-hidden rounded-2xl bg-card p-4 shadow-xl ring-1 ring-foreground/10",
        // A single soft light source from the top-left, so the card reads as a
        // surface rather than a coloured rectangle.
        "before:pointer-events-none before:absolute before:-top-16 before:-left-10 before:size-48 before:rounded-full before:bg-primary/10 before:blur-2xl",
        className
      )}
    >
      {children}
    </div>
  )
}

/** The issuer mark, in the pale chip the raster logo needs to read. */
function BrandChip({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-md bg-white p-1 ring-1 ring-foreground/10",
        className
      )}
    >
      <LogoMark className="size-full" decorative />
    </span>
  )
}

/**
 * The emergency card as a physical object.
 *
 * Takes `profileId` explicitly rather than reading the selected care profile:
 * `selectedProfileId` silently falls back to the default profile when the id
 * is not in the loaded snapshot, so a preview of one person's card has to name
 * that person.
 *
 * The 3D is CSS transforms, not three.js. A card is two flat faces and one
 * rotation - a WebGL context, a scene graph and a render loop would be a large
 * amount of machinery to draw a rectangle, and it would cost the text its
 * selectability and its screen-reader access. The tilt and the sheen track the
 * pointer directly and are deliberately *not* eased: an eased tilt lags behind
 * the finger and feels broken. Only the flip is timed.
 */
export function EmergencyCardView({
  profileId,
  completeHref,
  className,
}: {
  profileId: string
  /** Where "fill this in" leads, when the card is empty and the viewer can. */
  completeHref?: string
  className?: string
}) {
  const [card, setCard] = useState<EmergencyCard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<ApiError | null>(null)
  const [flipped, setFlipped] = useState(false)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [sheen, setSheen] = useState({ x: 50, y: 0, on: false })
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
    const px = (event.clientX - box.left) / box.width
    const py = (event.clientY - box.top) / box.height
    setTilt({ x: -(py - 0.5) * MAX_TILT * 2, y: (px - 0.5) * MAX_TILT * 2 })
    setSheen({ x: px * 100, y: py * 100, on: true })
  }

  function resetPointer() {
    setTilt({ x: 0, y: 0 })
    setSheen((current) => ({ ...current, on: false }))
  }

  if (isLoading) {
    return (
      <Skeleton
        className={cn("aspect-[1.586/1] w-full max-w-[26rem]", className)}
      />
    )
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

  const blank = isBlank(card)

  return (
    <div className={cn("w-full max-w-[26rem] space-y-3", className)}>
      <div
        ref={frameRef}
        data-print-hide
        className="relative"
        style={{ perspective: "1100px" }}
        onPointerMove={handlePointer}
        onPointerLeave={resetPointer}
      >
        <div
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y + (flipped ? 180 : 0)}deg)`,
          }}
          className="relative aspect-[1.586/1] w-full transition-transform duration-500 ease-out motion-reduce:transition-none"
        >
          {/* Front */}
          <Face style={{ backfaceVisibility: "hidden" }}>
            <div className="flex h-full flex-col justify-between">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Label>Kad kecemasan</Label>
                  <p className="mt-1 truncate font-heading text-lg leading-tight tracking-tight">
                    {card.displayName}
                  </p>
                </div>
                {card.bloodType ? (
                  <span className="flex shrink-0 items-center gap-1 rounded-lg bg-destructive px-2 py-1 text-sm font-semibold text-white">
                    <IconDroplet className="size-3.5" />
                    {card.bloodType}
                  </span>
                ) : null}
              </div>

              {blank ? (
                <p className="text-sm text-muted-foreground">
                  Maklumat kesihatan belum diisi.
                </p>
              ) : (
                <div className="rounded-lg bg-destructive/10 px-3 py-2 ring-1 ring-destructive/25">
                  <Label>Alahan</Label>
                  <p className="mt-1 line-clamp-2 text-sm leading-snug font-medium">
                    {card.allergySummary || "Tiada direkodkan"}
                  </p>
                </div>
              )}

              <div className="flex items-end justify-between gap-3">
                <div className="grid min-w-0 flex-1 grid-cols-2 gap-3">
                  <Field
                    label="Lahir"
                    value={
                      card.dateOfBirth
                        ? formatDate(card.dateOfBirth)
                        : undefined
                    }
                  />
                  <Field label="Nama penuh" value={card.legalName} />
                </div>
                <BrandChip />
              </div>
            </div>
          </Face>

          {/* Back */}
          <Face
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div className="flex h-full flex-col justify-between">
              {blank ? (
                <p className="text-sm text-muted-foreground">
                  Tiada keadaan kesihatan, klinik atau nota direkodkan.
                </p>
              ) : (
                <div className="min-h-0 space-y-2.5 overflow-hidden">
                  <Field
                    label="Keadaan kesihatan"
                    value={card.conditionSummary}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Klinik" value={card.primaryClinic} />
                    <Field label="Doktor" value={card.primaryDoctor} />
                  </div>
                  <Field label="Nota" value={card.emergencyNote} />
                </div>
              )}

              {/*
                Reserved, not pretending. A physical card with an NFC tag would
                carry a link straight to this profile - the slot is drawn now
                so the layout does not change when the tag exists, and it says
                it is unprovisioned rather than showing a fake code.
              */}
              <div className="flex items-end justify-between gap-3 border-t pt-2.5">
                <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
                  <IconNfc className="size-4 shrink-0" />
                  <span className="truncate text-[0.6rem] leading-tight">
                    Kad NFC fizikal belum tersedia
                  </span>
                </span>
                <BrandChip />
              </div>
            </div>
          </Face>
        </div>

        {/*
          The sheen is outside the rotating element on purpose. Inside it, the
          highlight rotates with the card and ends up behind the back face when
          flipped - light does not get printed on one side. Here it stays on
          the rectangle facing the viewer, which is where a reflection lives.
        */}
        <div
          aria-hidden
          style={{
            background: `radial-gradient(30rem circle at ${sheen.x}% ${sheen.y}%, color-mix(in oklab, white 20%, transparent), transparent 45%)`,
            opacity: sheen.on ? 1 : 0,
          }}
          className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300 motion-reduce:hidden"
        />
      </div>

      {/* Flat, complete, print-only. */}
      <div className="hidden space-y-3 print:block">
        <div>
          <Label>Kad kecemasan</Label>
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

      <div data-print-hide className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onPress={() => setFlipped((current) => !current)}
        >
          <IconRotate />
          {flipped ? "Lihat depan" : "Lihat belakang"}
        </Button>

        {blank && completeHref ? (
          <LinkButton size="sm" href={completeHref}>
            Isi maklumat
          </LinkButton>
        ) : null}

        <p className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <IconAlertTriangle className="size-3.5" />
          Bacaan direkodkan
        </p>
      </div>
    </div>
  )
}
