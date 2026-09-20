"use client"

import { useState } from "react"
import { toast } from "sonner"

import { AsyncStateBanner } from "@/components/shared/async-state"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { useNotificationPreferences } from "@/hooks/use-account-data"
import {
  CHANNEL_LABELS,
  type NotificationChannel,
  type NotificationPreferencesPatch,
} from "@/lib/domain/account"
import { isApiError, messageForApiError } from "@/lib/infrastructure/api/errors"

/**
 * Per-category x channel notification preferences (`/v1/me/notification-preferences`).
 *
 * A channel the server marks `is_locked` - every channel of a mandatory
 * category, and `inapp` everywhere - gets no switch at all. Rendering a
 * disabled one would offer a choice the backend answers with 400.
 */
export function NotificationsCard() {
  const { data, isLoading, isSaving, error, reload, save } =
    useNotificationPreferences()

  async function persist(patch: NotificationPreferencesPatch) {
    try {
      await save(patch)
      toast.success("Keutamaan pemberitahuan disimpan.")
    } catch (cause) {
      // Nothing to roll back: the switches render the server's own answer, so a
      // refused write simply leaves them where they were.
      toast.error(
        isApiError(cause)
          ? messageForApiError(cause)
          : "Gagal menyimpan keutamaan."
      )
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Waktu senyap &amp; ringkasan</CardTitle>
          <CardDescription>
            Waktu senyap menahan push; pemberitahuan keselamatan tetap sampai.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <AsyncStateBanner
            error={error}
            onRetry={() => {
              void reload()
            }}
            label="Gagal memuatkan keutamaan pemberitahuan."
          />

          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <>
              <QuietHoursFields
                // Remount when the server's value changes, which resets the
                // draft without a setState-in-effect.
                key={`${data.quietHoursStart ?? ""}|${data.quietHoursEnd ?? ""}`}
                start={data.quietHoursStart ?? ""}
                end={data.quietHoursEnd ?? ""}
                isSaving={isSaving}
                onSave={(start, end) => {
                  // "" is a deliberate clear, which is why both keys are always
                  // sent once this form is submitted.
                  void persist({ quietHoursStart: start, quietHoursEnd: end })
                }}
              />

              <FieldGroup>
                <Field orientation="horizontal">
                  <FieldContentText
                    title="Ringkasan harian"
                    description={`Satu e-mel sehari pada ${data.digestAt || "waktu lalai"} menggantikan pemberitahuan individu.`}
                  />
                  <Switch
                    aria-label="Ringkasan harian"
                    isSelected={data.digestEnabled}
                    isDisabled={isSaving}
                    onChange={(isEnabled) => {
                      void persist({ digestEnabled: isEnabled })
                    }}
                  />
                </Field>
              </FieldGroup>
            </>
          )}
        </CardContent>
      </Card>

      {isLoading ? null : (
        <Card>
          <CardHeader>
            <CardTitle>Kategori</CardTitle>
            <CardDescription>
              Pilih saluran bagi setiap jenis pemberitahuan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {data.categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Tiada kategori pemberitahuan.
              </p>
            ) : (
              data.categories.map((category) => (
                <div key={category.key} className="space-y-2">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{category.name}</p>
                    {category.isMandatory ? (
                      <p className="text-xs text-muted-foreground">
                        Wajib - tidak boleh dimatikan.
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-2">
                    {category.channels.map((channel) => (
                      <Item
                        key={channel.channel}
                        variant="muted"
                        className="py-2"
                      >
                        <ItemContent>
                          <ItemTitle>
                            {CHANNEL_LABELS[channel.channel]}
                          </ItemTitle>
                          {channel.isLocked ? (
                            <ItemDescription>Sentiasa hidup</ItemDescription>
                          ) : null}
                        </ItemContent>
                        <ItemActions>
                          {channel.isLocked ? null : (
                            <Switch
                              aria-label={`${category.name} - ${CHANNEL_LABELS[channel.channel]}`}
                              isSelected={channel.isEnabled}
                              isDisabled={isSaving}
                              onChange={(isEnabled) => {
                                void persist({
                                  preferences: [
                                    {
                                      categoryKey: category.key,
                                      channel:
                                        channel.channel as NotificationChannel,
                                      isEnabled,
                                    },
                                  ],
                                })
                              }}
                            />
                          )}
                        </ItemActions>
                      </Item>
                    ))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function FieldContentText({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="min-w-0 space-y-0.5">
      <FieldLabel>{title}</FieldLabel>
      <FieldDescription>{description}</FieldDescription>
    </div>
  )
}

/**
 * Local draft state, saved on submit rather than per keystroke: a half-typed
 * "2" in an HH:MM field is not a value worth sending to the server.
 */
function QuietHoursFields({
  start,
  end,
  isSaving,
  onSave,
}: {
  start: string
  end: string
  isSaving: boolean
  onSave: (start: string, end: string) => void
}) {
  const [draftStart, setDraftStart] = useState(start)
  const [draftEnd, setDraftEnd] = useState(end)

  const dirty = draftStart !== start || draftEnd !== end

  return (
    <>
      <FieldGroup className="sm:flex-row sm:gap-4">
        <Field>
          <FieldLabel htmlFor="quiet-start">Mula senyap</FieldLabel>
          <Input
            id="quiet-start"
            type="time"
            value={draftStart}
            onChange={(event) => setDraftStart(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="quiet-end">Tamat senyap</FieldLabel>
          <Input
            id="quiet-end"
            type="time"
            value={draftEnd}
            onChange={(event) => setDraftEnd(event.target.value)}
          />
        </Field>
      </FieldGroup>
      <div className="flex justify-end gap-2">
        {draftStart || draftEnd ? (
          <Button
            variant="outline"
            isDisabled={isSaving}
            onPress={() => onSave("", "")}
          >
            Kosongkan
          </Button>
        ) : null}
        <Button
          isDisabled={!dirty || isSaving}
          onPress={() => onSave(draftStart, draftEnd)}
        >
          Simpan waktu senyap
        </Button>
      </div>
    </>
  )
}
