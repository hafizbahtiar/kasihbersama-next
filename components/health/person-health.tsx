"use client"

import { useState, type ReactNode } from "react"
import {
  IconActivity,
  IconAlertTriangle,
  IconCalendarEvent,
  IconCircleCheck,
  IconDroplet,
  IconHeartbeat,
  IconHeartHandshake,
  IconPencil,
  IconPhone,
  IconPill,
  IconRotate,
  IconStethoscope,
  IconVaccine,
  IconTrash,
  IconUrgent,
} from "@tabler/icons-react"
import { toast } from "sonner"

import { PersonLogs } from "@/components/care/person-logs"
import { PersonNeeds } from "@/components/care/person-needs"
import { PersonShifts } from "@/components/care/person-shifts"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createDataTableColumnHelper, DataTable } from "@/components/data-table"
import { PersonDoses } from "@/components/health/person-doses"
import { PersonImmunisations } from "@/components/health/person-immunisations"
import { PersonMedications } from "@/components/health/person-medications"
import { PersonVitals } from "@/components/health/person-vitals"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import { StatusChip, type StatusTone } from "@/components/status-chip"
import { AsyncStateBanner } from "@/components/shared/async-state"
import { TableActionButton, TableActions } from "@/components/table-actions"
import { Button } from "@/components/ui/button"
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
import { PersonAddresses } from "@/components/circles/person-addresses"
import { PersonRelationships } from "@/components/circles/person-relationships"
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
  type HealthProfile,
  type HealthVisit,
} from "@/lib/domain/health"
import { isApiError, messageForApiError } from "@/lib/infrastructure/api/errors"
import { cn } from "@/lib/utils"

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
  canWriteCare,
  canWriteLog,
  canModerateLog,
  canWriteShift,
  canUpdatePerson,
}: {
  circleId: string
  personId: string
  /** Akses ringkasan membaca sahaja - pelayan menolaknya, jadi UI tidak menawarkannya. */
  canWrite: boolean
  /** `care.need.create` - arahan tetap ialah module berasingan (docs/15 §7). */
  canWriteCare: boolean
  /** `care.log.create` / `care.log.manage` - tulis catatan, dan padam catatan orang lain. */
  canWriteLog: boolean
  canModerateLog: boolean
  /** `care.shift.create` - tambah dan urus giliran menjaga. */
  canWriteShift: boolean
  /** `core.person.update` - alamat dan hubungan milik rekod person, bukan health. */
  canUpdatePerson: boolean
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
              tone="danger"
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
              tone="danger"
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
              tone="danger"
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
              tone="danger"
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
            Kad kecemasan, keadaan, alahan, ubat, janji temu, dos dan lawatan.
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
          <TabsTrigger id="medications">Ubat</TabsTrigger>
          <TabsTrigger id="doses">Dos</TabsTrigger>
          <TabsTrigger id="vitals">Vital</TabsTrigger>
          <TabsTrigger id="immunisations">Imunisasi</TabsTrigger>
          <TabsTrigger id="appointments">Janji temu</TabsTrigger>
          <TabsTrigger id="visits">Lawatan</TabsTrigger>
          <TabsTrigger id="care">Penjagaan</TabsTrigger>
          <TabsTrigger id="addresses">Alamat</TabsTrigger>
          <TabsTrigger id="relationships">Hubungan</TabsTrigger>
        </TabsList>

        <TabsContent id="emergency" className="flex flex-col gap-4">
          <TabHint icon={<IconUrgent />}>
            Apa yang paramedik atau doktor perlu tahu dalam sepuluh saat
            pertama. Balikkan kad untuk insurans dan nota.
          </TabHint>
          {health.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <EmergencyCard
              circleId={circleId}
              personId={personId}
              canWrite={canWrite}
              profile={health.profile}
              allergies={health.allergies}
              onSaved={() => health.reload()}
            />
          )}
        </TabsContent>

        <TabsContent id="conditions" className="flex flex-col gap-4">
          <TabHint icon={<IconHeartbeat />}>
            Keadaan berpanjangan yang perlu diingat - kencing manis, darah
            tinggi, asma. Tandakan sembuh dan bukan padam, supaya sejarahnya
            kekal.
          </TabHint>
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

        <TabsContent id="allergies" className="flex flex-col gap-4">
          <TabHint icon={<IconAlertTriangle />}>
            Apa yang tidak boleh diberi kepadanya. Diisih paling teruk dahulu
            kerana senarai ini dibaca semasa tergesa, dan ia muncul pada kad
            kecemasan.
          </TabHint>
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
                Paling teruk di baris pertama - senarai ini dibaca semasa
                tergesa.
              </p>
            }
            emptyIcon={<IconAlertTriangle />}
            emptyTitle="Tiada alahan direkodkan"
            emptyDescription="Kosong bermakna belum direkod, bukan tiada alahan."
          />
        </TabsContent>
        <TabsContent id="medications" className="flex flex-col gap-4">
          <TabHint icon={<IconPill />}>
            Preskripsi yang sedang berjalan. Setiap ubat membawa jadual dosnya
            sendiri - tambah jadual dahulu, kemudian tandakan dos dalam tab Dos.
          </TabHint>
          <PersonMedications
            circleId={circleId}
            personId={personId}
            canWrite={canWrite}
            medications={health.medications}
            error={health.error}
            isLoading={health.isLoading}
            onChanged={() => health.reload()}
          />
        </TabsContent>

        <TabsContent id="doses" className="flex flex-col gap-4">
          <TabHint icon={<IconCircleCheck />}>
            Yang perlu diambil HARI INI. Dah makan atau langkau - ia dicatat dan
            sejarahnya kekal.
          </TabHint>
          <PersonDoses
            circleId={circleId}
            personId={personId}
            canWrite={canWrite}
          />
        </TabsContent>

        <TabsContent id="vitals" className="flex flex-col gap-4">
          <TabHint icon={<IconActivity />}>
            Tekanan darah, nadi, berat, suhu - apa yang diukur, bila ia diukur.
            Bacaan ialah snapshot, bukan sejarah yang disunting.
          </TabHint>
          <PersonVitals
            circleId={circleId}
            personId={personId}
            canWrite={canWrite}
            vitalTypes={health.vitalTypes}
            vitalReadings={health.vitalReadings}
            error={health.error}
            isLoading={health.isLoading}
            onChanged={() => health.reload()}
          />
        </TabsContent>

        <TabsContent id="immunisations" className="flex flex-col gap-4">
          <TabHint icon={<IconVaccine />}>
            Jadual vaksinasi - terutama kanak-kanak. Tarikh Diberi kosong
            bermakna berjadual, belum disuntik.
          </TabHint>
          <PersonImmunisations
            circleId={circleId}
            personId={personId}
            canWrite={canWrite}
            immunisations={health.immunisations}
            error={health.error}
            isLoading={health.isLoading}
            onChanged={() => health.reload()}
          />
        </TabsContent>

        <TabsContent id="appointments" className="flex flex-col gap-4">
          <TabHint icon={<IconCalendarEvent />}>
            Yang BELUM berlaku: klinik, pakar, ambil darah. Selepas ia berlaku,
            tandakan hadir - kemudian rekodkan apa yang berlaku dalam tab
            Lawatan.
          </TabHint>
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

        <TabsContent id="visits" className="flex flex-col gap-4">
          <TabHint icon={<IconStethoscope />}>
            Yang SUDAH berlaku: apa kata doktor, berapa kosnya, dan bila dia
            patut pergi semula.
          </TabHint>
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

        <TabsContent id="care" className="flex flex-col gap-4">
          <TabHint icon={<IconHeartHandshake />}>
            Arahan tetap untuk penjaga ganti, giliran siapa jaga bila, dan
            catatan harian tentang apa yang berlaku.
          </TabHint>
          <PersonNeeds
            circleId={circleId}
            personId={personId}
            canWrite={canWriteCare}
          />
          <PersonShifts
            circleId={circleId}
            personId={personId}
            canWrite={canWriteShift}
          />
          <PersonLogs
            circleId={circleId}
            personId={personId}
            canCreate={canWriteLog}
            canModerate={canModerateLog}
          />
        </TabsContent>

        <TabsContent id="addresses" className="flex flex-col gap-4">
          <PersonAddresses
            circleId={circleId}
            personId={personId}
            canWrite={canUpdatePerson}
          />
        </TabsContent>

        <TabsContent id="relationships" className="flex flex-col gap-4">
          <PersonRelationships
            circleId={circleId}
            personId={personId}
            canWrite={canUpdatePerson}
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

/** Satu baris penerangan di puncak setiap tab: tab yang tidak dijelaskan diisi salah. */
function TabHint({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <Alert>
      {icon}
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  )
}

/**
 * Kad kecemasan sebagai kad sebenar, bukan borang.
 *
 * Depan membawa apa yang dibaca dalam sepuluh saat pertama: jenis darah, alahan
 * paling teruk, siapa yang perlu dihubungi. Belakang membawa yang dibaca di
 * kaunter - insurans dan nota. Menyunting berlaku dalam dialog, jadi kad ini
 * kekal boleh dibaca dan tidak pernah kelihatan separuh disunting.
 */
function EmergencyCard({
  circleId,
  personId,
  canWrite,
  profile,
  allergies,
  onSaved,
}: {
  circleId: string
  personId: string
  canWrite: boolean
  profile: HealthProfile
  allergies: HealthAllergy[]
  onSaved: () => void
}) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Tiga sahaja: kad ini dipandang, bukan dibaca. Yang selebihnya ada dalam tab
  // Alahan, dan senarai itu sudah diisih paling teruk dahulu oleh pelayan.
  const worst = allergies.slice(0, 3)
  const rest = allergies.length - worst.length

  return (
    <div className="flex max-w-md flex-col gap-3">
      <div className="perspective-distant">
        <div
          className={cn(
            "relative min-h-72 transition-transform duration-500 ease-out transform-3d",
            isFlipped && "rotate-y-180"
          )}
        >
          <CardFace className="relative">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs tracking-wide text-muted-foreground uppercase">
                  Kad kecemasan
                </p>
                <p className="text-sm text-muted-foreground">
                  Sepuluh saat pertama
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-xl border bg-muted/40 px-3 py-2">
                <IconDroplet className="size-5 text-destructive" />
                <span className="font-heading text-2xl leading-none tabular-nums">
                  {profile.bloodType ?? "?"}
                </span>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <FaceRow label="Alahan">
                {worst.length === 0 ? (
                  <span className="text-sm text-muted-foreground">
                    Belum direkod
                  </span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {worst.map((a) => (
                      <StatusChip
                        key={a.id}
                        tone={SEVERITY_TONE[a.severity]}
                        label={`${a.allergen} - ${SEVERITY_LABELS[a.severity]}`}
                      />
                    ))}
                    {rest > 0 ? (
                      <StatusChip tone="neutral" label={`+${rest} lagi`} />
                    ) : null}
                  </div>
                )}
              </FaceRow>

              <FaceRow label="Hubungi">
                <p className="text-sm font-medium">
                  {profile.emergencyContactName || "Kenalan belum diisi"}
                </p>
                {profile.emergencyContactPhone ? (
                  <a
                    href={`tel:${profile.emergencyContactPhone}`}
                    className="inline-flex items-center gap-1.5 text-sm underline underline-offset-4"
                  >
                    <IconPhone className="size-4" />
                    {profile.emergencyContactPhone}
                  </a>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Nombor belum diisi
                  </span>
                )}
              </FaceRow>

              {profile.isOrganDonor ? (
                <StatusChip tone="positive" label="Penderma organ" />
              ) : null}
            </div>
          </CardFace>

          <CardFace className="absolute inset-0 rotate-y-180">
            <p className="text-xs tracking-wide text-muted-foreground uppercase">
              Di kaunter
            </p>
            <div className="mt-4 space-y-3">
              <FaceRow label="Insurans">
                <span className="text-sm">
                  {profile.insuranceProvider || "Tiada"}
                </span>
              </FaceRow>
              <FaceRow label="Nombor polisi">
                <span className="text-sm tabular-nums">
                  {profile.insurancePolicyNo || "Tiada"}
                </span>
              </FaceRow>
              <FaceRow label="Nota">
                <p className="text-sm whitespace-pre-line">
                  {profile.notes || "Tiada nota."}
                </p>
              </FaceRow>
            </div>
          </CardFace>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onPress={() => setIsFlipped((v) => !v)}
        >
          <IconRotate />
          {isFlipped ? "Tunjuk depan" : "Balikkan kad"}
        </Button>
        {canWrite ? (
          <Button size="sm" onPress={() => setIsEditing(true)}>
            <IconPencil />
            Sunting kad
          </Button>
        ) : null}
      </div>

      <EmergencyDialog
        isOpen={isEditing}
        onOpenChange={setIsEditing}
        circleId={circleId}
        personId={personId}
        profile={profile}
        onSaved={() => {
          setIsEditing(false)
          onSaved()
        }}
      />
    </div>
  )
}

/**
 * Satu muka kad. `backface-hidden` ialah bahagian yang penting: tanpanya, muka
 * belakang terbaca secara terbalik menembusi muka depan.
 */
export function CardFace({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        "min-h-72 rounded-xl border bg-card p-5 text-card-foreground shadow-sm backface-hidden",
        className
      )}
    >
      {children}
    </div>
  )
}

export function FaceRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

/**
 * Borang kad. Tulisan PENUH, bukan tampalan: medan yang dikosongkan pengguna
 * memang bermakna "buang", dan pelayan memperlakukannya begitu.
 */
function EmergencyDialog({
  isOpen,
  onOpenChange,
  circleId,
  personId,
  profile,
  onSaved,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  circleId: string
  personId: string
  profile: HealthProfile
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
    <ResponsiveDialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        // Membuka semula mesti menunjukkan apa yang TERSIMPAN, bukan suntingan
        // yang ditinggalkan separuh jalan.
        if (open) {
          setDraft(profile)
        }
        onOpenChange(open)
      }}
      title="Sunting kad kecemasan"
      description="Medan yang dikosongkan akan dibuang."
      footer={
        <>
          <Button variant="outline" onPress={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            isDisabled={isSaving}
            onPress={() => {
              void save()
            }}
          >
            Simpan
          </Button>
        </>
      }
    >
      <Field>
        <FieldLabel>Jenis darah</FieldLabel>
        <Select
          className="w-full"
          aria-label="Jenis darah"
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
          onChange={(value) => setDraft({ ...draft, isOrganDonor: value })}
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="emergency-name">Kenalan kecemasan</FieldLabel>
        <Input
          id="emergency-name"
          value={draft.emergencyContactName ?? ""}
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
          onChange={(event) =>
            setDraft({ ...draft, insurancePolicyNo: event.target.value })
          }
        />
      </Field>

      <Field>
        <FieldLabel htmlFor="health-notes">Nota</FieldLabel>
        <Textarea
          id="health-notes"
          rows={3}
          value={draft.notes ?? ""}
          onChange={(event) =>
            setDraft({ ...draft, notes: event.target.value })
          }
        />
      </Field>
    </ResponsiveDialog>
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
        <FieldDescription>
          Pilihan - biar kosong kalau tidak pasti.
        </FieldDescription>
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
