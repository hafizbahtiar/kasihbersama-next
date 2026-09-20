/**
 * One row in the inbox (`GET /v1/notifications`).
 *
 * The text is a QUOTE, rendered when the notification was created in the
 * locale the account had then - the inbox never re-renders it and never asks
 * the module that triggered it (docs/05 §6).
 *
 * `readAt` and `acknowledgedAt` are different facts and both are needed:
 * seeing a medication reminder does not mean the dose was given.
 */
export type AppNotification = {
  id: string
  categoryKey: string
  title: string
  body?: string
  circleId?: string
  /** "module.section" - where pressing the notification should go. */
  subject?: string
  createdAt: string
  readAt?: string
  acknowledgedAt?: string
}
