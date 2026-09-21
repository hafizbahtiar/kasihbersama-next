"use client"

import { useState } from "react"
import {
  IconAlertTriangle,
  IconCalendarEvent,
  IconHeartbeat,
  IconStethoscope,
  IconTrash,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/confirm-dialog"
import { createDataTableColumnHelper, DataTable } from "@/components/data-table"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import { StatusChip, type StatusTone } from "@/components/status-chip"
import { AsyncStateBanner } from "@/components/shared/async-state"
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
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { usePersonHealth } from "@/hooks/use-person-health"
import { useDisplayFormat } from "@/lib/application/display-preferences"
import { getHealthRepository } from "@/lib/composition/health-repository"
import {
  ALLERGY_SEVERITIES,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUSES,
  BLOOD_TYPES,
  CONDITION_STATUS_LABELS,
  SEVERITY_LABELS,
  type AllergySeverity,
  type AppointmentStatus,
  type BloodType,
  type ConditionStatus,
  type HealthAllergy,
  type HealthAppointment,
  type HealthCondition,
  type HealthVisit,
} from "@/lib/domain/health"
import { isApiError, messageForApiError } from "@/lib/infrastructure/api/errors"

/** Nada cip mengikut MAKNA: sembuh ialah sejarah, aktif ialah sesuatu yang berjalan. */
const STATUS_TONE: Record<ConditionStatus, StatusTone> = {
  active: "attention",
  managed: "positive",
  resolved: "neutral",
}

/** Terlepas janji temu ialah perkara yang perlu ditindaklanjuti, bukan sekadar fakta. */
const APPOINTMENT_TONE: Record<AppointmentStatus, StatusTone> = {
  scheduled: "neutral",
  attended: "positive",
  missed: "critical",
  cancelled: "neutral",
  rescheduled: "attention",
}

/** Anafilaksis membunuh; ringan tidak. Nada mesti menunjukkan perbezaan itu. */
const SEVERITY_TONE: Record<AllergySeverity, StatusTone> = {
  mild: "neutral",
  moderate: "attention",
  severe: "critical",
  anaphylaxis: "critical",
}

export function PersonHealth({
  circleId,
  personId,
  canWrite,
}: {
  circleId: string
  personId: string
  /** Akses ringkasan membaca sahaja - pelayan menolaknya, jadi UI tidak menawarkannya. */
  canWrite: boolean
}) {
  const health = usePersonHealth(circleId, personId)
  const { date, dateTime } = useDisplayFormat()
  const repo = getHealthRepository()

  const [busy, setBusy] = useState(false)
  const [isConditionOpen, setIsConditionOpen] = useState(false)
  const [isAllergyOpen, setIsAllergyOpen] = useState(false)
  const [conditionTarget, setConditionTarget] =
    useState<HealthCondition | null>(null)
  const [allergyTarget, setAllergyTarget] = useState<HealthAllergy | null>(null)
  const [isAppointmentOpen, setIsAppointmentOpen] = useState(false)
  const [isVisitOpen, setIsVisitOpen] = useState(false)
  const [appointmentTarget, setAppointmentTarget] =
    useState<HealthAppointment | null>(null)
  const [visitTarget, setVisitTarget] = useState<HealthVisit | null>(null)

  async function run(action: Promise<unknown>, done: string) {
    setBusy(true)
    try {
      await action
      toast.success(done)
      await health.reload()
    } catch (cause) {
      toast.error(
        isApiError(cause) ? messageForApiError(cause) : "Tindakan gagal."
      )
    } finally {
      setBusy(false)
    }
  }

  const conditionHelper = createDataTableColumnHelper<HealthCondition>()
  const conditionColumns = conditionHelper.columns([
    conditionHelper.accessor("name", {
      header: "Keadaan",
      cell: ({ row }) => (
        <div className="min-w-0 space-y-0.5">
          <p className="font-medium">{row.original.name}</p>
          {row.original.notes ? (
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {row.original.notes}
            </p>
          ) : null}
        </div>
      ),
    }),
    conditionHelper.accessor("status", {
      header: "Status",
      filterFn: "equalsString",
      cell: ({ getValue }) => (
        <StatusChip
          tone={STATUS_TONE[getValue()]}
          label={CONDITION_STATUS_LABELS[getValue()]}
        />
      ),
    }),
    conditionHelper.accessor((row) => row.diagnosedOn ?? "", {
      id: "diagnosedOn",
      header: "Didiagnos",
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">
          {getValue() ? date(getValue()) : "-"}
        </span>
      ),
    }),
    conditionHelper.display({
      id: "action",
      header: () => <span className="flex justify-end">Tindakan</span>,
      enableSorting: false,
      cell: ({ row }) =>
        canWrite ? (
          <TableActions>
            {row.original.status === "resolved" ? (
              <TableActionButton
                isDisabled={busy}
                onPress={() => {
                  void run(
                    repo.updateCondition(circleId, personId, row.original.id, {
                      status: "active",
                    }),
                    "Ditanda aktif semula."
                  )
                }}
              >
                Aktif semula
              </TableActionButton>
            ) : (
              <TableActionButton
                isDisabled={busy}
                onPress={() => {
                  void run(
                    repo.updateCondition(circleId, personId, row.original.id, {
                      status: "resolved",
                    }),
                    "Ditanda sembuh."
                  )
                }}
              >
                Tandakan sembuh
              </TableActionButton>
            )}
            <TableActionButton
              aria-label={`Padam ${row.original.name}`}
              isDisabled={busy}
              onPress={() => setConditionTarget(row.original)}
            >
              <IconTrash />
              Padam
            </TableActionButton>
          </TableActions>
        ) : null,
    }),
  ])

  const allergyHelper = createDataTableColumnHelper<HealthAllergy>()
  const allergyColumns = allergyHelper.columns([
    allergyHelper.accessor("allergen", {
      header: "Alahan",
      cell: ({ row }) => (
        <div className="min-w-0 space-y-0.5">
          <p className="font-medium">{row.original.allergen}</p>
          {row.original.reaction ? (
            <p className="text-xs text-muted-foreground">
              {row.original.reaction}
            </p>
          ) : null}
        </div>
      ),
    }),
    allergyHelper.accessor("severity", {
      header: "Status",
      filterFn: "equalsString",
      cell: ({ getValue }) => (
        <StatusChip
          tone={SEVERITY_TONE[getValue()]}
          label={SEVERITY_LABELS[getValue()]}
        />
      ),
    }),
    allergyHelper.display({
      id: "action",
      header: () => <span className="flex justify-end">Tindakan</span>,
      enableSorting: false,
      cell: ({ row }) =>
        canWrite ? (
          <TableActions>
            <TableActionButton
              aria-label={`Padam ${row.original.allergen}`}
              isDisabled={busy}
              onPress={() => setAllergyTarget(row.original)}
            >
              <IconTrash />
              Padam
            </TableActionButton>
          </TableActions>
        ) : null,
    }),
  ])

  const apptHelper = createDataTableColumnHelper<HealthAppointment>()
  const appointmentColumns = apptHelper.columns([
    apptHelper.accessor("startsAt", {
      header: "Bila",
      cell: ({ row }) => (
        <div className="min-w-0 space-y-0.5">
          <p className="font-medium">{dateTime(row.original.startsAt)}</p>
          {row.original.locationNote ? (
            <p className="text-xs text-muted-foreground">
              {row.original.locationNote}
            </p>
          ) : null}
        </div>
      ),
    }),
    apptHelper.accessor("purpose", {
      header: "Tujuan",
      cell: ({ row }) => (
        <div className="min-w-0 space-y-0.5">
          <p>{row.original.purpose}</p>
          {row.original.notes ? (
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {row.original.notes}
            </p>
          ) : null}
        </div>
      ),
    }),
    apptHelper.accessor("status", {
      header: "Status",
      filterFn: "equalsString",
      cell: ({ getValue }) => (
        <StatusChip
          tone={APPOINTMENT_TONE[getValue()]}
          label={APPOINTMENT_STATUS_LABELS[getValue()]}
        />
      ),
    }),
    apptHelper.display({
      id: "action",
      header: () => <span className="flex justify-end">Tindakan</span>,
      enableSorting: false,
      cell: ({ row }) =>
        canWrite ? (
          <TableActions>
            {row.original.status === "scheduled" ? (
              <>
                <TableActionButton
                  isDisabled={busy}
                  onPress={() => {
                    void run(
                      repo.updateAppointment(
                        circleId,
                        personId,
                        row.original.id,
                        { status: "attended" }
                      ),
                      "Ditanda hadir."
                    )
                  }}
                >
                  Hadir
                </TableActionButton>
                <TableActionButton
                  isDisabled={busy}
                  onPress={() => {
                    void run(
                      repo.updateAppointment(
                        circleId,
                        personId,
                        row.original.id,
                        { status: "missed" }
                      ),
                      "Ditanda tidak hadir."
                    )
                  }}
                >
                  Tidak hadir
                </TableActionButton>
              </>
            ) : null}
            <TableActionButton
              aria-label={`Padam janji temu ${row.original.purpose}`}
              isDisabled={busy}
              onPress={() => setAppointmentTarget(row.original)}
            >
              <IconTrash />
              Padam
            </TableActionButton>
          </TableActions>
        ) : null,
    }),
  ])

  const visitHelper = createDataTableColumnHelper<HealthVisit>()
  const visitColumns = visitHelper.columns([
    visitHelper.accessor("visitedOn", {
      header: "Tarikh",
      cell: ({ getValue }) => <p className="font-medium">{date(getValue())}</p>,
    }),
    visitHelper.accessor((row) => row.reason ?? "", {
      id: "reason",
      header: "Sebab",
      cell: ({ row }) => (
        <div className="min-w-0 space-y-0.5">
          <p>{row.original.reason || "-"}</p>
          {row.original.diagnosis ? (
            <p className="text-xs text-muted-foreground">
              {row.original.diagnosis}
            </p>
          ) : null}
        </div>
      ),
    }),
    visitHelper.accessor((row) => (row.followUpOn ? "due" : "none"), {
      id: "status",
      header: "Status",
      filterFn: "equalsString",
      cell: ({ row }) =>
        row.original.followUpOn ? (
          <StatusChip
            tone="attention"
            label={`Susulan ${date(row.original.followUpOn)}`}
          />
        ) : (
          <StatusChip tone="neutral" label="Selesai" />
        ),
    }),
    visitHelper.accessor((row) => row.costAmount ?? "", {
      id: "cost",
      header: "Kos",
      cell: ({ row }) =>
        row.original.costAmount ? (
          <span className="tabular-nums">
            {row.original.costCurrency ?? "MYR"} {row.original.costAmount}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    }),
    visitHelper.display({
      id: "action",
      header: () => <span className="flex justify-end">Tindakan</span>,
      enableSorting: false,
      cell: ({ row }) =>
        canWrite ? (
          <TableActions>
            <TableActionButton
              aria-label={`Padam lawatan ${date(row.original.visitedOn)}`}
              isDisabled={busy}
              onPress={() => setVisitTarget(row.original)}
            >
              <IconTrash />
              Padam
            </TableActionButton>
          </TableActions>
        ) : null,
    }),
  ])

  return (
    <>
      <Tabs defaultSelectedKey="emergency" className="gap-5">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl tracking-tight">
            Rekod kesihatan
          </h1>
          <p className="text-sm text-muted-foreground">
            Kad kecemasan, keadaan dan alahan.
          </p>
        </div>

        <AsyncStateBanner
          error={health.error}
          onRetry={() => {
            void health.reload()
          }}
          label="Gagal memuatkan rekod kesihatan."
        />

        <TabsList variant="line" aria-label="Bahagian rekod kesihatan">
          <TabsTrigger id="emergency">Kad kecemasan</TabsTrigger>
          <TabsTrigger id="conditions">Keadaan</TabsTrigger>
          <TabsTrigger id="allergies">Alahan</TabsTrigger>
          <TabsTrigger id="appointments">Janji temu</TabsTrigger>
          <TabsTrigger id="visits">Lawatan</TabsTrigger>
        </TabsList>

        <TabsContent id="emergency">
          {health.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <EmergencyCard
              circleId={circleId}
              personId={personId}
              canWrite={canWrite}
              profile={health.profile}
              onSaved={() => health.reload()}
            />
          )}
        </TabsContent>

        <TabsContent id="conditions">
          <DataTable
            columns={conditionColumns}
            data={health.conditions}
            getRowId={(row) => row.id}
            isLoading={health.isLoading}
            pageSize={5}
            addLabel="Rekod keadaan"
            onAdd={canWrite ? () => setIsConditionOpen(true) : undefined}
            toolbarStart={
              <p className="text-sm text-muted-foreground">
                Apa yang dia ada sekarang. Yang sembuh turun ke bawah senarai.
              </p>
            }
            emptyIcon={<IconHeartbeat />}
            emptyTitle="Tiada keadaan direkodkan"
            emptyDescription="Kencing manis, darah tinggi, asma - apa sahaja yang perlu diingat."
          />
        </TabsContent>

        <TabsContent id="allergies">
          <DataTable
            columns={allergyColumns}
            data={health.allergies}
            getRowId={(row) => row.id}
            isLoading={health.isLoading}
            pageSize={5}
            addLabel="Rekod alahan"
            onAdd={canWrite ? () => setIsAllergyOpen(true) : undefined}
            toolbarStart={
              <p className="text-sm text-muted-foreground">
                Paling teruk di baris pertama - senarai ini dibaca semasa tergesa.
              </p>
            }
            emptyIcon={<IconAlertTriangle />}
            emptyTitle="Tiada alahan direkodkan"
            emptyDescription="Kosong bermakna belum direkod, bukan tiada alahan."
          />
        </TabsContent>
        <TabsContent id="appointments">
          <DataTable
            columns={appointmentColumns}
            data={health.appointments}
            getRowId={(row) => row.id}
            isLoading={health.isLoading}
            pageSize={5}
            addLabel="Tempah janji temu"
            onAdd={canWrite ? () => setIsAppointmentOpen(true) : undefined}
            toolbarStart={
              <p className="text-sm text-muted-foreground">
                Yang akan datang di atas, yang sudah berlalu di bawah.
              </p>
            }
            emptyIcon={<IconCalendarEvent />}
            emptyTitle="Tiada janji temu"
            emptyDescription="Klinik, pakar, ambil darah - apa sahaja yang ada tarikhnya."
          />
        </TabsContent>

        <TabsContent id="visits">
          <DataTable
            columns={visitColumns}
            data={health.visits}
            getRowId={(row) => row.id}
            isLoading={health.isLoading}
            pageSize={5}
            addLabel="Rekod lawatan"
            onAdd={canWrite ? () => setIsVisitOpen(true) : undefined}
            toolbarStart={
              <p className="text-sm text-muted-foreground">
                Apa yang sudah berlaku, dan bila dia patut pergi semula.
              </p>
            }
            emptyIcon={<IconStethoscope />}
            emptyTitle="Tiada lawatan direkodkan"
            emptyDescription="Rekod lawatan selepas ia berlaku - tarikh masa depan ialah janji temu."
          />
        </TabsContent>
      </Tabs>

      {/* Dialog kekal DI LUAR <Tabs>: RAC merender anak langsung Tabs sekali lagi
          dalam laluan koleksi tersembunyi, dan portal yang terlepas daripadanya
          menutup dirinya sebaik sahaja medan disentuh (AGENTS.md). */}
      <ConditionDialog
        isOpen={isConditionOpen}
        onOpenChange={setIsConditionOpen}
        isSaving={busy}
        onSubmit={(input) =>
          run(
            repo
              .createCondition(circleId, personId, input)
              .then(() => setIsConditionOpen(false)),
            "Keadaan direkodkan."
          )
        }
      />

      <AllergyDialog
        isOpen={isAllergyOpen}
        onOpenChange={setIsAllergyOpen}
        isSaving={busy}
        onSubmit={(input) =>
          run(
            repo
              .createAllergy(circleId, personId, input)
              .then(() => setIsAllergyOpen(false)),
            "Alahan direkodkan."
          )
        }
      />

      <AppointmentDialog
        isOpen={isAppointmentOpen}
        onOpenChange={setIsAppointmentOpen}
        isSaving={busy}
        onSubmit={(input) =>
          run(
            repo
              .createAppointment(circleId, personId, input)
              .then(() => setIsAppointmentOpen(false)),
            "Janji temu ditempah."
          )
        }
      />

      <VisitDialog
        isOpen={isVisitOpen}
        onOpenChange={setIsVisitOpen}
        isSaving={busy}
        onSubmit={(input) =>
          run(
            repo
              .createVisit(circleId, personId, input)
              .then(() => setIsVisitOpen(false)),
            "Lawatan direkodkan."
          )
        }
      />

      <ConfirmDialog
        isOpen={Boolean(appointmentTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setAppointmentTarget(null)
          }
        }}
        title="Padam janji temu ini?"
        description={`${appointmentTarget?.purpose ?? "Janji temu"} dibuang. Untuk menyimpan sejarah, tandakan tidak hadir sebaliknya.`}
        confirmLabel="Padam"
        variant="destructive"
        onConfirm={() => {
          const target = appointmentTarget
          setAppointmentTarget(null)
          if (target) {
            void run(
              repo.deleteAppointment(circleId, personId, target.id),
              "Janji temu dipadam."
            )
          }
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(visitTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setVisitTarget(null)
          }
        }}
        title="Padam lawatan ini?"
        description="Rekod lawatan dan kosnya dibuang daripada sejarah."
        confirmLabel="Padam"
        variant="destructive"
        onConfirm={() => {
          const target = visitTarget
          setVisitTarget(null)
          if (target) {
            void run(
              repo.deleteVisit(circleId, personId, target.id),
              "Lawatan dipadam."
            )
          }
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(conditionTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setConditionTarget(null)
          }
        }}
        title="Padam keadaan ini?"
        description={`${conditionTarget?.name ?? "Keadaan"} dibuang daripada rekod. Untuk menyimpan sejarah, tandakan sembuh sebaliknya.`}
        confirmLabel="Padam"
        variant="destructive"
        onConfirm={() => {
          const target = conditionTarget
          setConditionTarget(null)
          if (target) {
            void run(
              repo.deleteCondition(circleId, personId, target.id),
              "Keadaan dipadam."
            )
          }
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(allergyTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setAllergyTarget(null)
          }
        }}
        title="Padam alahan ini?"
        description={`${allergyTarget?.allergen ?? "Alahan"} dibuang daripada kad kecemasan.`}
        confirmLabel="Padam"
        variant="destructive"
        onConfirm={() => {
          const target = allergyTarget
          setAllergyTarget(null)
          if (target) {
            void run(
              repo.deleteAllergy(circleId, personId, target.id),
              "Alahan dipadam."
            )
          }
        }}
      />
    </>
  )
}

/**
 * Kad kecemasan. Borang penuh, bukan tampalan: apa yang dipaparkan ialah apa yang
 * disimpan, dan medan yang dikosongkan memang bermakna "buang".
 */
function EmergencyCard({
  circleId,
  personId,
  canWrite,
  profile,
  onSaved,
}: {
  circleId: string
  personId: string
  canWrite: boolean
  profile: import("@/lib/domain/health").HealthProfile
  onSaved: () => void
}) {
  const [draft, setDraft] = useState(profile)
  const [isSaving, setIsSaving] = useState(false)

  async function save() {
    setIsSaving(true)
    try {
      await getHealthRepository().saveProfile(circleId, personId, draft)
      toast.success("Kad kecemasan disimpan.")
      onSaved()
    } catch (cause) {
      toast.error(
        isApiError(cause) ? messageForApiError(cause) : "Gagal menyimpan."
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kad kecemasan</CardTitle>
        <CardDescription>
          Apa yang paramedik atau doktor perlu tahu dalam sepuluh saat pertama.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel>Jenis darah</FieldLabel>
          <Select
            className="w-full"
            aria-label="Jenis darah"
            isDisabled={!canWrite}
            value={draft.bloodType ?? ""}
            onChange={(key) =>
              setDraft({ ...draft, bloodType: (key || undefined) as BloodType })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BLOOD_TYPES.map((type) => (
                <SelectItem key={type} id={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field orientation="horizontal">
          <div className="min-w-0 space-y-0.5">
            <FieldLabel>Penderma organ</FieldLabel>
            <FieldDescription>Seperti tercatat pada kad.</FieldDescription>
          </div>
          <Switch
            aria-label="Penderma organ"
            isSelected={draft.isOrganDonor ?? false}
            isDisabled={!canWrite}
            onChange={(value) => setDraft({ ...draft, isOrganDonor: value })}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="emergency-name">Kenalan kecemasan</FieldLabel>
          <Input
            id="emergency-name"
            value={draft.emergencyContactName ?? ""}
            disabled={!canWrite}
            onChange={(event) =>
              setDraft({ ...draft, emergencyContactName: event.target.value })
            }
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="emergency-phone">Nombor telefon</FieldLabel>
          <Input
            id="emergency-phone"
            type="tel"
            value={draft.emergencyContactPhone ?? ""}
            disabled={!canWrite}
            onChange={(event) =>
              setDraft({ ...draft, emergencyContactPhone: event.target.value })
            }
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="insurer">Insurans</FieldLabel>
          <Input
            id="insurer"
            value={draft.insuranceProvider ?? ""}
            disabled={!canWrite}
            onChange={(event) =>
              setDraft({ ...draft, insuranceProvider: event.target.value })
            }
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="policy">Nombor polisi</FieldLabel>
          <Input
            id="policy"
            value={draft.insurancePolicyNo ?? ""}
            disabled={!canWrite}
            onChange={(event) =>
              setDraft({ ...draft, insurancePolicyNo: event.target.value })
            }
          />
        </Field>

        <Field className="sm:col-span-2">
          <FieldLabel htmlFor="health-notes">Nota</FieldLabel>
          <Textarea
            id="health-notes"
            rows={3}
            value={draft.notes ?? ""}
            disabled={!canWrite}
            onChange={(event) =>
              setDraft({ ...draft, notes: event.target.value })
            }
          />
        </Field>
      </CardContent>
      {canWrite ? (
        <CardFooter className="justify-end">
          <Button
            isDisabled={isSaving}
            onPress={() => {
              void save()
            }}
          >
            Simpan kad
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  )
}

function ConditionDialog({
  isOpen,
  onOpenChange,
  isSaving,
  onSubmit,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  isSaving: boolean
  onSubmit: (input: {
    name: string
    status?: ConditionStatus
    diagnosedOn?: string
    notes?: string
  }) => void
}) {
  const [name, setName] = useState("")
  const [status, setStatus] = useState<ConditionStatus>("active")
  const [diagnosedOn, setDiagnosedOn] = useState("")
  const [notes, setNotes] = useState("")

  return (
    <ResponsiveDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Rekod keadaan"
      description="Nama biasa memadai - tiada kod perubatan diperlukan."
      footer={
        <>
          <Button variant="outline" onPress={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            isDisabled={isSaving || name.trim().length === 0}
            onPress={() => {
              onSubmit({ name: name.trim(), status, diagnosedOn, notes })
              setName("")
              setDiagnosedOn("")
              setNotes("")
            }}
          >
            Simpan
          </Button>
        </>
      }
    >
      <Field>
        <FieldLabel htmlFor="condition-name">Nama</FieldLabel>
        <Input
          id="condition-name"
          value={name}
          placeholder="Contoh: kencing manis"
          onChange={(event) => setName(event.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel>Status</FieldLabel>
        <Select
          className="w-full"
          aria-label="Status keadaan"
          value={status}
          onChange={(key) =>
            setStatus(String(key ?? "active") as ConditionStatus)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(CONDITION_STATUS_LABELS) as ConditionStatus[]).map(
              (key) => (
                <SelectItem key={key} id={key}>
                  {CONDITION_STATUS_LABELS[key]}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel htmlFor="condition-date">Tarikh diagnosis</FieldLabel>
        <Input
          id="condition-date"
          type="date"
          value={diagnosedOn}
          onChange={(event) => setDiagnosedOn(event.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="condition-notes">Nota</FieldLabel>
        <Textarea
          id="condition-notes"
          rows={3}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </Field>
    </ResponsiveDialog>
  )
}

function AllergyDialog({
  isOpen,
  onOpenChange,
  isSaving,
  onSubmit,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  isSaving: boolean
  onSubmit: (input: {
    allergen: string
    reaction?: string
    severity?: AllergySeverity
    notedOn?: string
  }) => void
}) {
  const [allergen, setAllergen] = useState("")
  const [reaction, setReaction] = useState("")
  const [severity, setSeverity] = useState<AllergySeverity>("mild")

  return (
    <ResponsiveDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Rekod alahan"
      description="Alahan yang sama hanya boleh direkod sekali."
      footer={
        <>
          <Button variant="outline" onPress={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            isDisabled={isSaving || allergen.trim().length === 0}
            onPress={() => {
              onSubmit({ allergen: allergen.trim(), reaction, severity })
              setAllergen("")
              setReaction("")
            }}
          >
            Simpan
          </Button>
        </>
      }
    >
      <Field>
        <FieldLabel htmlFor="allergen">Alahan kepada</FieldLabel>
        <Input
          id="allergen"
          value={allergen}
          placeholder="Contoh: kacang"
          onChange={(event) => setAllergen(event.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="reaction">Reaksi</FieldLabel>
        <Input
          id="reaction"
          value={reaction}
          placeholder="Contoh: bengkak, sesak nafas"
          onChange={(event) => setReaction(event.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel>Keterukan</FieldLabel>
        <Select
          className="w-full"
          aria-label="Keterukan alahan"
          value={severity}
          onChange={(key) =>
            setSeverity(String(key ?? "mild") as AllergySeverity)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ALLERGY_SEVERITIES.map((key) => (
              <SelectItem key={key} id={key}>
                {SEVERITY_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </ResponsiveDialog>
  )
}

function AppointmentDialog({
  isOpen,
  onOpenChange,
  isSaving,
  onSubmit,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  isSaving: boolean
  onSubmit: (input: {
    purpose: string
    startsAt: string
    endsAt?: string
    locationNote?: string
    status?: AppointmentStatus
    notes?: string
  }) => void
}) {
  const [purpose, setPurpose] = useState("")
  const [startsAt, setStartsAt] = useState("")
  const [endsAt, setEndsAt] = useState("")
  const [locationNote, setLocationNote] = useState("")
  const [status, setStatus] = useState<AppointmentStatus>("scheduled")
  const [notes, setNotes] = useState("")

  return (
    <ResponsiveDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Tempah janji temu"
      description="Masa dalam zon waktu peranti anda."
      footer={
        <>
          <Button variant="outline" onPress={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            isDisabled={
              isSaving || purpose.trim().length === 0 || startsAt.length === 0
            }
            onPress={() => {
              onSubmit({
                purpose: purpose.trim(),
                startsAt,
                endsAt: endsAt || undefined,
                locationNote,
                status,
                notes,
              })
              setPurpose("")
              setStartsAt("")
              setEndsAt("")
              setLocationNote("")
              setNotes("")
            }}
          >
            Simpan
          </Button>
        </>
      }
    >
      <Field>
        <FieldLabel htmlFor="appointment-purpose">Tujuan</FieldLabel>
        <Input
          id="appointment-purpose"
          value={purpose}
          placeholder="Contoh: klinik pakar jantung"
          onChange={(event) => setPurpose(event.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="appointment-starts">Masa mula</FieldLabel>
        <Input
          id="appointment-starts"
          type="datetime-local"
          value={startsAt}
          onChange={(event) => setStartsAt(event.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="appointment-ends">Masa tamat</FieldLabel>
        <Input
          id="appointment-ends"
          type="datetime-local"
          value={endsAt}
          onChange={(event) => setEndsAt(event.target.value)}
        />
        <FieldDescription>Pilihan - biar kosong kalau tidak pasti.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor="appointment-location">Tempat</FieldLabel>
        <Input
          id="appointment-location"
          value={locationNote}
          placeholder="Contoh: HKL Blok C, Klinik Kesihatan Seri Muda"
          onChange={(event) => setLocationNote(event.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel>Status</FieldLabel>
        <Select
          className="w-full"
          aria-label="Status janji temu"
          value={status}
          onChange={(key) =>
            setStatus(String(key ?? "scheduled") as AppointmentStatus)
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {APPOINTMENT_STATUSES.map((key) => (
              <SelectItem key={key} id={key}>
                {APPOINTMENT_STATUS_LABELS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel htmlFor="appointment-notes">Nota</FieldLabel>
        <Textarea
          id="appointment-notes"
          rows={2}
          value={notes}
          placeholder="Contoh: bawa keputusan ujian darah"
          onChange={(event) => setNotes(event.target.value)}
        />
      </Field>
    </ResponsiveDialog>
  )
}

function VisitDialog({
  isOpen,
  onOpenChange,
  isSaving,
  onSubmit,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  isSaving: boolean
  onSubmit: (input: {
    visitedOn: string
    reason?: string
    diagnosis?: string
    notes?: string
    costAmount?: string
    costCurrency?: string
    followUpOn?: string
  }) => void
}) {
  const [visitedOn, setVisitedOn] = useState("")
  const [reason, setReason] = useState("")
  const [diagnosis, setDiagnosis] = useState("")
  const [costAmount, setCostAmount] = useState("")
  const [followUpOn, setFollowUpOn] = useState("")
  const [notes, setNotes] = useState("")

  return (
    <ResponsiveDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Rekod lawatan"
      description="Lawatan yang sudah berlaku - tarikh masa depan ialah janji temu."
      footer={
        <>
          <Button variant="outline" onPress={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            isDisabled={isSaving || visitedOn.length === 0}
            onPress={() => {
              onSubmit({
                visitedOn,
                reason,
                diagnosis,
                notes,
                costAmount,
                followUpOn: followUpOn || undefined,
              })
              setVisitedOn("")
              setReason("")
              setDiagnosis("")
              setCostAmount("")
              setFollowUpOn("")
              setNotes("")
            }}
          >
            Simpan
          </Button>
        </>
      }
    >
      <Field>
        <FieldLabel htmlFor="visit-date">Tarikh lawatan</FieldLabel>
        <Input
          id="visit-date"
          type="date"
          value={visitedOn}
          onChange={(event) => setVisitedOn(event.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="visit-reason">Sebab</FieldLabel>
        <Input
          id="visit-reason"
          value={reason}
          placeholder="Contoh: sakit dada"
          onChange={(event) => setReason(event.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="visit-diagnosis">Diagnosis</FieldLabel>
        <Input
          id="visit-diagnosis"
          value={diagnosis}
          placeholder="Apa yang doktor kata"
          onChange={(event) => setDiagnosis(event.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="visit-cost">Kos (MYR)</FieldLabel>
        <Input
          id="visit-cost"
          inputMode="decimal"
          value={costAmount}
          placeholder="0.00"
          onChange={(event) => setCostAmount(event.target.value)}
        />
        <FieldDescription>Maksimum dua tempat perpuluhan.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel htmlFor="visit-followup">Tarikh susulan</FieldLabel>
        <Input
          id="visit-followup"
          type="date"
          value={followUpOn}
          onChange={(event) => setFollowUpOn(event.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="visit-notes">Nota</FieldLabel>
        <Textarea
          id="visit-notes"
          rows={2}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </Field>
    </ResponsiveDialog>
  )
}
