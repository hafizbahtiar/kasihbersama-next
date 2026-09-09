import { IconUserSearch } from "@tabler/icons-react"

import { LinkButton } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

/**
 * Shown by every care form when no profile is selected.
 *
 * It replaced a bare sentence reading "Pilih profil jagaan di header dahulu."
 * That pointed at a control which, until the switcher was added to the
 * sidebar, did not exist below the `sm` breakpoint - and it gave no way to act
 * on the instruction either. A dead end with directions to a missing door.
 */
export function SelectProfileEmpty() {
  return (
    <Empty className="py-8">
      <EmptyMedia variant="icon">
        <IconUserSearch />
      </EmptyMedia>
      <EmptyTitle>Pilih profil jagaan dahulu</EmptyTitle>
      <EmptyDescription>
        Rekod ini disimpan pada satu profil. Pilih dalam menu sisi, atau buat
        profil pertama anda.
      </EmptyDescription>
      <EmptyContent>
        <LinkButton href="/care-profiles">Lihat profil jagaan</LinkButton>
      </EmptyContent>
    </Empty>
  )
}
