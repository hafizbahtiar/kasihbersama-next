export function required(value: string, label: string): string | null {
  if (!value.trim()) {
    return `${label} diperlukan.`
  }
  return null
}

export function parseDateTimeLocal(value: string): string | null {
  if (!value.trim()) {
    return null
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }
  return parsed.toISOString()
}

export function parseDate(value: string): string | null {
  if (!value.trim()) {
    return null
  }
  const parsed = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }
  return value
}

export function parsePositiveNumber(
  value: string,
  label: string
): { value: number } | { error: string } {
  if (!value.trim()) {
    return { error: `${label} diperlukan.` }
  }
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return { error: `${label} mesti nombor positif.` }
  }
  return { value: parsed }
}

export function validateDateRange(
  start: string,
  end: string,
  endLabel = "Tarikh tamat"
): string | null {
  if (!start || !end) {
    return null
  }
  if (end < start) {
    return `${endLabel} mesti selepas tarikh mula.`
  }
  return null
}

export function validateTime(value: string, label = "Masa"): string | null {
  if (!value.trim()) {
    return `${label} diperlukan.`
  }
  if (!/^\d{2}:\d{2}$/.test(value)) {
    return `${label} tidak sah.`
  }
  return null
}

export function validateDosage(value: string): string | null {
  if (!value.trim()) {
    return "Dos diperlukan."
  }
  if (value.trim().length > 64) {
    return "Dos terlalu panjang."
  }
  return null
}

export function validateUploadSize(
  sizeBytes: number,
  maxMb: number
): string | null {
  if (sizeBytes > maxMb * 1024 * 1024) {
    return `Fail melebihi ${maxMb} MB.`
  }
  return null
}

export function asEnum<T extends string>(
  value: string,
  allowed: readonly T[],
  fallback: T
): T {
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback
}
