"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { IconInbox } from "@tabler/icons-react"
import { toast } from "sonner"

import { BackButton } from "@/components/back-button"
import { ApiFieldGapNotice } from "@/components/care/api-field-gap-notice"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { CareFormShell } from "@/components/care/care-form-shell"
import { EventStatusBadge } from "@/components/care/status-badges"
import { MedicationStatusBadge } from "@/components/care/status-badges"
import { useCareData } from "@/components/care/care-data-provider"
import { createDataTableColumnHelper, DataTable } from "@/components/data-table"
import { TableActionButton, TableActions } from "@/components/table-actions"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { formatDateTime, todayKey } from "@/lib/application/care-format"
import { fieldValue } from "@/lib/application/form-value"
import {
  validateDateRange,
  validateDosage,
  validateTime,
} from "@/lib/application/form-validation"
import { isMockDataEnabled } from "@/lib/infrastructure/config"
import {
  BEFORE_AFTER_MEAL_OPTIONS,
  EVENT_STATUS_LABELS,
  MEDICATION_STATUS_LABELS,
  SCHEDULE_TYPE_LABELS,
  TIMEZONE_OPTIONS,
  type EventAction,
  type MedicationEvent,
  type MedicationSchedule,
  type MedicationStatus,
  type ScheduleType,
} from "@/lib/domain/care"

export function MedicationDetailPage({
  medicationId,
}: {
  medicationId: string
}) {
  const apiMode = !isMockDataEnabled()
  const {
    snapshot,
    updateMedication,
    addSchedule,
    updateSchedule,
    removeSchedule,
    actOnEvent,
    isRefreshing,
  } = useCareData()
  const medication = snapshot.medications.find(
    (item) => item.id === medicationId
  )
  const schedules = snapshot.schedules.filter(
    (item) => item.medicationId === medicationId
  )
  const events = snapshot.events.filter(
    (item) => item.medicationId === medicationId
  )
  const [instructions, setInstructions] = useState(
    medication?.instructions ?? ""
  )
  const [prescribedBy, setPrescribedBy] = useState(
    medication?.prescribedBy ?? ""
  )
  const [beforeAfterMeal, setBeforeAfterMeal] = useState(
    medication?.beforeAfterMeal ?? ""
  )
  const [startDate, setStartDate] = useState(medication?.startDate ?? "")
  const [endDate, setEndDate] = useState(medication?.endDate ?? "")
  const [scheduleType, setScheduleType] = useState<ScheduleType>("daily")
  const [timeOfDay, setTimeOfDay] = useState("08:00")
  const [timezone, setTimezone] = useState("Asia/Kuala_Lumpur")
  const [removeScheduleId, setRemoveScheduleId] = useState<string | null>(null)

  const scheduleColumns = useMemo(() => {
    const helper = createDataTableColumnHelper<MedicationSchedule>()
    return helper.columns([
      helper.accessor("scheduleType", {
        header: "Jenis",
        cell: ({ getValue }) => SCHEDULE_TYPE_LABELS[getValue()],
      }),
      helper.accessor((row) => row.timeOfDay ?? "—", {
        id: "timeOfDay",
        header: "Masa",
      }),
      helper.accessor("timezone", { header: "Zon masa" }),
      helper.accessor((row) => row.rrule ?? "—", {
        id: "rrule",
        header: "RRule",
      }),
      helper.accessor("status", {
        header: "Status",
        cell: ({ getValue }) => (getValue() === "active" ? "Aktif" : "Dijeda"),
      }),
      helper.display({
        id: "action",
        header: () => <span className="flex justify-end">Action</span>,
        enableSorting: false,
        cell: ({ row }) => (
          <TableActions>
            <TableActionButton
              onPress={() =>
                updateSchedule(row.original.id, {
                  status:
                    row.original.status === "active" ? "paused" : "active",
                })
              }
            >
              {row.original.status === "active" ? "Jeda" : "Aktifkan"}
            </TableActionButton>
            <TableActionButton
              variant="destructive"
              onPress={() => setRemoveScheduleId(row.original.id)}
            >
              Padam
            </TableActionButton>
          </TableActions>
        ),
      }),
    ])
  }, [removeSchedule, updateSchedule])

  const eventColumns = useMemo(() => {
    const helper = createDataTableColumnHelper<MedicationEvent>()
    return helper.columns([
      helper.accessor("expectedAt", {
        header: "Masa",
        cell: ({ getValue }) => formatDateTime(getValue()),
      }),
      helper.accessor("actionStatus", {
        header: "Status",
        filterFn: "equalsString",
        enableColumnFilter: true,
        cell: ({ getValue }) => <EventStatusBadge value={getValue()} />,
      }),
      helper.accessor((row) => row.note ?? "—", { id: "note", header: "Nota" }),
      helper.display({
        id: "action",
        header: () => <span className="flex justify-end">Action</span>,
        enableSorting: false,
        enableGlobalFilter: false,
        enableColumnFilter: false,
        cell: ({ row }) =>
          row.original.actionStatus === "pending" ||
          row.original.actionStatus === "postponed" ? (
            <>
              <TableActions className="hidden sm:flex">
                {(["taken", "skipped", "postponed"] as EventAction[]).map(
                  (action) => (
                    <TableActionButton
                      key={action}
                      variant={action === "taken" ? "default" : "outline"}
                      onPress={() => {
                        void actOnEvent(row.original.id, action).catch(
                          () => undefined
                        )
                      }}
                    >
                      {action === "taken"
                        ? "Ambil"
                        : action === "skipped"
                          ? "Langkau"
                          : "Tunda"}
                    </TableActionButton>
                  )
                )}
              </TableActions>
              <div className="sm:hidden">
                <DropdownMenuTrigger>
                  <Button size="sm" variant="outline">
                    Tindakan
                  </Button>
                  <DropdownMenu placement="bottom end">
                    {(["taken", "skipped", "postponed"] as EventAction[]).map(
                      (action) => (
                        <DropdownMenuItem
                          key={action}
                          onAction={() => {
                            void actOnEvent(row.original.id, action).catch(
                              () => undefined
                            )
                          }}
                        >
                          {action === "taken"
                            ? "Ambil"
                            : action === "skipped"
                              ? "Langkau"
                              : "Tunda"}
                        </DropdownMenuItem>
                      )
                    )}
                  </DropdownMenu>
                </DropdownMenuTrigger>
              </div>
            </>
          ) : null,
      }),
    ])
  }, [actOnEvent])

  if (!medication) {
    return (
      <div className="flex flex-col gap-4">
        <BackButton href="/medications" />
        <p className="text-sm text-muted-foreground">Ubat tidak dijumpai.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <BackButton href="/medications" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl tracking-tight">
            {medication.name}
          </h1>
          <p className="text-sm text-muted-foreground">{medication.dosage}</p>
        </div>
        <MedicationStatusBadge value={medication.status} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Butiran</CardTitle>
          <CardDescription>
            Arahan, prescriber, dan tarikh mula/tamat.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            {apiMode ? (
              <ApiFieldGapNotice>
                Prescriber dan tarikh mula/tamat belum disokong oleh DTO ubat
                backend. Jadual dan tindakan dos disambung melalui API.
              </ApiFieldGapNotice>
            ) : null}
            <Field>
              <FieldLabel>Arahan</FieldLabel>
              <Textarea
                className="min-h-24"
                value={instructions}
                onChange={(event) => setInstructions(fieldValue(event))}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              {!apiMode ? (
                <Field>
                  <FieldLabel>Prescriber</FieldLabel>
                  <Input
                    className="h-11 bg-background"
                    value={prescribedBy}
                    onChange={(event) => setPrescribedBy(fieldValue(event))}
                  />
                </Field>
              ) : null}
              <Field>
                <FieldLabel>Sebelum/selepas makan</FieldLabel>
                <Select
                  className="w-full"
                  selectedKey={beforeAfterMeal || null}
                  onSelectionChange={(key) =>
                    setBeforeAfterMeal(String(key ?? ""))
                  }
                  placeholder="Pilih masa makan"
                >
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BEFORE_AFTER_MEAL_OPTIONS.map((item) => (
                      <SelectItem key={item.value} id={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              {!apiMode ? (
                <>
                  <Field>
                    <FieldLabel>Mula</FieldLabel>
                    <Input
                      type="date"
                      className="h-11 bg-background"
                      value={startDate}
                      onChange={(event) => setStartDate(fieldValue(event))}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Tamat</FieldLabel>
                    <Input
                      type="date"
                      className="h-11 bg-background"
                      value={endDate}
                      onChange={(event) => setEndDate(fieldValue(event))}
                    />
                  </Field>
                </>
              ) : null}
              <Field>
                <FieldLabel>Status</FieldLabel>
                <Select
                  className="w-full"
                  selectedKey={medication.status}
                  onSelectionChange={(key) =>
                    updateMedication(medication.id, {
                      status: String(key) as MedicationStatus,
                    })
                  }
                >
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MEDICATION_STATUS_LABELS).map(
                      ([value, label]) => (
                        <SelectItem key={value} id={value}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
        <CardFooter className="justify-end">
          <Button
            onPress={() => {
              if (!apiMode) {
                const rangeError = validateDateRange(startDate, endDate)
                if (rangeError) {
                  toast.error(rangeError)
                  return
                }
              }
              void updateMedication(
                medication.id,
                apiMode
                  ? { instructions, beforeAfterMeal }
                  : {
                      instructions,
                      prescribedBy,
                      beforeAfterMeal,
                      startDate,
                      endDate: endDate || undefined,
                    }
              ).catch(() => undefined)
            }}
          >
            Simpan butiran
          </Button>
        </CardFooter>
      </Card>

      <DataTable
        columns={scheduleColumns}
        data={schedules}
        getRowId={(row) => row.id}
        isLoading={isRefreshing}
        paginate={false}
        toolbarStart={
          <div className="space-y-1">
            <h2 className="font-heading text-lg tracking-tight">Jadual</h2>
            <p className="text-sm text-muted-foreground">
              Harian, mingguan, beberapa kali sehari, atau bila perlu.
            </p>
          </div>
        }
        emptyIcon={<IconInbox />}
        emptyTitle="Tiada jadual"
        emptyDescription="Tambah jadual dos untuk ubat ini."
      />

      <Card>
        <CardHeader>
          <CardTitle>Jadual baharu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <Select
              selectedKey={scheduleType}
              onSelectionChange={(key) =>
                setScheduleType(String(key) as ScheduleType)
              }
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SCHEDULE_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} id={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="time"
              className="h-9 bg-background"
              value={timeOfDay}
              onChange={(event) => setTimeOfDay(fieldValue(event))}
            />
            <Select
              selectedKey={timezone}
              onSelectionChange={(key) => setTimezone(String(key ?? timezone))}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONE_OPTIONS.map((item) => (
                  <SelectItem key={item.value} id={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button
            onPress={() => {
              if (scheduleType !== "as_needed") {
                const timeError = validateTime(timeOfDay)
                if (timeError) {
                  toast.error(timeError)
                  return
                }
              }
              void addSchedule({
                medicationId: medication.id,
                scheduleType,
                timeOfDay: scheduleType === "as_needed" ? undefined : timeOfDay,
                timezone,
                status: "active",
              }).catch(() => undefined)
            }}
          >
            Tambah jadual
          </Button>
        </CardFooter>
      </Card>

      <DataTable
        columns={eventColumns}
        data={events}
        getRowId={(row) => row.id}
        isLoading={isRefreshing}
        searchable
        searchPlaceholder="Cari dos..."
        filter={{
          columnId: "actionStatus",
          label: "Status",
          options: Object.entries(EVENT_STATUS_LABELS).map(
            ([value, label]) => ({
              value,
              label,
            })
          ),
        }}
        toolbarStart={
          <div className="space-y-1">
            <h2 className="font-heading text-lg tracking-tight">Dos</h2>
            <p className="text-sm text-muted-foreground">
              Tandakan diambil, langkau atau tunda. Terlepas ditetapkan sistem.
            </p>
          </div>
        }
        emptyIcon={<IconInbox />}
        emptyTitle="Tiada dos"
        emptyDescription="Dos akan muncul mengikut jadual."
      />

      <ConfirmDialog
        isOpen={Boolean(removeScheduleId)}
        onOpenChange={(open) => {
          if (!open) {
            setRemoveScheduleId(null)
          }
        }}
        title="Padam jadual?"
        description="Jadual dos ini akan dibuang. Dos yang sudah dijadualkan tidak lagi dijana."
        confirmLabel="Padam"
        variant="destructive"
        onConfirm={() => {
          if (removeScheduleId) {
            void removeSchedule(removeScheduleId).catch(() => undefined)
          }
        }}
      />
    </div>
  )
}

export function MedicationCreatePage() {
  const router = useRouter()
  const apiMode = !isMockDataEnabled()
  const { selectedProfile, addMedication, addSchedule } = useCareData()
  const [name, setName] = useState("")
  const [dosage, setDosage] = useState("")
  const [instructions, setInstructions] = useState("")
  const [beforeAfterMeal, setBeforeAfterMeal] = useState("Selepas makan")
  const [prescribedBy, setPrescribedBy] = useState("")
  const [startDate, setStartDate] = useState(() => todayKey())
  const [timeOfDay, setTimeOfDay] = useState("08:00")
  const dirty = apiMode
    ? Boolean(name || dosage || instructions)
    : Boolean(name || dosage || instructions || prescribedBy)

  return (
    <CareFormShell
      title="Tambah ubat"
      backHref="/medications"
      dirty={dirty}
      isDisabled={!selectedProfile}
      onSubmit={() => {
        if (!selectedProfile) {
          return
        }
        const dosageError = validateDosage(dosage)
        const nameError = !name.trim() ? "Nama diperlukan." : null
        const timeError = validateTime(timeOfDay)
        if (nameError || dosageError || timeError) {
          toast.error(
            nameError ?? dosageError ?? timeError ?? "Medan tidak sah."
          )
          return
        }
        void addMedication({
          profileId: selectedProfile.id,
          name: name.trim(),
          dosage,
          instructions,
          beforeAfterMeal,
          prescribedBy: apiMode ? "" : prescribedBy,
          startDate: apiMode ? "" : startDate,
          status: "active",
        })
          .then((created) => {
            void addSchedule({
              medicationId: created.id,
              scheduleType: "daily",
              timeOfDay,
              timezone: "Asia/Kuala_Lumpur",
              status: "active",
            }).then(() => router.push(`/medications/${created.id}`))
          })
          .catch(() => undefined)
      }}
    >
      {!selectedProfile ? (
        <p className="text-sm text-muted-foreground">
          Pilih profil jagaan di header dahulu.
        </p>
      ) : (
        <FieldGroup>
          {apiMode ? (
            <ApiFieldGapNotice>
              Hanya nama, dos, arahan, dan masa makan dihantar ke API.
              Prescriber dan tarikh mula tersedia dalam mod mock.
            </ApiFieldGapNotice>
          ) : null}
          <Field>
            <FieldLabel>Nama</FieldLabel>
            <Input
              className="h-11 bg-background"
              value={name}
              onChange={(event) => setName(fieldValue(event))}
            />
          </Field>
          <Field>
            <FieldLabel>Dos</FieldLabel>
            <Input
              className="h-11 bg-background"
              value={dosage}
              onChange={(event) => setDosage(fieldValue(event))}
            />
          </Field>
          <Field>
            <FieldLabel>Arahan</FieldLabel>
            <Textarea
              className="min-h-24"
              value={instructions}
              onChange={(event) => setInstructions(fieldValue(event))}
            />
          </Field>
          {!apiMode ? (
            <>
              <Field>
                <FieldLabel>Prescriber</FieldLabel>
                <Input
                  className="h-11 bg-background"
                  value={prescribedBy}
                  onChange={(event) => setPrescribedBy(fieldValue(event))}
                />
              </Field>
              <Field>
                <FieldLabel>Tarikh mula</FieldLabel>
                <Input
                  type="date"
                  className="h-11 bg-background"
                  value={startDate}
                  onChange={(event) => setStartDate(fieldValue(event))}
                />
              </Field>
            </>
          ) : null}
          <Field>
            <FieldLabel>Sebelum/selepas makan</FieldLabel>
            <Select
              className="w-full"
              selectedKey={beforeAfterMeal}
              onSelectionChange={(key) =>
                setBeforeAfterMeal(String(key ?? beforeAfterMeal))
              }
            >
              <SelectTrigger className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BEFORE_AFTER_MEAL_OPTIONS.map((item) => (
                  <SelectItem key={item.value} id={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Masa dos pertama</FieldLabel>
            <Input
              type="time"
              className="h-11 bg-background"
              value={timeOfDay}
              onChange={(event) => setTimeOfDay(fieldValue(event))}
            />
          </Field>
        </FieldGroup>
      )}
    </CareFormShell>
  )
}
