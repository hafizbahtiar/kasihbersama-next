"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { usePathname } from "next/navigation"

/**
 * Bekas kandungan utama. Ia dahulunya menunggu penyedia data care sebelum merender
 * apa-apa; dengan modul v0.1 dibuang, tiada lagi data peringkat-cangkerang untuk
 * ditunggu - setiap skrin memuatkan datanya sendiri dan memaparkan keadaan
 * memuatnya sendiri.
 */
export function AppMain({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const mainRef = useRef<HTMLElement>(null)

  // Scroll hidup di sini, bukan di window, jadi Next tidak menetapkan semula
  // scroll bila halaman bertukar - pengguna akan mendarat di tengah senarai.
  // ponytail: reset ke atas pada tiap navigasi termasuk balik/ke hadapan; tambah
  // pemulihan scroll manual hanya bila pengguna benar-benar perlukan kedudukan
  // semula selepas tekan butang balik.
  useEffect(() => {
    mainRef.current?.scrollTo(0, 0)
  }, [pathname])

  return (
    <main
      ref={mainRef}
      className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto p-4 md:gap-6 md:p-6"
    >
      {children}
    </main>
  )
}
