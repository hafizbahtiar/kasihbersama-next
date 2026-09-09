import type { Metadata } from "next"

import { LegalChrome } from "@/components/legal/legal-chrome"
import { TermsArticle } from "@/components/legal/terms-article"

export const metadata: Metadata = {
  title: "Terma penggunaan",
  description: "Terma dan syarat penggunaan Kasih Bersama.",
}

export default function TermsPage() {
  return (
    <LegalChrome>
      <TermsArticle />
    </LegalChrome>
  )
}
