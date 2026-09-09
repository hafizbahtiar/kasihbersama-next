"use client"

import { formatDateTime } from "@/lib/application/care-format"
import type { SummaryContent } from "@/lib/domain/care"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

function Section({
  title,
  empty,
  children,
}: {
  title: string
  empty: boolean
  children: React.ReactNode
}) {
  return (
    <section className="space-y-2">
      <h3 className="font-heading text-sm tracking-tight">{title}</h3>
      {empty ? (
        <p className="text-sm text-muted-foreground">Tiada rekod.</p>
      ) : (
        children
      )}
    </section>
  )
}

/**
 * The summary body, section by section.
 *
 * Its own component because the printable page and the on-screen view render
 * exactly the same thing - two copies would drift, and the one that drifts is
 * always the one nobody looks at until a doctor is holding it.
 */
export function SummarySections({
  content,
  className,
}: {
  content: SummaryContent
  className?: string
}) {
  return (
    <div className={cn("space-y-5", className)}>
      {content.truncated ? (
        <Alert>
          <AlertTitle>Ringkasan separa</AlertTitle>
          <AlertDescription>
            Terlalu banyak log dalam tempoh ini. Pilih tempoh lebih pendek untuk
            senarai penuh.
          </AlertDescription>
        </Alert>
      ) : null}

      <Section title="Ubat semasa" empty={content.medications.length === 0}>
        <ul className="space-y-2 text-sm">
          {content.medications.map((m, index) => (
            <li key={`${m.name}-${index}`} className="space-y-0.5">
              <p className="font-medium">
                {m.name}
                {m.dosage ? ` · ${m.dosage}` : ""}
              </p>
              {m.instructions || m.beforeAfterMeal ? (
                <p className="text-muted-foreground">
                  {[m.instructions, m.beforeAfterMeal]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              ) : null}
              {m.prescribedBy ? (
                <p className="text-muted-foreground">
                  Preskripsi: {m.prescribedBy}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Bacaan vital" empty={content.vitals.length === 0}>
        <ul className="space-y-2 text-sm">
          {content.vitals.map((v) => (
            <li key={v.readingType} className="space-y-0.5">
              <p className="font-medium">
                {v.readingType}
                {v.unit ? ` (${v.unit})` : ""}
              </p>
              <p className="text-muted-foreground">
                {v.readingCount} bacaan
                {v.minValue && v.maxValue
                  ? ` · julat ${v.minValue}–${v.maxValue}`
                  : ""}
                {v.latestValue ? ` · terkini ${v.latestValue}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Temujanji" empty={content.appointments.length === 0}>
        <ul className="space-y-2 text-sm">
          {content.appointments.map((a, index) => (
            <li key={`${a.title}-${index}`} className="space-y-0.5">
              <p className="font-medium">{a.title}</p>
              <p className="text-muted-foreground">
                {formatDateTime(a.at)}
                {a.doctorName ? ` · ${a.doctorName}` : ""}
                {a.location ? ` · ${a.location}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Log jagaan" empty={content.logs.length === 0}>
        <ul className="space-y-3 text-sm">
          {content.logs.map((l, index) => (
            <li key={`${l.title}-${index}`} className="space-y-0.5">
              <p className="font-medium">{l.title}</p>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(l.occurredAt)}
              </p>
              {l.body ? (
                <p className="text-muted-foreground">{l.body}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}
