import { ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"

import { AuroraBackground } from "@/components/effects/aurora-background"
import { HeroPosterDemo } from "@/components/landing/hero-poster-demo"
import { LandingSection } from "@/components/landing/landing-section"
import { TrustStrip } from "@/components/landing/trust-strip"
import { Button } from "@/components/ui/button"
import { PageShell } from "@/components/ui/page-shell"

export function HeroSection({ authenticated }: { authenticated: boolean }) {
  return <LandingSection className="relative isolate overflow-hidden border-0 bg-surface-sunken pt-12 sm:pt-20 lg:pt-28"><AuroraBackground preset="elegant" intensity="low" className="z-0" /><PageShell className="relative z-10"><div className="grid items-center gap-12 lg:grid-cols-[45%_55%] lg:gap-8"><div className="space-y-7 text-center lg:text-left"><div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1.5 text-sm font-medium text-primary"><Sparkles aria-hidden="true" className="size-4" />Poster-first event memories</div><div className="space-y-5"><h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">Biến poster sự kiện thành <span className="text-primary">nơi mọi kỷ niệm bắt đầu</span></h1><p className="mx-auto max-w-xl text-base leading-7 text-muted-foreground sm:text-lg lg:mx-0">Tạo poster, chia sẻ QR, nhận lời chúc và media rồi trình chiếu tất cả trên Public Wall của sự kiện.</p></div><div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start"><Link href={authenticated ? "/dashboard" : "/auth/sign-up"} className="w-full sm:w-auto"><Button size="lg" className="min-h-11 w-full sm:w-auto">{authenticated ? "Mở Dashboard" : "Tạo sự kiện miễn phí"}<ArrowRight aria-hidden="true" className="ml-2 size-5" /></Button></Link><a href="#template-showcase" className="w-full sm:w-auto"><Button size="lg" variant="outline" className="min-h-11 w-full sm:w-auto">Xem sự kiện mẫu</Button></a></div><TrustStrip /></div><HeroPosterDemo /></div></PageShell></LandingSection>
}
