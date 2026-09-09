import { LogoMark } from "@/components/brand/logo-mark"

/**
 * The screen between "app opened" and "we know who you are".
 *
 * Distinct from PageLoadingState, which is a content skeleton shaped like the
 * page it stands in for and belongs inside the app shell. This runs before the
 * shell exists - AuthGate wraps the whole layout - so a skeleton here has
 * nothing to align to and strands itself in the top-left of an empty viewport.
 *
 * One element carries both jobs: the brand mark says which product is loading,
 * the ring around it says work is happening. A separate logo and spinner would
 * be two things competing in a screen that is usually gone within a second.
 */
export function FullPageLoadingState({
  label = "Memuatkan…",
}: {
  label?: string
}) {
  return (
    <main
      className="grid min-h-dvh place-items-center bg-background p-6"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-5">
        <div className="relative grid size-16 place-items-center">
          <span
            aria-hidden="true"
            className="absolute inset-0 animate-spin rounded-full border-2 border-primary/15 border-t-primary motion-reduce:animate-none"
          />
          <LogoMark className="size-7 text-primary" decorative />
        </div>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </main>
  )
}
