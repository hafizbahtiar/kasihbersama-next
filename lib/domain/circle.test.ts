import { expect, test } from "bun:test"

import { ageLabel } from "./circle"

test("bayi disebut dalam bulan, bukan '0 tahun'", () => {
  expect(ageLabel(0, 8)).toBe("8 bulan")
  expect(ageLabel(0, 0)).toBe("0 bulan")
})

test("kanak-kanak kecil membawa bulan, orang dewasa tidak", () => {
  expect(ageLabel(1, 6)).toBe("1 tahun 6 bulan")
  expect(ageLabel(2, 11)).toBe("2 tahun 11 bulan")
  expect(ageLabel(3, 6)).toBe("3 tahun")
  expect(ageLabel(71, 3)).toBe("71 tahun")
})

test("bulan sifar tidak pernah disebut sebagai '0 bulan' selepas tahun", () => {
  expect(ageLabel(2, 0)).toBe("2 tahun")
})

test("tarikh lahir yang tersembunyi tidak mereka umur", () => {
  expect(ageLabel(undefined, undefined)).toBe("—")
})
