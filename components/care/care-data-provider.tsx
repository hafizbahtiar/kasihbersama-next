"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { toast } from "sonner"

import {
  type Appointment,
  type AppointmentStatus,
  type CareCircle,
  type CareDocument,
  type CareLog,
  type CarePermissions,
  type CareProfile,
  type CareRole,
  type CareTask,
  type EventAction,
  type Medication,
  type MedicationSchedule,
  type ProfileStatus,
  type TaskStatus,
  type VitalReading,
  HealthFieldKey,
} from "@/lib/domain/care"
import type { CareSnapshot } from "@/lib/domain/care-snapshot"
import { emptyCareSnapshot } from "@/lib/domain/care-snapshot"
import { useBrowserValue } from "@/hooks/use-browser-value"
import { getCareRepository } from "@/lib/composition/care-repository"
import {
  ApiError,
  isApiError,
  messageForApiError,
} from "@/lib/infrastructure/api/errors"

const STORAGE_KEY = "kb-selected-profile"

function readStoredProfileId() {
  if (typeof window === "undefined") {
    return ""
  }
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? ""
  } catch {
    return ""
  }
}

type CareProfileContextValue = {
  profiles: CareProfile[]
  selectedProfileId: string
  selectedProfile: CareProfile | null
  setSelectedProfileId: (id: string) => void
}

type CareDataContextValue = CareProfileContextValue & {
  snapshot: CareSnapshot
  isReady: boolean
  isRefreshing: boolean
  loadError: ApiError | null
  clearLoadError: () => void
  refresh: () => Promise<void>
  createProfile: (input: {
    displayName: string
    relation?: string
    dateOfBirth?: string
    notes?: string
    status?: ProfileStatus
  }) => Promise<CareProfile>
  updateProfile: (id: string, patch: Partial<CareProfile>) => Promise<void>
  archiveProfile: (id: string) => Promise<void>
  unarchiveProfile: (id: string) => Promise<void>
  createCircle: (
    input: Omit<CareCircle, "id" | "profileIds" | "archived">
  ) => Promise<CareCircle>
  updateCircle: (id: string, patch: Partial<CareCircle>) => Promise<void>
  archiveCircle: (id: string) => Promise<void>
  unarchiveCircle: (id: string) => Promise<void>
  linkProfileToCircle: (profileId: string, circleId: string) => Promise<void>
  inviteMember: (
    profileId: string,
    email: string,
    role: CareRole
  ) => Promise<void>
  revokeInvite: (profileId: string, inviteId: string) => Promise<void>
  acceptInvite: (token: string) => Promise<string | null>
  createClaim: (profileId: string, email: string) => Promise<void>
  revokeClaim: (profileId: string, claimId: string) => Promise<void>
  acceptClaim: (token: string) => Promise<string | null>
  updateMemberRole: (
    profileId: string,
    memberUserId: string,
    role: CareRole,
    permissions?: CarePermissions
  ) => Promise<void>
  removeMember: (profileId: string, memberUserId: string) => Promise<void>
  addCareLog: (log: Omit<CareLog, "id">) => Promise<void>
  updateCareLog: (logId: string, patch: Partial<CareLog>) => Promise<void>
  deleteCareLog: (logId: string) => Promise<void>
  addMedication: (medication: Omit<Medication, "id">) => Promise<Medication>
  updateMedication: (id: string, patch: Partial<Medication>) => Promise<void>
  deleteMedication: (id: string) => Promise<void>
  addSchedule: (schedule: Omit<MedicationSchedule, "id">) => Promise<void>
  updateSchedule: (
    id: string,
    patch: Partial<MedicationSchedule>
  ) => Promise<void>
  removeSchedule: (id: string) => Promise<void>
  actOnEvent: (id: string, action: EventAction, note?: string) => Promise<void>
  addAppointment: (appointment: Omit<Appointment, "id">) => Promise<void>
  updateAppointmentStatus: (
    id: string,
    status: AppointmentStatus
  ) => Promise<void>
  deleteAppointment: (id: string) => Promise<void>
  addTask: (task: Omit<CareTask, "id">) => Promise<void>
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  addVital: (vital: Omit<VitalReading, "id">) => Promise<void>
  deleteVital: (id: string) => Promise<void>
  addDocument: (document: Omit<CareDocument, "id">) => Promise<CareDocument>
  uploadDocument: (input: {
    file: File
    title: string
    documentType: CareDocument["documentType"]
    issueDate?: string
    expiryDate?: string
    notes?: string
  }) => Promise<CareDocument>
  getDocumentDownloadUrl: (
    documentId: string
  ) => Promise<{ url: string; filename: string }>
  updateDocument: (id: string, patch: Partial<CareDocument>) => Promise<void>
  removeDocument: (id: string) => Promise<void>
}

const CareProfileContext = createContext<CareProfileContextValue | null>(null)
const CareDataContext = createContext<CareDataContextValue | null>(null)

function defaultProfileId(profiles: CareProfile[]) {
  return (
    profiles.find((item) => item.status === "active")?.id ??
    profiles[0]?.id ??
    ""
  )
}

/**
 * Every health field the API accepts on a profile patch.
 *
 * A Record over HealthFieldKey, not an array with `satisfies`. The array
 * form was tried first and does not guard: `satisfies readonly
 * HealthFieldKey[]` only checks each element *is* a valid key, never that
 * every key is *present* - so dropping "gender" from it compiled cleanly and
 * silently stopped forwarding the field. A Record fails to compile until
 * every key has a value, which is the direction that matters here.
 */
const HEALTH_PATCH_KEY_SET: Record<HealthFieldKey, true> = {
  legalName: true,
  dateOfBirth: true,
  gender: true,
  bloodType: true,
  allergySummary: true,
  conditionSummary: true,
  primaryClinic: true,
  primaryDoctor: true,
  emergencyNote: true,
  heightCm: true,
  gestationalAgeWeeks: true,
}

const HEALTH_PATCH_KEYS = Object.keys(
  HEALTH_PATCH_KEY_SET
) as HealthFieldKey[]

export function CareDataProvider({
  initialSnapshot,
  children,
}: {
  initialSnapshot?: CareSnapshot
  children: ReactNode
}) {
  const repository = useMemo(() => getCareRepository(), [])
  const [snapshot, setSnapshot] = useState(
    initialSnapshot ?? emptyCareSnapshot()
  )
  const [explicitProfileId, setExplicitProfileId] = useState<string | null>(
    null
  )
  const [isReady, setIsReady] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loadError, setLoadError] = useState<ApiError | null>(null)

  // The last selection lives in localStorage, which is browser-only. Read it
  // directly and derive the active id, rather than syncing state in an effect.
  const storedProfileId = useBrowserValue(readStoredProfileId, "")
  const selectedProfileId = useMemo(() => {
    const candidate = explicitProfileId ?? storedProfileId
    if (candidate && snapshot.profiles.some((item) => item.id === candidate)) {
      return candidate
    }
    return defaultProfileId(snapshot.profiles)
  }, [explicitProfileId, snapshot.profiles, storedProfileId])

  const setSelectedProfileId = useCallback((id: string) => {
    setExplicitProfileId(id)
    try {
      window.localStorage.setItem(STORAGE_KEY, id)
    } catch {
      // Blocked storage: the selection still holds for this session.
    }
  }, [])

  const clearLoadError = useCallback(() => {
    setLoadError(null)
  }, [])

  const refresh = useCallback(async () => {
    setIsRefreshing(true)
    setLoadError(null)
    try {
      // A selection that is no longer in the snapshot falls back to the
      // default automatically, because selectedProfileId is derived.
      setSnapshot(await repository.getSnapshot(selectedProfileId))
    } catch (cause) {
      const error = isApiError(cause)
        ? cause
        : new ApiError("Gagal memuatkan data jagaan.", {
            code: "internal",
            status: 500,
          })
      setLoadError(error)
      toast.error(messageForApiError(error))
    } finally {
      setIsRefreshing(false)
      setIsReady(true)
    }
  }, [repository, selectedProfileId])

  useEffect(() => {
    // Load-on-mount: the loader flips isRefreshing synchronously before its
    // first await, which the compiler rule flags. Safe here - it is one extra
    // render on mount, and deferring the flip would show a stale "loaded"
    // frame first.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh()
  }, [refresh, selectedProfileId])

  const selectedProfile =
    snapshot.profiles.find((item) => item.id === selectedProfileId) ?? null

  const runMutation = useCallback(
    async <T,>(action: () => Promise<T>, successMessage?: string) => {
      try {
        setLoadError(null)
        const result = await action()
        await refresh()
        if (successMessage) {
          toast.success(successMessage)
        }
        return result
      } catch (cause) {
        const error = isApiError(cause)
          ? cause
          : new ApiError("Tindakan gagal.", { code: "internal", status: 500 })
        toast.error(messageForApiError(error))
        throw error
      }
    },
    [refresh]
  )

  const voidMutation = useCallback(
    (action: () => Promise<unknown>, successMessage?: string) =>
      runMutation(action, successMessage).then(() => undefined),
    [runMutation]
  )

  const profileContext = useMemo<CareProfileContextValue>(
    () => ({
      profiles: snapshot.profiles,
      selectedProfileId,
      selectedProfile,
      setSelectedProfileId,
    }),
    [
      selectedProfile,
      selectedProfileId,
      setSelectedProfileId,
      snapshot.profiles,
    ]
  )

  const value = useMemo<CareDataContextValue>(() => {
    const profileId = selectedProfileId

    return {
      ...profileContext,
      snapshot,
      isReady,
      isRefreshing,
      loadError,
      clearLoadError,
      refresh,
      async createProfile(input) {
        const profile = await runMutation(() =>
          repository.createProfile({
            displayName: input.displayName,
            dateOfBirth: input.dateOfBirth,
          })
        )
        setSelectedProfileId(profile.id)
        return profile
      },
      updateProfile(id, patch) {
        // Reactivating is unarchiveProfile, not a status patch: the API's
        // PATCH body has never carried a status field, so the branch that
        // used to say "Profil diaktifkan semula." here was reporting a save
        // that never left the client.
        const message = "Profil disimpan."
        // Forwarded key by key because relation, notes and circleId are
        // mock-only shapes the API does not accept. The health fields used to
        // be missing from this list, so a form could collect a gender or a
        // blood type, report success, and send nothing - the same
        // "save works, refresh clears the form" failure the mapper layer
        // already guards against, one layer up.
        //
        // HEALTH_PATCH_KEYS is exhaustive over HealthFieldKey, so a field
        // added to the domain type fails to compile until it is forwarded.
        const apiPatch: Partial<CareProfile> = {}
        if (patch.displayName !== undefined) {
          apiPatch.displayName = patch.displayName
        }
        for (const key of HEALTH_PATCH_KEYS) {
          const value = patch[key]
          if (value !== undefined) {
            Object.assign(apiPatch, { [key]: value })
          }
        }
        return voidMutation(
          () => repository.updateProfile(id, apiPatch),
          message
        )
      },
      unarchiveProfile(id) {
        return voidMutation(
          () => repository.unarchiveProfile(id),
          "Profil diaktifkan semula."
        )
      },
      archiveProfile(id) {
        return voidMutation(
          () => repository.archiveProfile(id),
          "Profil diarkibkan."
        )
      },
      createCircle(input) {
        return runMutation(() => repository.createCircle(input))
      },
      updateCircle(id, patch) {
        // The archived:false branch that used to live here reported
        // "Kumpulan diaktifkan semula." while sending nothing - the PATCH
        // body carries no status and its query is scoped to active rows. That
        // toast is what kept the bug invisible. Restoring is unarchiveCircle.
        return voidMutation(
          () => repository.updateCircle(id, patch),
          "Kumpulan dikemas kini."
        )
      },
      unarchiveCircle(id) {
        return voidMutation(
          () => repository.unarchiveCircle(id),
          "Kumpulan diaktifkan semula."
        )
      },
      archiveCircle(id) {
        return voidMutation(
          () => repository.archiveCircle(id),
          "Kumpulan diarkibkan."
        )
      },
      linkProfileToCircle(profileId, circleId) {
        return voidMutation(
          () => repository.linkProfileToCircle(profileId, circleId),
          "Profil dikaitkan."
        )
      },
      inviteMember(profileId, email, role) {
        return voidMutation(
          () => repository.inviteMember(profileId, email, role),
          "Jemputan dihantar."
        )
      },
      revokeInvite(profileId, inviteId) {
        return voidMutation(
          () => repository.revokeInvite(profileId, inviteId),
          "Jemputan dibatalkan."
        )
      },
      async acceptInvite(token) {
        try {
          const nextProfileId = await runMutation(
            () => repository.acceptInvite(token),
            "Jemputan diterima."
          )
          setSelectedProfileId(nextProfileId)
          return nextProfileId
        } catch {
          return null
        }
      },
      createClaim(profileId, email) {
        return voidMutation(
          () => repository.createClaim(profileId, email),
          "Tuntutan dihantar."
        )
      },
      revokeClaim(profileId, claimId) {
        return voidMutation(
          () => repository.revokeClaim(profileId, claimId),
          "Tuntutan dibatalkan."
        )
      },
      async acceptClaim(token) {
        try {
          const nextProfileId = await runMutation(
            () => repository.acceptClaim(token),
            "Tuntutan diterima."
          )
          setSelectedProfileId(nextProfileId)
          return nextProfileId
        } catch {
          return null
        }
      },
      updateMemberRole(profileId, memberUserId, role, permissions) {
        return voidMutation(() =>
          repository.updateMemberRole(
            profileId,
            memberUserId,
            role,
            permissions
          )
        )
      },
      removeMember(profileId, memberUserId) {
        return voidMutation(
          () => repository.removeMember(profileId, memberUserId),
          "Ahli dikeluarkan."
        )
      },
      addCareLog(log) {
        if (!profileId) {
          return Promise.reject(new Error("Profil tidak dipilih."))
        }
        return voidMutation(
          () =>
            repository.createCareLog(profileId, {
              logType: log.logType,
              title: log.title,
              body: log.body,
              visibility: log.visibility,
              occurredAt: log.occurredAt,
              createdBy: log.createdBy,
            }),
          "Log ditambah."
        )
      },
      updateCareLog(logId, patch) {
        if (!profileId) {
          return Promise.reject(new Error("Profil tidak dipilih."))
        }
        return voidMutation(() =>
          repository.updateCareLog(profileId, logId, patch)
        )
      },
      deleteCareLog(logId) {
        if (!profileId) {
          return Promise.reject(new Error("Profil tidak dipilih."))
        }
        return voidMutation(
          () => repository.deleteCareLog(profileId, logId),
          "Log dipadam."
        )
      },
      async addMedication(medication) {
        if (!profileId) {
          return Promise.reject(new Error("Profil tidak dipilih."))
        }
        return runMutation(() =>
          repository.createMedication(profileId, medication)
        )
      },
      updateMedication(id, patch) {
        if (!profileId) {
          return Promise.reject(new Error("Profil tidak dipilih."))
        }
        return voidMutation(() =>
          repository.updateMedication(profileId, id, patch)
        )
      },
      deleteMedication(id) {
        if (!profileId) {
          return Promise.reject(new Error("Profil tidak dipilih."))
        }
        return voidMutation(
          () => repository.deleteMedication(profileId, id),
          "Ubat dipadam."
        )
      },
      addSchedule(schedule) {
        if (!profileId) {
          return Promise.reject(new Error("Profil tidak dipilih."))
        }
        return voidMutation(() =>
          repository.createSchedule(profileId, schedule.medicationId, schedule)
        )
      },
      updateSchedule(id, patch) {
        if (!profileId) {
          return Promise.reject(new Error("Profil tidak dipilih."))
        }
        const schedule = snapshot.schedules.find((item) => item.id === id)
        if (!schedule) {
          return Promise.resolve()
        }
        return voidMutation(() =>
          repository.updateSchedule(profileId, schedule.medicationId, id, patch)
        )
      },
      removeSchedule(id) {
        if (!profileId) {
          return Promise.reject(new Error("Profil tidak dipilih."))
        }
        const schedule = snapshot.schedules.find((item) => item.id === id)
        if (!schedule) {
          return Promise.resolve()
        }
        return voidMutation(
          () => repository.deleteSchedule(profileId, schedule.medicationId, id),
          "Jadual dipadam."
        )
      },
      actOnEvent(id, action, note) {
        if (!profileId) {
          return Promise.reject(new Error("Profil tidak dipilih."))
        }
        return voidMutation(
          () => repository.actOnEvent(profileId, id, action, note),
          "Dos dikemas kini."
        )
      },
      addAppointment(appointment) {
        if (!profileId) {
          return Promise.reject(new Error("Profil tidak dipilih."))
        }
        return voidMutation(
          () => repository.createAppointment(profileId, appointment),
          "Temujanji ditambah."
        )
      },
      updateAppointmentStatus(id, status) {
        if (!profileId) {
          return Promise.reject(new Error("Profil tidak dipilih."))
        }
        const appointment = snapshot.appointments.find((item) => item.id === id)
        if (!appointment) {
          return Promise.resolve()
        }
        return voidMutation(
          () =>
            repository.updateAppointment(profileId, id, {
              ...appointment,
              status,
            }),
          "Status temujanji dikemas kini."
        )
      },
      deleteAppointment(id) {
        if (!profileId) {
          return Promise.reject(new Error("Profil tidak dipilih."))
        }
        return voidMutation(
          () => repository.deleteAppointment(profileId, id),
          "Temujanji dipadam."
        )
      },
      addTask(task) {
        if (!profileId) {
          return Promise.reject(new Error("Profil tidak dipilih."))
        }
        return voidMutation(
          () => repository.createTask(profileId, task),
          "Tugasan ditambah."
        )
      },
      updateTaskStatus(id, status) {
        if (!profileId) {
          return Promise.reject(new Error("Profil tidak dipilih."))
        }
        const task = snapshot.tasks.find((item) => item.id === id)
        if (!task) {
          return Promise.resolve()
        }
        const message =
          status === "completed"
            ? "Tugasan selesai."
            : status === "cancelled"
              ? "Tugasan dibatalkan."
              : "Status tugasan dikemas kini."
        return voidMutation(
          () => repository.updateTask(profileId, id, { ...task, status }),
          message
        )
      },
      deleteTask(id) {
        if (!profileId) {
          return Promise.reject(new Error("Profil tidak dipilih."))
        }
        return voidMutation(
          () => repository.deleteTask(profileId, id),
          "Tugasan dipadam."
        )
      },
      addVital(vital) {
        if (!profileId) {
          return Promise.reject(new Error("Profil tidak dipilih."))
        }
        return voidMutation(() => repository.createVital(profileId, vital))
      },
      deleteVital(id) {
        if (!profileId) {
          return Promise.reject(new Error("Profil tidak dipilih."))
        }
        return voidMutation(
          () => repository.deleteVital(profileId, id),
          "Bacaan vital dipadam."
        )
      },
      async addDocument(document) {
        if (!profileId) {
          return Promise.reject(new Error("Profil tidak dipilih."))
        }
        return runMutation(
          () => repository.createDocument(profileId, document),
          "Dokumen ditambah."
        )
      },
      updateDocument(id, patch) {
        if (!profileId) {
          return Promise.reject(new Error("Profil tidak dipilih."))
        }
        return voidMutation(() =>
          repository.updateDocument(profileId, id, patch)
        )
      },
      removeDocument(id) {
        if (!profileId) {
          return Promise.reject(new Error("Profil tidak dipilih."))
        }
        return voidMutation(
          () => repository.deleteDocument(profileId, id),
          "Dokumen dipadam."
        )
      },
      async uploadDocument(input) {
        if (!profileId) {
          return Promise.reject(new Error("Profil tidak dipilih."))
        }
        return runMutation(
          () => repository.uploadDocument(profileId, input.file, input),
          "Dokumen dimuat naik."
        )
      },
      getDocumentDownloadUrl(documentId) {
        if (!profileId) {
          return Promise.reject(new Error("Profil tidak dipilih."))
        }
        return repository.getDocumentDownloadUrl(profileId, documentId)
      },
    }
  }, [
    clearLoadError,
    isReady,
    isRefreshing,
    loadError,
    profileContext,
    refresh,
    repository,
    runMutation,
    voidMutation,
    selectedProfileId,
    setSelectedProfileId,
    snapshot,
  ])

  return (
    <CareProfileContext.Provider value={profileContext}>
      <CareDataContext.Provider value={value}>
        {children}
      </CareDataContext.Provider>
    </CareProfileContext.Provider>
  )
}

export function useCareProfile() {
  const context = useContext(CareProfileContext)
  if (!context) {
    throw new Error("CareDataProvider diperlukan.")
  }
  return context
}

export function useCareData() {
  const context = useContext(CareDataContext)
  if (!context) {
    throw new Error("CareDataProvider diperlukan.")
  }
  return context
}

export function useProfileRecords<T extends { profileId: string }>(
  records: T[]
) {
  const { selectedProfileId } = useCareProfile()
  return records.filter((item) => item.profileId === selectedProfileId)
}
