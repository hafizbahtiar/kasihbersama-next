"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import {
  IconAlertTriangle,
  IconEyeQuestion,
  IconNfc,
  IconRotate,
} from "@tabler/icons-react"

import { AsyncStateBanner } from "@/components/care/async-state"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { LogoMark } from "@/components/brand/logo-mark"
import { Button, LinkButton } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getCareRepository } from "@/lib/composition/care-repository"
import { formatDate } from "@/lib/application/care-format"
import {
  bloodTypeLabel,
  genderLabel,
  SAMPLE_EMERGENCY_CARD,
  type EmergencyCard,
} from "@/lib/domain/care"
import { ApiError, normalizeApiError } from "@/lib/infrastructure/api/errors"
import { cn } from "@/lib/utils"

/** How far the card leans toward the pointer, in degrees. */
const MAX_TILT = 9

/**
 * Everything a card can carry beyond the name. If none of it is set there is
 * nothing to show, and a card reading "Tiada direkodkan" five times is worse
 * than one that admits it is empty.
 */
/** True when at least one field is missing, so the card shows a sample. */
function hasGaps(card: EmergencyCard) {
  return [
    card.bloodType,
    card.allergySummary,
    card.conditionSummary,
    card.dateOfBirth,
    card.legalName,
    card.primaryClinic,
    card.primaryDoctor,
    card.emergencyNote,
  ].some((value) => !value || !value.trim())
}

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
  sample,
  className,
}: {
  label: string
  value?: string
  /** Shown greyed when `value` is empty, so the field still has a shape. */
  sample?: string
  className?: string
}) {
  // A missing field used to render nothing at all, which left a half-filled
  // card looking broken rather than incomplete - a person could not tell an
  // empty field from a field this card does not have. Each empty slot now
  // shows its sample, dimmed, so the card keeps its shape and the grey says
  // which parts are not yours.
  const isSample = !value
  const shown = value || sample
  if (!shown) {
    return null
  }
  return (
    <div className={cn("min-w-0 space-y-1", className)}>
      <Label>{label}</Label>
      {/* truncate on the card face, wrap in print: the card is a fixed
          rectangle, the paper is not. */}
      <p
        className={cn(
          "truncate text-[0.8rem] leading-snug print:overflow-visible print:whitespace-normal",
          isSample && "text-muted-foreground/70 italic"
        )}
      >
        {shown}
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

/**
 * A card number, from the profile id.
 *
 * Grouped in fours because that is how a person reads a code aloud over a
 * phone, and shortened because the full UUID is neither memorable nor needed -
 * the app resolves the profile, the human only has to quote it.
 */
function cardNumber(profileId: string) {
  const compact = profileId.replace(/-/g, "").slice(0, 12).toUpperCase()
  return compact.replace(/(.{4})(?=.)/g, "$1 ")
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

  // Any missing field gets a dimmed sample, not just a wholly empty card.
  // A card with three real values and four gaps used to render the gaps as
  // nothing, which reads as broken; showing the sample keeps the card's shape
  // and the grey says which parts are not the person's own.
  const blank = isBlank(card)
  const incomplete = hasGaps(card)
  // Resolved in the browser so the code points at whatever host this is served
  // from - staging, production or a laptop - rather than a value baked in at
  // build time that would send a scan to the wrong environment.
  const cardUrl =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}/emergency-card?profile=${profileId}`
  const shown = card
  const sample = SAMPLE_EMERGENCY_CARD

  return (
    <div className={cn("w-full max-w-[26rem] space-y-3", className)}>
      {incomplete ? (
        <Alert data-print-hide>
          <IconEyeQuestion />
          <AlertTitle>
            {blank ? "Ini contoh sahaja" : "Sebahagian ialah contoh"}
          </AlertTitle>
          <AlertDescription>
            Teks kelabu condong ialah contoh, bukan maklumat anda. Ia bertukar
            kepada maklumat sebenar sebaik anda mengisinya.
          </AlertDescription>
        </Alert>
      ) : null}

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
          {/* Front: identity. A physical card puts who this is on the face
              and what to do about them on the back - clinical detail on the
              side that faces outward in a wallet is the wrong way round. */}
          <Face style={{ backfaceVisibility: "hidden" }}>
            <div className="flex h-full flex-col justify-between">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Label>Kad kecemasan</Label>
                  <p className="mt-1.5 truncate font-heading text-xl leading-tight tracking-tight">
                    {shown.displayName}
                  </p>
                  <p
                    className={cn(
                      "truncate text-xs",
                      shown.legalName
                        ? "text-muted-foreground"
                        : "text-muted-foreground/70 italic"
                    )}
                  >
                    {shown.legalName || sample.legalName}
                  </p>
                </div>
                <BrandChip />
              </div>

              <div className="grid grid-cols-3 items-end gap-3">
                <Field
                  label="Lahir"
                  value={
                    shown.dateOfBirth
                      ? formatDate(shown.dateOfBirth)
                      : undefined
                  }
                  sample={formatDate(sample.dateOfBirth ?? "")}
                />
                <Field
                  label="Jantina"
                  value={genderLabel(shown.gender)}
                  sample={genderLabel(sample.gender)}
                />
                <div className="min-w-0 space-y-1">
                  <Label>Darah</Label>
                  <p
                    className={cn(
                      "truncate text-base leading-none font-semibold",
                      shown.bloodType
                        ? "text-destructive"
                        : "text-muted-foreground/70 italic"
                    )}
                  >
                    {bloodTypeLabel(shown.bloodType ?? sample.bloodType)}
                  </p>
                </div>
              </div>

              <div className="flex items-end justify-between gap-3 border-t pt-2.5">
                {/* A card number. Every card people already carry has one, it
                    is what a clinician reads out over a phone, and it is the
                    key an NFC tag or QR would resolve. Formatted in blocks
                    because that is how a person reads a code aloud. */}
                <div className="min-w-0">
                  <Label>No. kad</Label>
                  <p className="truncate font-mono text-[0.7rem] tracking-widest">
                    {cardNumber(shown.careProfileId)}
                  </p>
                </div>
                <p className="shrink-0 text-[0.6rem] text-muted-foreground">
                  Butiran perubatan di belakang
                </p>
              </div>
            </div>
          </Face>

          {/* Back: what to do about this person, and how to reach the
              family. Allergies lead here, where a clinician turns the card
              over to look. */}
          <Face
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div className="flex h-full gap-3">
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div className="flex items-start gap-2.5 border-l-2 border-destructive pl-2.5">
                  <div className="min-w-0 flex-1">
                    <Label>Alahan</Label>
                    <p
                      className={cn(
                        "mt-0.5 line-clamp-2 text-sm leading-snug font-medium",
                        !shown.allergySummary &&
                          "text-muted-foreground/70 italic"
                      )}
                    >
                      {shown.allergySummary || sample.allergySummary}
                    </p>
                  </div>
                </div>

                <Field
                  label="Keadaan kesihatan"
                  value={shown.conditionSummary}
                  sample={sample.conditionSummary}
                />

                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="Klinik"
                    value={shown.primaryClinic}
                    sample={sample.primaryClinic}
                  />
                  <Field
                    label="Doktor"
                    value={shown.primaryDoctor}
                    sample={sample.primaryDoctor}
                  />
                </div>

                <Field
                  label="Hubungi"
                  value={shown.emergencyNote}
                  sample={sample.emergencyNote}
                />
              </div>

              {/* The QR resolves to this profile in the app. It is useful to a
                  family member with their own phone today; it is NOT a public
                  card link a stranger can read, which needs a revocable
                  card-specific token rather than an app URL. The NFC tag will
                  carry the same thing when it exists. */}
              <div className="flex w-20 shrink-0 flex-col items-center justify-between">
                <span className="rounded-md bg-white p-1 ring-1 ring-foreground/10">
                  <QRCodeSVG value={cardUrl} size={56} level="M" />
                </span>
                <span className="flex items-center gap-1 text-[0.55rem] leading-tight text-muted-foreground">
                  <IconNfc className="size-3 shrink-0" />
                  NFC belum ada
                </span>
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

      {/*
        Flat, complete, print-only - and deliberately **without** the sample
        values the screen card shows.
        On screen a greyed placeholder is obviously a placeholder. On paper
        there is no grey, no italic and no alert above it: a printed card
        reading "Penisilin, kacang" would be read as this person's allergy by
        whoever is holding it. Empty fields print as nothing, which is the only
        safe answer.
      */}
      <div className="hidden space-y-3 print:block">
        <div>
          <Label>Kad kecemasan</Label>
          <p className="font-heading text-2xl tracking-tight">
            {shown.displayName}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Jenis darah" value={bloodTypeLabel(shown.bloodType)} />
          <Field
            label="Tarikh lahir"
            value={
              shown.dateOfBirth ? formatDate(shown.dateOfBirth) : undefined
            }
          />
          <Field label="Nama penuh" value={shown.legalName} />
          <Field label="Jantina" value={genderLabel(shown.gender)} />
        </div>
        <Field label="Alahan" value={shown.allergySummary} />
        <Field label="Keadaan kesihatan" value={shown.conditionSummary} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Klinik utama" value={shown.primaryClinic} />
          <Field label="Doktor utama" value={shown.primaryDoctor} />
        </div>
        <Field label="Nota kecemasan" value={shown.emergencyNote} />
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
