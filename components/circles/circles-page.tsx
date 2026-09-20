"use client"

import { useState } from "react"
import { IconCheck, IconPlus, IconUsersGroup } from "@tabler/icons-react"
import { toast } from "sonner"

import { usePlatform } from "@/components/platform/platform-provider"
import { Badge } from "@/components/ui/badge"
import { Button, LinkButton } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { getCircleRepository } from "@/lib/composition/circle-repository"
import {
  CIRCLE_TYPE_LABELS,
  roleLabel,
  type CircleType,
} from "@/lib/domain/circle"
import { isApiError, messageForApiError } from "@/lib/infrastructure/api/errors"

const CIRCLE_TYPES = Object.keys(CIRCLE_TYPE_LABELS) as CircleType[]

export function CirclesPage() {
  const { circles, activeCircle, isLoading, refresh, switchCircle } =
    usePlatform()
  const [name, setName] = useState("")
  const [type, setType] = useState<CircleType>("family")
  const [isSaving, setIsSaving] = useState(false)
  const [switching, setSwitching] = useState<string | null>(null)

  async function createCircle() {
    if (!name.trim()) {
      return
    }
    setIsSaving(true)
    try {
      await getCircleRepository().createCircle({ name: name.trim(), type })
      setName("")
      // The new circle - and the membership that came with it - only exist in
      // bootstrap's answer, so the list is re-read rather than appended to.
      await refresh()
      toast.success("Circle dicipta.")
    } catch (cause) {
      toast.error(
        isApiError(cause) ? messageForApiError(cause) : "Gagal mencipta circle."
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function makeActive(circleId: string) {
    setSwitching(circleId)
    try {
      await switchCircle(circleId)
      toast.success("Circle aktif ditukar.")
    } catch (cause) {
      toast.error(
        isApiError(cause) ? messageForApiError(cause) : "Gagal menukar circle."
      )
    } finally {
      setSwitching(null)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl tracking-tight">Circle</h1>
        <p className="text-sm text-muted-foreground">
          Keluarga atau kumpulan penjagaan yang anda sertai.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Circle anda</CardTitle>
          <CardDescription>
            Circle aktif menentukan apa yang anda boleh lihat dan buat.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && circles.length === 0 ? (
            <Skeleton className="h-24 w-full" />
          ) : circles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Anda belum menyertai mana-mana circle. Cipta satu di bawah, atau
              terima jemputan yang dihantar ke e-mel anda.
            </p>
          ) : (
            <ItemGroup className="gap-3">
              {circles.map((circle) => {
                const active = circle.id === activeCircle?.id
                return (
                  <Item key={circle.id} variant={active ? "outline" : "muted"}>
                    <ItemMedia variant="icon">
                      <IconUsersGroup />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle className="flex flex-wrap items-center gap-2">
                        {circle.name}
                        {active ? <Badge>Aktif</Badge> : null}
                      </ItemTitle>
                      <ItemDescription>
                        {CIRCLE_TYPE_LABELS[circle.type] ?? circle.type} ·{" "}
                        {roleLabel(circle.roleKey)}
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions className="gap-2">
                      {active ? null : (
                        <Button
                          variant="outline"
                          size="sm"
                          isDisabled={switching !== null}
                          onPress={() => {
                            void makeActive(circle.id)
                          }}
                        >
                          <IconCheck />
                          Jadikan aktif
                        </Button>
                      )}
                      <LinkButton
                        href={`/circles/${circle.id}`}
                        variant="ghost"
                        size="sm"
                      >
                        Urus
                      </LinkButton>
                    </ItemActions>
                  </Item>
                )
              })}
            </ItemGroup>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cipta circle</CardTitle>
          <CardDescription>
            Anda menjadi pemilik, dan boleh menjemput ahli selepas itu.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="circle-name">Nama</FieldLabel>
            <Input
              id="circle-name"
              value={name}
              placeholder="Contoh: Rumah Bukit"
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>Jenis</FieldLabel>
            <Select
              className="w-full"
              aria-label="Jenis circle"
              value={type}
              onChange={(key) => setType(String(key ?? "family") as CircleType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CIRCLE_TYPES.map((key) => (
                  <SelectItem key={key} id={key}>
                    {CIRCLE_TYPE_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </CardContent>
        <CardFooter className="justify-end">
          <Button
            isDisabled={isSaving || name.trim().length === 0}
            onPress={() => {
              void createCircle()
            }}
          >
            <IconPlus />
            Cipta circle
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
