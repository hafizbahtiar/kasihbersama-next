import { LOGO_HEART, LOGO_SEGMENTS } from "@/components/brand/logo-paths"
import { cn } from "@/lib/utils"

/** Kasih Bersama — three arcs (circle of care) + heart. */
export function LogoMark({
  className,
  title = "Kasih Bersama",
  decorative = false,
}: {
  className?: string
  title?: string
  decorative?: boolean
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      className={cn("block size-8 shrink-0", className)}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : title}
    >
      {!decorative ? <title>{title}</title> : null}
      {LOGO_SEGMENTS.map((segment, index) => (
        <path key={index} d={segment} />
      ))}
      <path d={LOGO_HEART} />
    </svg>
  )
}
