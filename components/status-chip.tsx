"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

/**
 * The four meanings a status can carry. Named by MEANING, not colour, so a
 * later palette change is one edit here rather than a hunt through the app.
 *
 * - `positive`  - working as it should: active, trusted, accepted
 * - `neutral`   - a true state that needs no attention: read, expired, left
 * - `attention` - waiting on someone: pending, unread, not yet trusted
 * - `critical`  - stopped or refused: suspended, revoked, failed
 */
export type StatusTone = "positive" | "neutral" | "attention" | "critical"

const TONE_CLASS: Record<StatusTone, string> = {
  positive:
    "border-transparent bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  neutral: "border-transparent bg-muted text-muted-foreground",
  attention:
    "border-transparent bg-amber-500/15 text-amber-800 dark:text-amber-200",
  critical:
    "border-transparent bg-destructive/12 text-destructive dark:text-destructive-foreground",
}

/**
 * The one way this app renders a status.
 *
 * Every list has a status column (see AGENTS.md), and without a shared chip
 * each one invents its own colours - so "aktif" ends up green in one table and
 * grey in the next, and the reader has to learn each table separately.
 */
export function StatusChip({
  tone = "neutral",
  label,
  className,
}: {
  tone?: StatusTone
  label: string
  className?: string
}) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", TONE_CLASS[tone], className)}
    >
      {label}
    </Badge>
  )
}
