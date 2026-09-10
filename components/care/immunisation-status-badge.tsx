import { Badge } from "@/components/ui/badge"
import { immunisationStatusKind } from "@/lib/application/immunisation-book"
import {
  IMMUNISATION_STATUS_LABELS,
  type ImmunisationStatus,
} from "@/lib/domain/growth"

function tone(
  kind: ReturnType<typeof immunisationStatusKind>
): "default" | "secondary" | "destructive" | "outline" {
  if (kind === "ok") {
    return "default"
  }
  if (kind === "danger") {
    return "destructive"
  }
  if (kind === "warn") {
    return "outline"
  }
  return "secondary"
}

export function ImmunisationStatusBadge({
  value,
}: {
  value: ImmunisationStatus
}) {
  return (
    <Badge variant={tone(immunisationStatusKind(value))}>
      {IMMUNISATION_STATUS_LABELS[value]}
    </Badge>
  )
}
