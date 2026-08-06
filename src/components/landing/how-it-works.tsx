import { ArrowRight, MessageCircleHeart, Palette, QrCode } from "lucide-react"

import { LandingSection } from "@/components/landing/landing-section"
import { PageShell } from "@/components/ui/page-shell"

const steps = [[Palette, "01", "Tạo áp phích", "Chọn thiết kế, chỉnh nội dung và đặt câu chuyện của sự kiện lên áp phích."], [QrCode, "02", "Chia sẻ mã QR", "Đặt QR ở nơi khách mời dễ thấy để ai cũng có thể tham gia bằng điện thoại."], [MessageCircleHeart, "03", "Nhận và trình chiếu", "Lời chúc, tệp đa phương tiện và phản ứng tạo thành bức tường công khai trong suốt sự kiện."]] as const

export function HowItWorks() {
  return <LandingSection id="how-it-works" className="bg-background"><PageShell>      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Cách Hoạt Động</p>
        <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">Áp phích → Mã QR → lời chúc → Bức tường công khai</h2><p className="mt-4 text-base leading-7 text-muted-foreground">Một quy trình ngắn, dễ hiểu trước khi bạn bắt đầu chuẩn bị sự kiện.</p></div><div className="mt-12 grid gap-5 md:grid-cols-3">{steps.map(([Icon, number, title, description]) => <article key={number} className="rounded-2xl border bg-card p-6"><div className="flex items-center justify-between"><div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon aria-hidden="true" className="size-6" /></div><span className="text-sm font-bold text-muted-foreground/60">{number}</span></div><h3 className="mt-6 font-heading text-xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p></article>)}</div></PageShell></LandingSection>
}
