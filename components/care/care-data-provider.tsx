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
  createCircle: (
    input: Omit<CareCircle, "id" | "profileIds" | "archived">
  ) => Promise<CareCircle>
  updateCircle: (id: string, patch: Partial<CareCircle>) => Promise<void>
  archiveCircle: (id: string) => Promise<void>
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
        setLoadError(error)
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
      refresh,
      async createProfile(input) {
        const profile = await runMutation(() =>
          repository.createProfile({
            displayName: input.displayName,
          })
        )
        setSelectedProfileId(profile.id)
        return profile
      },
      updateProfile(id, patch) {
        const message =
          patch.status === "active"
            ? "Profil diaktifkan semula."
            : "Profil disimpan."
        const apiPatch: Partial<CareProfile> = {}
        if (patch.displayName !== undefined) {
          apiPatch.displayName = patch.displayName
        }
        if (patch.status !== undefined) {
          apiPatch.status = patch.status
        }
        return voidMutation(
          () => repository.updateProfile(id, apiPatch),
          message
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
        return voidMutation(
          () => repository.updateCircle(id, patch),
          patch.archived === false
            ? "Kumpulan diaktifkan semula."
            : "Kumpulan dikemas kini."
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
