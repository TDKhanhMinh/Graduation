import nextDynamic from "next/dynamic"
import type { Metadata } from "next"

import { ComparisonSection } from "@/components/landing/comparison-section"
import { EventJourney } from "@/components/landing/event-journey"
import { FeatureBento } from "@/components/landing/feature-bento"
import { FaqSection } from "@/components/landing/faq-section"
import { FinalCta } from "@/components/landing/final-cta"
import { HeroSection } from "@/components/landing/hero-section"
import { ProductStoryScrollytelling } from "@/components/landing/product-story-scrollytelling"
import { LandingAnalytics } from "@/components/landing/landing-analytics"
import { LandingFooter } from "@/components/landing/landing-footer"
import { LandingHeader } from "@/components/landing/landing-header"
import { UseCases } from "@/components/landing/use-cases"
import { verifySession } from "@/lib/auth/dal"
import { getSiteUrl } from "@/lib/supabase/env"

const TemplateShowcase = nextDynamic(
  () => import("@/components/landing/template-showcase").then((module) => module.TemplateShowcase),
  { loading: () => <div className="min-h-96 border-t bg-background" aria-hidden="true" /> }
)
const PublicWallDemo = nextDynamic(
  () => import("@/components/landing/public-wall-demo").then((module) => module.PublicWallDemo),
  { loading: () => <div className="min-h-96 border-t bg-surface-sunken" aria-hidden="true" /> }
)

const siteUrl = getSiteUrl()

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Memoria — Áp phích là nơi mọi kỷ niệm bắt đầu",
  description: "Tạo áp phích, chia sẻ mã QR, nhận lời chúc và tệp đa phương tiện rồi trình chiếu tất cả trên bức tường công khai của sự kiện.",
  alternates: { canonical: siteUrl },
  openGraph: {
    title: "Memoria — Áp phích là nơi mọi kỷ niệm bắt đầu",
    description: "Áp phích · Mã QR · Lời chúc · Bức tường công khai cho những sự kiện đáng nhớ.",
    url: siteUrl,
    siteName: "Memoria",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Áp phích Memoria, mã QR và bức tường công khai" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Memoria — Áp phích là nơi mọi kỷ niệm bắt đầu",
    description: "Áp phích · Mã QR · Lời chúc · Bức tường công khai cho những sự kiện đáng nhớ.",
    images: ["/twitter-image"],
  },
}

export default async function Home() {
  const session = await verifySession()
  const authenticated = Boolean(session)

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-surface-sunken text-foreground">
      <LandingAnalytics />
      <LandingHeader authenticated={authenticated} />
      <main id="main-content" className="flex-1">
        <HeroSection authenticated={authenticated} />
        <TemplateShowcase />
        <ProductStoryScrollytelling />
        <PublicWallDemo />
        <FeatureBento />
        <EventJourney />
        <UseCases />
        <ComparisonSection />
        <FaqSection />
        <FinalCta authenticated={authenticated} />
      </main>
      <LandingFooter />
    </div>
  )
}
