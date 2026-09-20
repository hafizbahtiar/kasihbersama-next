import type { Metadata } from "next"

import { AcceptInviteForm } from "@/components/circles/accept-invite-form"

export const metadata: Metadata = {
  title: "Terima jemputan",
}

/**
 * `/accept/invite` - the exact path the invitation email links to
 * (`circle/mailer`), with the token in the FRAGMENT. The fragment never
 * reaches this server component, so the form reads it in the browser.
 *
 * It sits under `(app)` on purpose: accepting needs a session, because the
 * backend matches the invitation against the caller's own email.
 */
export default function AcceptInviteRoutePage() {
  return (
    <div className="mx-auto w-full max-w-lg space-y-5">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl tracking-tight">
          Terima jemputan
        </h1>
        <p className="text-sm text-muted-foreground">
          Jemputan terikat kepada alamat e-mel yang menerimanya.
        </p>
      </div>
      <AcceptInviteForm />
    </div>
  )
}
