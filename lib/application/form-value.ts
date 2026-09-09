export function fieldValue(event: unknown) {
  if (typeof event === "string") {
    return event
  }

  if (event && typeof event === "object" && "target" in event) {
    return String((event as { target: { value: string } }).target.value ?? "")
  }

  return ""
}
