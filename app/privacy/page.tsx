import type { Metadata } from "next"

import { LegalChrome } from "@/components/legal/legal-chrome"
import { PrivacyArticle } from "@/components/legal/privacy-article"

export const metadata: Metadata = {
  title: "Dasar privasi",
  description:
    "Bagaimana Kasih Bersama menyimpan, menggunakan, dan melindungi data jagaan anda.",
}

export default function PrivacyPage() {
  return (
    <LegalChrome>
      <PrivacyArticle />
    </LegalChrome>
  )
}
