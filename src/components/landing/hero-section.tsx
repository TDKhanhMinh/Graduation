import { ArrowRight, Sparkles, Play } from "lucide-react"
import Link from "next/link"

import { AuroraBackground } from "@/components/effects/aurora-background"
import { HeroPosterDemo } from "@/components/landing/hero-poster-demo"
import { LandingSection } from "@/components/landing/landing-section"
import { TrustStrip } from "@/components/landing/trust-strip"
import { Button } from "@/components/ui/button"
import { PageShell } from "@/components/ui/page-shell"

export function HeroSection({ authenticated }: { authenticated: boolean }) {
  return (
    <LandingSection className="relative isolate overflow-hidden border-0 bg-surface-sunken pt-10 sm:pt-16 lg:pt-20 pb-16 sm:pb-24">
      {/* Ambient background aurora with low intensity */}
      <AuroraBackground preset="elegant" intensity="low" className="z-0 opacity-60" />

      <PageShell className="relative z-10">
        <div className="grid items-center gap-12 lg:grid-cols-[46%_54%] lg:gap-8">
          <div className="space-y-7 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-primary">
              <Sparkles aria-hidden="true" className="size-3.5" />
              Digital memories come alive
            </div>

            <div className="space-y-5">
              <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl leading-[1.15]">
                Biến áp phích sự kiện thành nơi mọi{" "}
                <span className="font-serif italic text-primary font-normal">kỷ niệm bắt đầu</span>
              </h1>
              <p className="mx-auto max-w-xl text-base leading-7 text-muted-foreground sm:text-lg lg:mx-0">
                Tạo áp phích, chia sẻ một mã QR và để khách mời cùng xây nên bức tường kỷ niệm trực tiếp của sự kiện.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link href={authenticated ? "/dashboard" : "/auth/sign-up"} className="w-full sm:w-auto">
                <Button size="lg" className="group min-h-12 w-full sm:w-auto rounded-full px-7 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-98">
                  {authenticated ? "Mở bảng điều khiển" : "Tạo sự kiện miễn phí"}
                  <ArrowRight aria-hidden="true" className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <a href="#product-story" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="min-h-12 w-full sm:w-auto rounded-full px-6 backdrop-blur-md">
                  <Play aria-hidden="true" className="mr-2 size-4 fill-current" />
                  Xem Memoria hoạt động
                </Button>
              </a>
            </div>

            <TrustStrip />
          </div>

          <HeroPosterDemo />
        </div>
      </PageShell>
    </LandingSection>
  )
}
