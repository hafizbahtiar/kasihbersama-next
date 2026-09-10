"use client"

import { useMemo } from "react"
import { IconPill } from "@tabler/icons-react"

import { useCareData } from "@/components/care/care-data-provider"
import { Badge } from "@/components/ui/badge"
import { Button, LinkButton } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Item,
  ItemContent,
  ItemActions,
  ItemTitle,
  ItemDescription,
} from "@/components/ui/item"
import { formatDateTime } from "@/lib/application/care-format"
import { useCarePermissions } from "@/hooks/use-care-permissions"
import type { EventAction } from "@/lib/domain/care"

const ACTION_LABELS: Record<EventAction, string> = {
  taken: "Ambil",
  skipped: "Langkau",
  postponed: "Tunda",
}

/**
 * Doses still waiting, with the tick right here.
 *
 * Marking a dose was reachable from exactly one place - the medication detail
 * page - so the most frequent action in the app cost three navigations, several
 * times a day: home, medications, open the medication, find the row. The
 * dashboard counted active medications but not a single pending dose, which is
 * the only thing that needs doing right now.
 */
export function TodayDosesCard() {
  const { snapshot, selectedProfile, actOnEvent } = useCareData()
  const { can } = useCarePermissions()

  const pending = useMemo(() => {
    if (!selectedProfile) return []
    const names = new Map(
      snapshot.medications.map((m) => [m.id, m.name] as const)
    )
    return snapshot.events
      .filter(
        (e) =>
          e.profileId === selectedProfile.id && e.actionStatus === "pending"
      )
      .slice()
      .sort((a, b) => a.expectedAt.localeCompare(b.expectedAt))
      .slice(0, 6)
      .map((e) => ({
        ...e,
        name: names.get(e.medicationId) ?? "Ubat",
        // A dose expected this morning and still unmarked this afternoon is
        // not the same as one due tonight, and the list showed both
        // identically. Computed here rather than per row so every row is
        // judged against one instant.
        isOverdue: new Date(e.expectedAt) < new Date(),
      }))
  }, [selectedProfile, snapshot.events, snapshot.medications])

  if (!selectedProfile) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-lg">Dos hari ini</CardTitle>
        <CardDescription>Tanda bila sudah diambil.</CardDescription>
      </CardHeader>
      <CardContent>
        {pending.length === 0 ? (
          <Empty className="py-6">
            <EmptyMedia variant="icon">
              <IconPill />
            </EmptyMedia>
            <EmptyTitle>Tiada dos tertunggak</EmptyTitle>
            <EmptyDescription>Semua dos sudah ditanda.</EmptyDescription>
          </Empty>
        ) : (
          <div className="flex flex-col gap-2">
            {pending.map((event) => (
              <Item key={event.id} variant="outline">
                <ItemContent>
                  <ItemTitle className="flex items-center gap-2">
                    {event.name}
                    {event.isOverdue ? (
                      <Badge variant="destructive">Tertunggak</Badge>
                    ) : null}
                  </ItemTitle>
                  <ItemDescription>
                    {formatDateTime(event.expectedAt)}
                  </ItemDescription>
                </ItemContent>
                {can("can_tick_medication") ? (
                  <ItemActions>
                    {(["taken", "skipped", "postponed"] as EventAction[]).map(
                      (action) => (
                        <Button
                          key={action}
                          size="sm"
                          variant={action === "taken" ? "default" : "outline"}
                          onPress={() => {
                            void actOnEvent(event.id, action).catch(
                              () => undefined
                            )
                          }}
                        >
                          {ACTION_LABELS[action]}
                        </Button>
                      )
                    )}
                  </ItemActions>
                ) : null}
              </Item>
            ))}
            <LinkButton
              href="/medications"
              variant="outline"
              className="mt-1 w-full"
            >
              Lihat semua ubat
            </LinkButton>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
