import type { ReactNode } from "react"

export function PageHeader({
  title,
  description,
  meta,
  actions,
}: {
  title: string
  description?: string
  /**
   * Status and other read-only facts about the thing on this page.
   *
   * Separate from `actions` because they are not actions. Badges were being
   * passed into the action row, where a 20px badge shares a wrapping flex line
   * with 32px buttons and lands wherever the wrap puts it - it read as
   * scattered because it was in the wrong group.
   */
  meta?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1">
        <h1 className="font-heading text-2xl tracking-tight">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
        {meta ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">{meta}</div>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  )
}
