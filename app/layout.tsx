import { Figtree, Geist_Mono, Roboto_Slab } from "next/font/google"
import type { Metadata, Viewport } from "next"

import "./globals.css"
import { AuthProvider } from "@/components/auth/auth-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { I18nProvider } from "@/components/ui/direction"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

const robotoSlabHeading = Roboto_Slab({
  subsets: ["latin"],
  variable: "--font-heading",
})

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: {
    default: "Kasih Bersama",
    template: "%s · Kasih Bersama",
  },
  icons: {
    icon: [{ url: "/logo.svg", type: "image/svg+xml" }],
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ms"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        figtree.variable,
        robotoSlabHeading.variable
      )}
    >
      <body
        className="min-h-dvh min-w-0 overflow-x-hidden"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <AuthProvider>
            <I18nProvider locale="ms-MY">
              {children}
              <Toaster />
            </I18nProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
