import Image from "next/image"

import { cn } from "@/lib/utils"

/**
 * Kasih Bersama - two clasped hands forming a heart, with the network of
 * people it stands for drawn inside it.
 *
 * A raster, not the inline SVG that used to live here. The real mark is two
 * fixed colours - brand teal and gold - so it cannot follow `currentColor` the
 * way a single-path glyph can, and it must sit on a light surface to read.
 * Every caller wraps it in a pale chip for that reason.
 */
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
    <Image
      src="/brand/mark-192.png"
      alt={decorative ? "" : title}
      aria-hidden={decorative ? true : undefined}
      width={192}
      height={177}
      priority
      className={cn("block h-auto w-full object-contain", className)}
    />
  )
}

/**
 * The horizontal lockup: mark plus "Kasih Bersama". Use where the name would
 * otherwise be set as text beside the mark, so the wordmark's own letterforms
 * carry it instead of the UI font.
 */
export function LogoWordmark({
  className,
  title = "Kasih Bersama",
}: {
  className?: string
  title?: string
}) {
  return (
    <Image
      src="/brand/wordmark-1024.png"
      alt={title}
      width={1024}
      height={311}
      priority
      className={cn("block h-auto w-auto object-contain", className)}
    />
  )
}
