"use client"

import { IconRefresh } from "@tabler/icons-react"

import { usePlatform } from "@/components/platform/platform-provider"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function ForceUpdateGate({ children }: { children: React.ReactNode }) {
  const { forceUpdate, bootstrap, appBuild, refresh, isLoading } = usePlatform()

  if (!forceUpdate) {
    return children
  }

  return (
    <div className="grid min-h-svh place-items-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-heading text-xl">
            Kemas kini diperlukan
          </CardTitle>
          <CardDescription>
            Versi aplikasi anda (build {appBuild}) sudah tidak disokong. Sila
            muat semula halaman atau kemas kini aplikasi untuk meneruskan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {bootstrap ? (
            <>
              <p>Build minimum: {bootstrap.minSupportedBuild}</p>
              <p>Build terkini: {bootstrap.latestBuild}</p>
            </>
          ) : null}
        </CardContent>
        <CardFooter>
          <Button onPress={() => void refresh()} isDisabled={isLoading}>
            <IconRefresh />
            Cuba semula
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
