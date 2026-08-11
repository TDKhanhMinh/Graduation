"use client"

import { ArrowRight, Sparkles, Heart } from "lucide-react"
import Link from "next/link"

import { GlowingRunningBorder } from "@/components/effects/running-border"
import { LandingSection } from "@/components/landing/landing-section"
import { Button } from "@/components/ui/button"
import { PageShell } from "@/components/ui/page-shell"

export function FinalCta({ authenticated }: { authenticated: boolean }) {
  return (
    <LandingSection className="border-0 bg-surface-sunken py-16 sm:py-24">
      <PageShell>
        <GlowingRunningBorder borderRadius="rounded-[3rem]" glowTheme="gold" duration={6}>
          <div className="relative overflow-hidden rounded-[3rem] bg-[linear-gradient(135deg,var(--brand-800),var(--brand-600))] px-6 py-16 text-center text-white shadow-2xl sm:px-12 sm:py-24">
          {/* Ambient Glow & Floating Elements */}
          <div aria-hidden="true" className="absolute -right-16 -top-16 size-72 rounded-full border border-white/10 bg-primary/20 backdrop-blur-3xl" />
          <div aria-hidden="true" className="absolute -bottom-24 -left-10 size-80 rounded-full border border-white/10 bg-purple-500/20 backdrop-blur-3xl" />

          <div className="relative mx-auto max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold tracking-widest uppercase text-white backdrop-blur-md">
              <Sparkles className="size-3.5 text-amber-300" /> Start Your Memory Journey
            </div>

            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-5xl lg:text-6xl leading-tight">
              Sự kiện rồi sẽ kết thúc. <br className="hidden sm:inline" />
              <span className="font-serif italic text-amber-300 font-normal">Kỷ niệm thì không.</span>
            </h2>

            <p className="mx-auto max-w-xl text-base leading-7 text-white/85 sm:text-lg">
              Tạo áp phích sự kiện đầu tiên của bạn chỉ trong 30 giây và bắt đầu thu nhận những khoảnh khắc vô giá cùng những người thương yêu.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row pt-4">
              <Link href={authenticated ? "/dashboard" : "/auth/sign-up"} className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="min-h-12 w-full rounded-full bg-white text-primary font-bold shadow-xl hover:bg-white/90 hover:scale-102 active:scale-98 transition-all sm:w-auto px-8"
                >
                  {authenticated ? "Mở bảng điều khiển" : "Tạo sự kiện miễn phí"}
                  <ArrowRight aria-hidden="true" className="ml-2 size-5" />
                </Button>
              </Link>
              <a href="#template-showcase" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="min-h-12 w-full rounded-full border-white/30 text-white hover:bg-white/15 backdrop-blur-md sm:w-auto px-7"
                >
                  Khám phá mẫu áp phích
                </Button>
              </a>
            </div>

            <p className="text-xs text-white/60 pt-4 flex items-center justify-center gap-1.5">
              <Heart className="size-3.5 fill-amber-300 text-amber-300" /> Không cần thẻ tín dụng · Khởi tạo hoàn toàn miễn phí
            </p>
          </div>
        </div>
      </GlowingRunningBorder>
      </PageShell>
    </LandingSection>
  )
}
