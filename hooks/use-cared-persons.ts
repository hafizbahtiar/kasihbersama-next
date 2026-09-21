"use client"

import { useCallback, useEffect, useState } from "react"

import { getCircleRepository } from "@/lib/composition/circle-repository"
import type { CircleMembership, CirclePerson } from "@/lib/domain/circle"

export type CaredPerson = CirclePerson & {
  circleId: string
  circleName: string
}

/**
 * Semua orang yang pengguna ini jaga, merentas SETIAP circlenya.
 *
 * Pelayan tiada laluan "semua person saya" - person hidup dalam circle, dan
 * pagar keahlian ialah sebab itu. Jadi skrin ini membaca setiap circle yang
 * bootstrap sudah namakan. Pelan percuma bermaksud segelintir circle, bukan
 * beratus.
 *
 * Satu circle yang gagal tidak mengosongkan yang lain: ahli tanpa
 * `core.person.read` di satu circle ialah keadaan biasa, bukan kegagalan skrin.
 */
export function useCaredPersons(circles: CircleMembership[]) {
  const [data, setData] = useState<CaredPerson[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const key = circles.map((c) => c.id).join(",")

  const load = useCallback(async () => {
    setIsLoading(true)
    const repo = getCircleRepository()
    const perCircle = await Promise.all(
      circles.map((circle) =>
        repo
          .listPersons(circle.id)
          .then((rows) =>
            rows.map((person) => ({
              ...person,
              circleId: circle.id,
              circleName: circle.name,
            }))
          )
          .catch(() => [] as CaredPerson[])
      )
    )
    setData(perCircle.flat())
    setIsLoading(false)
    // circles ialah objek baharu setiap render bootstrap; id-nya yang stabil.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  useEffect(() => {
    // Load-on-mount: pemuat menukar isLoading sebelum await pertamanya, yang
    // ditandai oleh peraturan pengkompil. Selamat di sini - satu render tambahan
    // semasa mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  return { data, isLoading, reload: load }
}
