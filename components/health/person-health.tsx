"use client"

import { useState } from "react"
import {
  IconAlertTriangle,
  IconHeartbeat,
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
import { Textarea } from "@/components/ui/textarea"
import { usePersonHealth } from "@/hooks/use-person-health"
import { useDisplayFormat } from "@/lib/application/display-preferences"
import { getHealthRepository } from "@/lib/composition/health-repository"
import {
  ALLERGY_SEVERITIES,
  BLOOD_TYPES,
  CONDITION_STATUS_LABELS,
  SEVERITY_LABELS,
  type AllergySeverity,
  type BloodType,
  type ConditionStatus,
  type HealthAllergy,
  type HealthCondition,
} from "@/lib/domain/health"
import { isApiError, messageForApiError } from "@/lib/infrastructure/api/errors"

/** Nada cip mengikut MAKNA: sembuh ialah sejarah, aktif ialah sesuatu yang berjalan. */
const STATUS_TONE: Record<ConditionStatus, StatusTone> = {
  active: "attention",
  managed: "positive",
  resolved: "neutral",
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
  const { date } = useDisplayFormat()
  const repo = getHealthRepository()

  const [busy, setBusy] = useState(false)
  const [isConditionOpen, setIsConditionOpen] = useState(false)
  const [isAllergyOpen, setIsAllergyOpen] = useState(false)
  const [conditionTarget, setConditionTarget] =
    useState<HealthCondition | null>(null)
  const [allergyTarget, setAllergyTarget] = useState<HealthAllergy | null>(null)

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

  return (
    <div className="flex flex-col gap-5">
      <AsyncStateBanner
        error={health.error}
        onRetry={() => {
          void health.reload()
        }}
        label="Gagal memuatkan rekod kesihatan."
      />

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

      <DataTable
        columns={conditionColumns}
        data={health.conditions}
        getRowId={(row) => row.id}
        isLoading={health.isLoading}
        pageSize={5}
        addLabel="Rekod keadaan"
        onAdd={canWrite ? () => setIsConditionOpen(true) : undefined}
        toolbarStart={
          <div className="space-y-1">
            <h2 className="font-heading text-lg tracking-tight">Keadaan</h2>
            <p className="text-sm text-muted-foreground">
              Apa yang dia ada sekarang. Yang sembuh turun ke bawah senarai.
            </p>
          </div>
        }
        emptyIcon={<IconHeartbeat />}
        emptyTitle="Tiada keadaan direkodkan"
        emptyDescription="Kencing manis, darah tinggi, asma - apa sahaja yang perlu diingat."
      />

      <DataTable
        columns={allergyColumns}
        data={health.allergies}
        getRowId={(row) => row.id}
        isLoading={health.isLoading}
        pageSize={5}
        addLabel="Rekod alahan"
        onAdd={canWrite ? () => setIsAllergyOpen(true) : undefined}
        toolbarStart={
          <div className="space-y-1">
            <h2 className="font-heading text-lg tracking-tight">Alahan</h2>
            <p className="text-sm text-muted-foreground">
              Paling teruk di baris pertama - senarai ini dibaca semasa tergesa.
            </p>
          </div>
        }
        emptyIcon={<IconAlertTriangle />}
        emptyTitle="Tiada alahan direkodkan"
        emptyDescription="Kosong bermakna belum direkod, bukan tiada alahan."
      />

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
    </div>
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
