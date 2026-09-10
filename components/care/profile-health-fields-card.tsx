"use client"

import { useState } from "react"
import { toast } from "sonner"

import { useCareData } from "@/components/care/care-data-provider"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { formatPersonNameInput } from "@/lib/application/format-person-name"
import {
  BLOOD_TYPE_OPTIONS,
  GENDER_OPTIONS,
  type CareProfile,
} from "@/lib/domain/care"

/**
 * Health fields for someone else's care profile.
 *
 * These were editable only on /my-health, which is your own record - so a
 * parent could not set a child's gender, and the growth chart requires it.
 * The chart would report its preconditions unmet forever with no screen to
 * fix them on.
 *
 * Every field is optional and blank means "not filled in", never "clear this".
 * The columns are COALESCE-patched server-side, so an empty string would erase
 * a stored value rather than leave it alone - which is why the numeric fields
 * parse to undefined and the text fields are only sent when non-empty.
 */
export function ProfileHealthFieldsCard({
  profile,
  canEdit,
}: {
  profile: CareProfile
  canEdit: boolean
}) {
  const { updateProfile } = useCareData()
  const [gender, setGender] = useState(profile.gender ?? "")
  const [bloodType, setBloodType] = useState(profile.bloodType ?? "")
  const [heightCm, setHeightCm] = useState(
    profile.heightCm != null ? String(profile.heightCm) : ""
  )
  const [gestationalAgeWeeks, setGestationalAgeWeeks] = useState(
    profile.gestationalAgeWeeks != null
      ? String(profile.gestationalAgeWeeks)
      : ""
  )
  const [allergySummary, setAllergySummary] = useState(
    profile.allergySummary ?? ""
  )
  const [conditionSummary, setConditionSummary] = useState(
    profile.conditionSummary ?? ""
  )
  const [legalName, setLegalName] = useState(profile.legalName ?? "")
  const [primaryClinic, setPrimaryClinic] = useState(profile.primaryClinic ?? "")
  const [primaryDoctor, setPrimaryDoctor] = useState(profile.primaryDoctor ?? "")
  const [emergencyNote, setEmergencyNote] = useState(
    profile.emergencyNote ?? ""
  )
  const [isSaving, setIsSaving] = useState(false)

  function parseNumber(value: string): number | undefined {
    const trimmed = value.trim()
    if (!trimmed) {
      return undefined
    }
    const parsed = Number(trimmed)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  async function submit() {
    setIsSaving(true)
    try {
      await updateProfile(profile.id, {
        gender: gender || undefined,
        bloodType: bloodType || undefined,
        heightCm: parseNumber(heightCm),
        gestationalAgeWeeks: parseNumber(gestationalAgeWeeks),
        allergySummary: allergySummary.trim() || undefined,
        conditionSummary: conditionSummary.trim() || undefined,
        legalName: formatPersonNameInput(legalName).trim() || undefined,
        primaryClinic: primaryClinic.trim() || undefined,
        primaryDoctor: primaryDoctor.trim() || undefined,
        emergencyNote: emergencyNote.trim() || undefined,
      })
    } catch {
      toast.error("Gagal menyimpan maklumat kesihatan.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Maklumat kesihatan</CardTitle>
        <CardDescription>
          Jantina dan tarikh lahir diperlukan untuk carta tumbesaran.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="profile-legal-name">
              Nama penuh (seperti MyKad)
            </FieldLabel>
            {/* Uppercased as typed, matching the card it reproduces. */}
            <Input
              id="profile-legal-name"
              value={legalName}
              disabled={!canEdit}
              onChange={(event) =>
                setLegalName(formatPersonNameInput(event.target.value))
              }
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Jantina</FieldLabel>
              <Select
                className="w-full"
                value={gender || null}
                onChange={(key) => setGender(String(key ?? ""))}
                placeholder="Pilih jantina"
                isDisabled={!canEdit}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((item) => (
                    <SelectItem key={item.value} id={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Jenis darah</FieldLabel>
              <Select
                className="w-full"
                value={bloodType || null}
                onChange={(key) => setBloodType(String(key ?? ""))}
                placeholder="Pilih jenis darah"
                isDisabled={!canEdit}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BLOOD_TYPE_OPTIONS.map((item) => (
                    <SelectItem key={item.value} id={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="profile-height">Tinggi (cm)</FieldLabel>
              <Input
                id="profile-height"
                inputMode="decimal"
                placeholder="Contoh: 96.5"
                value={heightCm}
                disabled={!canEdit}
                onChange={(event) => setHeightCm(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="profile-ga">
                Umur kandungan semasa lahir (minggu)
              </FieldLabel>
              {/* Only meaningful below 37 weeks, where the growth chart plots
                  at corrected age until roughly two years. A baby born at 32
                  weeks plotted at chronological age reads as far behind when
                  they are not. */}
              <Input
                id="profile-ga"
                inputMode="numeric"
                placeholder="Contoh: 32"
                value={gestationalAgeWeeks}
                disabled={!canEdit}
                onChange={(event) =>
                  setGestationalAgeWeeks(event.target.value)
                }
              />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="profile-allergies">Alahan</FieldLabel>
            <Textarea
              id="profile-allergies"
              className="min-h-20"
              value={allergySummary}
              disabled={!canEdit}
              onChange={(event) => setAllergySummary(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="profile-conditions">
              Keadaan kesihatan
            </FieldLabel>
            <Textarea
              id="profile-conditions"
              className="min-h-20"
              value={conditionSummary}
              disabled={!canEdit}
              onChange={(event) => setConditionSummary(event.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="profile-clinic">Klinik utama</FieldLabel>
              <Input
                id="profile-clinic"
                value={primaryClinic}
                disabled={!canEdit}
                onChange={(event) => setPrimaryClinic(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="profile-doctor">Doktor utama</FieldLabel>
              <Input
                id="profile-doctor"
                value={primaryDoctor}
                disabled={!canEdit}
                onChange={(event) => setPrimaryDoctor(event.target.value)}
              />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="profile-emergency">Nota kecemasan</FieldLabel>
            {/* This one reaches the emergency card, which emergency_viewer can
                read without seeing anything else about the family. */}
            <Textarea
              id="profile-emergency"
              className="min-h-20"
              value={emergencyNote}
              disabled={!canEdit}
              onChange={(event) => setEmergencyNote(event.target.value)}
            />
          </Field>
        </FieldGroup>
      </CardContent>
      {canEdit ? (
        <CardFooter>
          <Button isDisabled={isSaving} onPress={() => void submit()}>
            Simpan
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  )
}
