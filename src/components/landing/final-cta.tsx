import { ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"

import { LandingSection } from "@/components/landing/landing-section"
import { Button } from "@/components/ui/button"
import { PageShell } from "@/components/ui/page-shell"

export function FinalCta({ authenticated }: { authenticated: boolean }) {
  return <LandingSection className="border-0 bg-surface-sunken"><PageShell><div className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,var(--brand-700),var(--brand-500))] px-6 py-16 text-center text-white sm:px-12 sm:py-20"><div aria-hidden="true" className="absolute -right-16 -top-16 size-56 rounded-full border border-white/20" /><div aria-hidden="true" className="absolute -bottom-24 -left-10 size-64 rounded-full border border-white/10" /><div className="relative mx-auto max-w-2xl"><Sparkles aria-hidden="true" className="mx-auto size-7 text-memory-gold" /><h2 className="mt-5 font-heading text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">Bắt đầu bằng poster của sự kiện tiếp theo</h2><p className="mx-auto mt-5 max-w-xl text-base leading-7 text-white/80 sm:text-lg">Tạo một không gian để lời chúc, hình ảnh và những khoảnh khắc đáng nhớ cùng xuất hiện.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href={authenticated ? "/dashboard" : "/auth/sign-up"} className="w-full sm:w-auto"><Button size="lg" variant="secondary" className="min-h-11 w-full text-primary hover:bg-white/90 sm:w-auto">{authenticated ? "Mở Dashboard" : "Tạo sự kiện miễn phí"}<ArrowRight aria-hidden="true" className="ml-2 size-5" /></Button></Link><a href="#template-showcase" className="w-full sm:w-auto"><Button size="lg" variant="outline" className="min-h-11 w-full border-white/30 text-white hover:bg-white/10 sm:w-auto">Khám phá mẫu poster</Button></a></div></div></div></PageShell></LandingSection>
}
