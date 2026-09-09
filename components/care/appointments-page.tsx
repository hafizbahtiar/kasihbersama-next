"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { AsyncStateBanner } from "@/components/care/async-state"
import { AppointmentCalendar } from "@/components/care/appointment-calendar"
import { PageHeader } from "@/components/care/page-header"
import {
  useCareData,
  useCareProfile,
} from "@/components/care/care-data-provider"
import { usePaginatedCareResource } from "@/hooks/use-paginated-care-resource"
import { todayKey } from "@/lib/application/care-format"
import { getCareRepository } from "@/lib/composition/care-repository"
import { isMockDataEnabled } from "@/lib/infrastructure/config"
import type { Appointment } from "@/lib/domain/care"

export function AppointmentsPage() {
  const router = useRouter()
  const apiMode = !isMockDataEnabled()
  const { selectedProfile } = useCareProfile()
  const { snapshot, isRefreshing, updateAppointmentStatus } = useCareData()
  const [selectedDay, setSelectedDay] = useState(() => todayKey())

  const fetchAppointments = useMemo(
    () => (profileId: string, params: { page?: number; perPage?: number }) =>
      getCareRepository().listAppointments(profileId, params),
    []
  )

  const paginated = usePaginatedCareResource<Appointment>({
    profileId: selectedProfile?.id,
    enabled: apiMode,
    fetcher: fetchAppointments,
    initialPerPage: 100,
  })

  const mockAppointments = snapshot.appointments.filter(
    (item) => item.profileId === selectedProfile?.id
  )
  const appointments = apiMode ? (paginated.data?.data ?? []) : mockAppointments
  const calendarLoading = apiMode ? paginated.isLoading : isRefreshing

  return (
    <div className="flex flex-col gap-5">
      {apiMode ? (
        <AsyncStateBanner
          error={paginated.error}
          onRetry={() => {
            void paginated.reload()
          }}
        />
      ) : null}

      <PageHeader
        title="Temujanji"
        description="Temujanji akan datang dan yang sudah lepas."
      />
      <AppointmentCalendar
        appointments={appointments}
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
        onCreate={() => router.push("/appointments/new")}
        isRefreshing={calendarLoading}
        onStatus={(id, status) => {
          void updateAppointmentStatus(id, status).then(() => {
            if (apiMode) {
              void paginated.reload()
            }
          })
        }}
      />
    </div>
  )
}
