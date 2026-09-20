"use client"

import { useState } from "react"
import { IconMailOpened } from "@tabler/icons-react"
import { useRouter } from "next/navigation"

import { AsyncStateBanner } from "@/components/shared/async-state"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useBrowserValue } from "@/hooks/use-browser-value"
import { readTokenFromUrl } from "@/lib/application/token-from-url"
import { getCircleRepository } from "@/lib/composition/circle-repository"
import { ApiError, isApiError } from "@/lib/infrastructure/api/errors"

/**
 * Accepts a circle invitation. The token comes from the emailed link - the API
 * never returns one - and `readTokenFromUrl` prefers the fragment so it stays
 * out of the Referer header and the server's access log.
 */
export function AcceptInviteForm() {
  const router = useRouter()
  // Read after hydration: the fragment exists only in the browser, and the
  // server render must not claim to know it.
  const urlToken = useBrowserValue(() => readTokenFromUrl(), "")
  const [edited, setEdited] = useState<string | null>(null)
  const token = edited ?? urlToken
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  async function accept() {
    setIsSaving(true)
    setError(null)
    try {
      await getCircleRepository().acceptInvitation(token.trim())
      // Full navigation, not router.refresh: bootstrap is read on mount, and
      // the new membership only exists in its answer.
      window.location.assign("/circles")
    } catch (cause) {
      setError(
        isApiError(cause)
          ? cause
          : new ApiError("Gagal menerima jemputan.", {
              code: "internal",
              status: 500,
            })
      )
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <AsyncStateBanner error={error} label="Jemputan tidak diterima." />

      <Field>
        <FieldLabel htmlFor="invite-token">Token jemputan</FieldLabel>
        <Input
          id="invite-token"
          value={token}
          onChange={(event) => setEdited(event.target.value)}
        />
        <FieldDescription>
          Biasanya diisi sendiri daripada pautan e-mel anda.
        </FieldDescription>
      </Field>

      <div className="flex gap-2">
        <Button
          isDisabled={isSaving || token.trim().length < 10}
          onPress={() => {
            void accept()
          }}
        >
          <IconMailOpened />
          Terima jemputan
        </Button>
        <Button variant="ghost" onPress={() => router.push("/circles")}>
          Kemudian
        </Button>
      </div>
    </div>
  )
}
