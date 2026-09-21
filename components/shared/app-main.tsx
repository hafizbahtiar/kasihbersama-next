"use client"

import type { ReactNode } from "react"

/**
 * Bekas kandungan utama. Ia dahulunya menunggu penyedia data care sebelum merender
 * apa-apa; dengan modul v0.1 dibuang, tiada lagi data peringkat-cangkerang untuk
 * ditunggu - setiap skrin memuatkan datanya sendiri dan memaparkan keadaan
 * memuatnya sendiri.
 */
export function AppMain({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto p-4 md:gap-6 md:p-6">
      {children}
    </main>
  )
}
