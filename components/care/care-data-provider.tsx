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
  adminPermissions,
  type Appointment,
  type AppointmentStatus,
  type CareClaim,
  type CareCircle,
  type CareDocument,
  type CareInvite,
  type CareLog,
  type CareMember,
  type CarePermissions,
  type CareProfile,
  type CareRole,
  type CareTask,
  type EventAction,
  type Medication,
  type MedicationEvent,
  type MedicationSchedule,
  type ProfileStatus,
  type TaskStatus,
  type VitalReading,
} from "@/lib/domain/care"
import type { CareSnapshot } from "@/lib/domain/care-snapshot"
import { emptyCareSnapshot } from "@/lib/domain/care-snapshot"
import { nextId } from "@/lib/application/care-format"
import { useBrowserValue } from "@/hooks/use-browser-value"
import { getCareRepository } from "@/lib/composition/care-repository"
import { isMockDataEnabled } from "@/lib/composition/config"
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
  updateCareLog: (
    logId: string,
    patch: Partial<CareLog>
  ) => Promise<void>
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
  addDocument: (
    document: Omit<CareDocument, "id">
  ) => Promise<CareDocument>
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
  return profiles.find((item) => item.status === "active")?.id ?? profiles[0]?.id ?? ""
}

export function CareDataProvider({
  initialSnapshot,
  children,
}: {
  initialSnapshot?: CareSnapshot
  children: ReactNode
}) {
  const apiMode = !isMockDataEnabled()
  const repository = useMemo(() => getCareRepository(), [])
  const [snapshot, setSnapshot] = useState(initialSnapshot ?? emptyCareSnapshot())
  const [explicitProfileId, setExplicitProfileId] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(!apiMode)
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
    if (!apiMode) {
      return
    }
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
  }, [apiMode, repository, selectedProfileId])

  useEffect(() => {
    if (apiMode) {
      // Load-on-mount: the loader flips isLoading synchronously before its first
      // await, which the compiler rule flags. Safe here - it is one extra render
      // on mount, and the alternative (deferring the flip) would show a stale
      // "loaded" frame first.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void refresh()
    }
  }, [apiMode, refresh, selectedProfileId])

  const selectedProfile =
    snapshot.profiles.find((item) => item.id === selectedProfileId) ?? null

  const runMutation = useCallback(
    async <T,>(action: () => Promise<T>, successMessage?: string) => {
      try {
        setLoadError(null)
        const result = await action()
        if (apiMode) {
          await refresh()
        }
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
    [apiMode, refresh]
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
    [selectedProfile, selectedProfileId, setSelectedProfileId, snapshot.profiles]
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
        if (apiMode) {
          const profile = await runMutation(() =>
            repository.createProfile({
              displayName: input.displayName,
            })
          )
          setSelectedProfileId(profile.id)
          return profile
        }
        const profile: CareProfile = {
          displayName: input.displayName,
          relation: input.relation ?? "",
          dateOfBirth: input.dateOfBirth ?? "",
          notes: input.notes,
          id: nextId("cp"),
          role: "guardian_admin",
          permissions: adminPermissions(),
          status: input.status ?? "active",
        }
        setSnapshot((current) => ({
          ...current,
          profiles: [profile, ...current.profiles],
        }))
        setSelectedProfileId(profile.id)
        return profile
      },
      updateProfile(id, patch) {
        if (apiMode) {
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
          return voidMutation(() => repository.updateProfile(id, apiPatch), message)
        }
        setSnapshot((current) => ({
          ...current,
          profiles: current.profiles.map((item) =>
            item.id === id ? { ...item, ...patch } : item
          ),
        }))
        return Promise.resolve()
      },
      archiveProfile(id) {
        if (apiMode) {
          return voidMutation(
            () => repository.archiveProfile(id),
            "Profil diarkibkan."
          )
        }
        setSnapshot((current) => ({
          ...current,
          profiles: current.profiles.map((item) =>
            item.id === id ? { ...item, status: "archived" } : item
          ),
        }))
        return Promise.resolve()
      },
      createCircle(input) {
        if (apiMode) {
          return runMutation(() => repository.createCircle(input))
        }
        const circle: CareCircle = {
          id: nextId("circle"),
          profileIds: [],
          ...input,
        }
        setSnapshot((current) => ({
          ...current,
          circles: [circle, ...current.circles],
        }))
        return Promise.resolve(circle)
      },
      updateCircle(id, patch) {
        if (apiMode) {
          return voidMutation(
            () => repository.updateCircle(id, patch),
            patch.archived === false ? "Kumpulan diaktifkan semula." : "Kumpulan dikemas kini."
          )
        }
        setSnapshot((current) => ({
          ...current,
          circles: current.circles.map((item) =>
            item.id === id ? { ...item, ...patch } : item
          ),
        }))
        return Promise.resolve()
      },
      archiveCircle(id) {
        if (apiMode) {
          return voidMutation(
            () => repository.archiveCircle(id),
            "Kumpulan diarkibkan."
          )
        }
        setSnapshot((current) => ({
          ...current,
          circles: current.circles.map((item) =>
            item.id === id ? { ...item, archived: true } : item
          ),
        }))
        return Promise.resolve()
      },
      linkProfileToCircle(profileId, circleId) {
        if (apiMode) {
          return voidMutation(
            () => repository.linkProfileToCircle(profileId, circleId),
            "Profil dikaitkan."
          )
        }
        setSnapshot((current) => ({
          ...current,
          profiles: current.profiles.map((item) =>
            item.id === profileId ? { ...item, circleId } : item
          ),
        }))
        return Promise.resolve()
      },
      inviteMember(profileId, email, role) {
        if (apiMode) {
          return voidMutation(
            () => repository.inviteMember(profileId, email, role),
            "Jemputan dihantar."
          )
        }
        const invite: CareInvite = {
          id: nextId("inv"),
          profileId,
          email,
          role,
          status: "pending",
          token: nextId("invite"),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
        }
        setSnapshot((current) => ({
          ...current,
          invites: [invite, ...current.invites],
        }))
        return Promise.resolve()
      },
      revokeInvite(profileId, inviteId) {
        if (apiMode) {
          return voidMutation(
            () => repository.revokeInvite(profileId, inviteId),
            "Jemputan dibatalkan."
          )
        }
        setSnapshot((current) => ({
          ...current,
          invites: current.invites.map((item) =>
            item.id === inviteId ? { ...item, status: "revoked" } : item
          ),
        }))
        return Promise.resolve()
      },
      async acceptInvite(token) {
        if (apiMode) {
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
        }
        const invite = snapshot.invites.find(
          (item) => item.token === token && item.status === "pending"
        )
        if (!invite) {
          return null
        }
        setSnapshot((current) => ({
          ...current,
          invites: current.invites.map((item) =>
            item.id === invite.id ? { ...item, status: "accepted" } : item
          ),
        }))
        return invite.profileId
      },
      createClaim(profileId, email) {
        if (apiMode) {
          return voidMutation(
            () => repository.createClaim(profileId, email),
            "Tuntutan dihantar."
          )
        }
        const claim: CareClaim = {
          id: nextId("claim"),
          profileId,
          email,
          status: "pending",
          token: nextId("claimtok"),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
        }
        setSnapshot((current) => ({
          ...current,
          claims: [claim, ...current.claims],
        }))
        return Promise.resolve()
      },
      revokeClaim(profileId, claimId) {
        if (apiMode) {
          return voidMutation(
            () => repository.revokeClaim(profileId, claimId),
            "Tuntutan dibatalkan."
          )
        }
        setSnapshot((current) => ({
          ...current,
          claims: current.claims.map((item) =>
            item.id === claimId ? { ...item, status: "revoked" } : item
          ),
        }))
        return Promise.resolve()
      },
      async acceptClaim(token) {
        if (apiMode) {
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
        }
        const claim = snapshot.claims.find(
          (item) => item.token === token && item.status === "pending"
        )
        if (!claim) {
          return null
        }
        setSnapshot((current) => ({
          ...current,
          claims: current.claims.map((item) =>
            item.id === claim.id ? { ...item, status: "accepted" } : item
          ),
        }))
        return claim.profileId
      },
      updateMemberRole(profileId, memberUserId, role, permissions) {
        if (apiMode) {
          return voidMutation(() =>
            repository.updateMemberRole(profileId, memberUserId, role, permissions)
          )
        }
        setSnapshot((current) => ({
          ...current,
          members: current.members.map((item) =>
            item.userId === memberUserId && item.profileId === profileId
              ? { ...item, role, permissions: permissions ?? item.permissions }
              : item
          ),
        }))
        return Promise.resolve()
      },
      removeMember(profileId, memberUserId) {
        if (apiMode) {
          return voidMutation(
            () => repository.removeMember(profileId, memberUserId),
            "Ahli dikeluarkan."
          )
        }
        setSnapshot((current) => ({
          ...current,
          members: current.members.filter(
            (item) =>
              !(item.profileId === profileId && item.userId === memberUserId)
          ),
        }))
        return Promise.resolve()
      },
      addCareLog(log) {
        if (apiMode && profileId) {
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
        }
        setSnapshot((current) => ({
          ...current,
          logs: [{ id: nextId("log"), ...log }, ...current.logs],
        }))
        return Promise.resolve()
      },
      updateCareLog(logId, patch) {
        if (apiMode && profileId) {
          return voidMutation(() =>
            repository.updateCareLog(profileId, logId, patch)
          )
        }
        setSnapshot((current) => ({
          ...current,
          logs: current.logs.map((item) =>
            item.id === logId ? { ...item, ...patch } : item
          ),
        }))
        return Promise.resolve()
      },
      deleteCareLog(logId) {
        if (apiMode && profileId) {
          return voidMutation(
            () => repository.deleteCareLog(profileId, logId),
            "Log dipadam."
          )
        }
        setSnapshot((current) => ({
          ...current,
          logs: current.logs.filter((item) => item.id !== logId),
        }))
        return Promise.resolve()
      },
      async addMedication(medication) {
        if (apiMode) {
          if (!profileId) {
            return Promise.reject(new Error("Profil tidak dipilih."))
          }
          return runMutation(() =>
            repository.createMedication(profileId, medication)
          )
        }
        const created = { id: nextId("med"), ...medication }
        setSnapshot((current) => ({
          ...current,
          medications: [created, ...current.medications],
        }))
        return created
      },
      updateMedication(id, patch) {
        if (apiMode && profileId) {
          return voidMutation(() =>
            repository.updateMedication(profileId, id, patch)
          )
        }
        setSnapshot((current) => ({
          ...current,
          medications: current.medications.map((item) =>
            item.id === id ? { ...item, ...patch } : item
          ),
        }))
        return Promise.resolve()
      },
      deleteMedication(id) {
        if (apiMode && profileId) {
          return voidMutation(
            () => repository.deleteMedication(profileId, id),
            "Ubat dipadam."
          )
        }
        setSnapshot((current) => ({
          ...current,
          medications: current.medications.filter((item) => item.id !== id),
        }))
        return Promise.resolve()
      },
      addSchedule(schedule) {
        if (apiMode && profileId) {
          return voidMutation(() =>
            repository.createSchedule(profileId, schedule.medicationId, schedule)
          )
        }
        setSnapshot((current) => ({
          ...current,
          schedules: [{ id: nextId("sch"), ...schedule }, ...current.schedules],
        }))
        return Promise.resolve()
      },
      updateSchedule(id, patch) {
        if (apiMode && profileId) {
          const schedule = snapshot.schedules.find((item) => item.id === id)
          if (!schedule) {
            return Promise.resolve()
          }
          return voidMutation(() =>
            repository.updateSchedule(
              profileId,
              schedule.medicationId,
              id,
              patch
            )
          )
        }
        setSnapshot((current) => ({
          ...current,
          schedules: current.schedules.map((item) =>
            item.id === id ? { ...item, ...patch } : item
          ),
        }))
        return Promise.resolve()
      },
      removeSchedule(id) {
        if (apiMode && profileId) {
          const schedule = snapshot.schedules.find((item) => item.id === id)
          if (!schedule) {
            return Promise.resolve()
          }
          return voidMutation(
            () =>
              repository.deleteSchedule(
                profileId,
                schedule.medicationId,
                id
              ),
            "Jadual dipadam."
          )
        }
        setSnapshot((current) => ({
          ...current,
          schedules: current.schedules.filter((item) => item.id !== id),
        }))
        return Promise.resolve()
      },
      actOnEvent(id, action, note) {
        if (apiMode && profileId) {
          return voidMutation(
            () => repository.actOnEvent(profileId, id, action, note),
            "Dos dikemas kini."
          )
        }
        setSnapshot((current) => ({
          ...current,
          events: current.events.map((item) =>
            item.id === id ? { ...item, actionStatus: action, note } : item
          ),
        }))
        return Promise.resolve()
      },
      addAppointment(appointment) {
        if (apiMode && profileId) {
          return voidMutation(
            () => repository.createAppointment(profileId, appointment),
            "Temujanji ditambah."
          )
        }
        setSnapshot((current) => ({
          ...current,
          appointments: [
            { id: nextId("apt"), ...appointment },
            ...current.appointments,
          ],
        }))
        return Promise.resolve()
      },
      updateAppointmentStatus(id, status) {
        if (apiMode && profileId) {
          const appointment = snapshot.appointments.find((item) => item.id === id)
          if (!appointment) {
            return Promise.resolve()
          }
          return voidMutation(
            () =>
              repository.updateAppointment(profileId, id, { ...appointment, status }),
            "Status temujanji dikemas kini."
          )
        }
        setSnapshot((current) => ({
          ...current,
          appointments: current.appointments.map((item) =>
            item.id === id ? { ...item, status } : item
          ),
        }))
        return Promise.resolve()
      },
      deleteAppointment(id) {
        if (apiMode && profileId) {
          return voidMutation(
            () => repository.deleteAppointment(profileId, id),
            "Temujanji dipadam."
          )
        }
        setSnapshot((current) => ({
          ...current,
          appointments: current.appointments.filter((item) => item.id !== id),
        }))
        return Promise.resolve()
      },
      addTask(task) {
        if (apiMode && profileId) {
          return voidMutation(
            () => repository.createTask(profileId, task),
            "Tugasan ditambah."
          )
        }
        setSnapshot((current) => ({
          ...current,
          tasks: [{ id: nextId("task"), ...task }, ...current.tasks],
        }))
        return Promise.resolve()
      },
      updateTaskStatus(id, status) {
        if (apiMode && profileId) {
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
        }
        setSnapshot((current) => ({
          ...current,
          tasks: current.tasks.map((item) =>
            item.id === id ? { ...item, status } : item
          ),
        }))
        return Promise.resolve()
      },
      deleteTask(id) {
        if (apiMode && profileId) {
          return voidMutation(
            () => repository.deleteTask(profileId, id),
            "Tugasan dipadam."
          )
        }
        setSnapshot((current) => ({
          ...current,
          tasks: current.tasks.filter((item) => item.id !== id),
        }))
        return Promise.resolve()
      },
      addVital(vital) {
        if (apiMode && profileId) {
          return voidMutation(() => repository.createVital(profileId, vital))
        }
        setSnapshot((current) => ({
          ...current,
          vitals: [{ id: nextId("vit"), ...vital }, ...current.vitals],
        }))
        return Promise.resolve()
      },
      deleteVital(id) {
        if (apiMode && profileId) {
          return voidMutation(
            () => repository.deleteVital(profileId, id),
            "Bacaan vital dipadam."
          )
        }
        setSnapshot((current) => ({
          ...current,
          vitals: current.vitals.filter((item) => item.id !== id),
        }))
        return Promise.resolve()
      },
      async addDocument(document) {
        if (apiMode) {
          if (!profileId) {
            return Promise.reject(new Error("Profil tidak dipilih."))
          }
          return runMutation(
            () => repository.createDocument(profileId, document),
            "Dokumen ditambah."
          )
        }
        const created = { id: nextId("doc"), ...document }
        setSnapshot((current) => ({
          ...current,
          documents: [created, ...current.documents],
        }))
        return created
      },
      updateDocument(id, patch) {
        if (apiMode && profileId) {
          return voidMutation(() =>
            repository.updateDocument(profileId, id, patch)
          )
        }
        setSnapshot((current) => ({
          ...current,
          documents: current.documents.map((item) =>
            item.id === id ? { ...item, ...patch } : item
          ),
        }))
        return Promise.resolve()
      },
      removeDocument(id) {
        if (apiMode && profileId) {
          return voidMutation(
            () => repository.deleteDocument(profileId, id),
            "Dokumen dipadam."
          )
        }
        setSnapshot((current) => ({
          ...current,
          documents: current.documents.filter((item) => item.id !== id),
        }))
        return Promise.resolve()
      },
      async uploadDocument(input) {
        if (apiMode) {
          if (!profileId) {
            return Promise.reject(new Error("Profil tidak dipilih."))
          }
          return runMutation(
            () => repository.uploadDocument(profileId, input.file, input),
            "Dokumen dimuat naik."
          )
        }
        const created: CareDocument = {
          id: nextId("doc"),
          profileId: profileId ?? "",
          title: input.title,
          documentType: input.documentType,
          filename: input.file.name,
          mimeType: input.file.type,
          sizeBytes: input.file.size,
          issueDate: input.issueDate,
          expiryDate: input.expiryDate,
          notes: input.notes,
          createdAt: new Date().toISOString(),
          uploadState: "done",
          uploadProgress: 100,
        }
        setSnapshot((current) => ({
          ...current,
          documents: [created, ...current.documents],
        }))
        return created
      },
      getDocumentDownloadUrl(documentId) {
        if (!profileId) {
          return Promise.reject(new Error("Profil tidak dipilih."))
        }
        return repository.getDocumentDownloadUrl(profileId, documentId)
      },
    }
  }, [
    apiMode,
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
      <CareDataContext.Provider value={value}>{children}</CareDataContext.Provider>
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
