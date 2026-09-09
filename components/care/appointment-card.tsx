"use client"

import { AppointmentStatusBadge } from "@/components/care/status-badges"
import { Button } from "@/components/ui/button"
import { formatTime } from "@/lib/application/care-format"
import type { Appointment } from "@/lib/domain/care"

export function AppointmentCard({
  appointment,
  onStatus,
}: {
  appointment: Appointment
  onStatus: (status: Appointment["status"]) => void
}) {
  return (
    <div className="rounded-lg bg-muted/60 px-3 py-2.5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="font-medium">{appointment.title}</p>
          <p className="text-sm text-muted-foreground">
            {formatTime(appointment.appointmentAt)} · {appointment.location} ·{" "}
            {appointment.doctorName}
          </p>
          {appointment.notes ? (
            <p className="text-sm">{appointment.notes}</p>
          ) : null}
        </div>
        <AppointmentStatusBadge value={appointment.status} />
      </div>
      {appointment.status === "scheduled" ? (
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <Button size="sm" onPress={() => onStatus("completed")}>
            Selesai
          </Button>
          <Button
            size="sm"
            variant="outline"
            onPress={() => onStatus("cancelled")}
          >
            Batal
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onPress={() => onStatus("missed")}
          >
            Terlepas
          </Button>
        </div>
      ) : null}
    </div>
  )
}
