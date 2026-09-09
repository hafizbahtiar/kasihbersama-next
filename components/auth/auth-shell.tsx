import { IconShieldCheck } from "@tabler/icons-react"

import { LogoMark } from "@/components/brand/logo-mark"

type AuthShellProps = {
  children: React.ReactNode
  panelKicker?: string
  panelTitle?: string
  panelBody?: string
}

export function AuthShell({
  children,
  panelKicker = "Ruang yang lebih tenang untuk menjaga yang tersayang.",
  panelTitle = "Penjagaan yang terasa lebih dekat.",
  panelBody = "Urus rutin harian, pantau kesihatan dan kekal terhubung dengan keluarga dalam satu tempat.",
}: AuthShellProps) {
  return (
    <main className="flex min-h-dvh min-w-0 flex-col overflow-x-hidden bg-background lg:grid lg:grid-cols-2">
      <section className="relative isolate overflow-hidden bg-primary px-5 py-5 text-primary-foreground sm:px-8 sm:py-6 lg:flex lg:min-h-dvh lg:flex-col lg:justify-between lg:px-12 lg:py-12 xl:px-16 xl:py-16">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-16 hidden size-80 rounded-full border-[28px] border-primary-foreground/10 lg:block xl:size-96 xl:border-[36px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-10 bottom-16 hidden size-40 rounded-full bg-primary-foreground/10 blur-2xl lg:block"
        />

        <div className="relative mx-auto flex w-full max-w-md min-w-0 flex-col lg:mx-0 lg:h-full lg:max-w-lg lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-foreground p-1.5 text-primary">
              <LogoMark className="size-full" decorative />
            </span>
            <span className="text-sm font-medium">Kasih Bersama</span>
          </div>

          <p className="mt-3 text-sm leading-6 text-primary-foreground/80 lg:hidden">
            {panelTitle}
          </p>

          <div className="mt-auto hidden lg:block">
            <p className="mb-5 text-sm font-medium text-primary-foreground/70">
              {panelKicker}
            </p>
            <h2 className="font-heading text-4xl leading-[1.08] tracking-tight text-balance xl:text-6xl">
              {panelTitle}
            </h2>
            <p className="mt-6 max-w-md text-base leading-7 text-primary-foreground/75">
              {panelBody}
            </p>
          </div>

          <div className="mt-6 hidden items-center gap-3 text-sm text-primary-foreground/70 lg:flex">
            <IconShieldCheck className="size-4 shrink-0" />
            Data anda dijaga dengan selamat
          </div>
        </div>
      </section>

      <section className="flex min-h-0 flex-1 items-start justify-center overflow-y-auto px-5 py-8 sm:px-8 sm:py-12 lg:items-center lg:px-12 lg:py-12 xl:px-16">
        <div className="w-full max-w-md min-w-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </section>
    </main>
  )
}
