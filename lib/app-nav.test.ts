import { expect, test } from "bun:test"

import { buildCrumbs, isNavActive } from "./app-nav"

const names: Record<string, string> = { "c-1": "Keluarga Amin" }
const crumbs = (path: string) =>
  buildCrumbs(path, (id) => names[id]).map((c) => [c.label, c.href])

test("setiap awalan yang merupakan skrin menjadi satu kerat", () => {
  expect(crumbs("/circles/c-1/persons/p-1")).toEqual([
    ["Circle", "/circles"],
    ["Keluarga Amin", "/circles/c-1"],
    ["Rekod kesihatan", "/circles/c-1/persons/p-1"],
  ])
})

test("segmen yang hanya menamakan koleksi tidak menjadi pautan ke 404", () => {
  expect(crumbs("/circles/c-1/persons").map(([, href]) => href)).toEqual([
    "/circles",
    "/circles/c-1",
  ])
})

test("circle tanpa nama memakai label skrin, bukan UUID", () => {
  expect(crumbs("/circles/c-9")[1]).toEqual(["Circle ini", "/circles/c-9"])
})

test("modul lain juga berjejak, bukan circle sahaja", () => {
  expect(crumbs("/settings")).toEqual([["Tetapan", "/settings"]])
  expect(crumbs("/notifications")).toEqual([
    ["Pemberitahuan", "/notifications"],
  ])
  expect(crumbs("/accept/invite")).toEqual([
    ["Terima jemputan", "/accept/invite"],
  ])
  expect(crumbs("/persons")).toEqual([["Orang dijaga", "/persons"]])
})

test("pintasan /persons tidak dikelirukan dengan person dalam circle", () => {
  // Dua laluan berkongsi perkataan "persons" tetapi bukan awalan yang sama.
  expect(isNavActive("/circles/c-1/persons/p-1", "/persons")).toBe(false)
  expect(isNavActive("/circles/c-1/persons/p-1", "/circles")).toBe(true)
  expect(isNavActive("/persons", "/persons")).toBe(true)
})

test("laluan tidak dikenali bersembunyi, bukan mereka label", () => {
  expect(crumbs("/entah/apa")).toEqual([])
})
