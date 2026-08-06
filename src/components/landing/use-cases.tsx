import { BriefcaseBusiness, Cake, GraduationCap, Heart, Presentation } from "lucide-react"

import { LandingSection } from "@/components/landing/landing-section"
import { PageShell } from "@/components/ui/page-shell"

const useCases = [[Heart, "Đám cưới", "Giữ những lời chúc thân tình quanh câu chuyện của hai bạn.", "from-memory-pink/60 to-brand-100"], [Cake, "Sinh nhật", "Biến khoảnh khắc bất ngờ thành một album nhiều tiếng cười.", "from-memory-gold/70 to-memory-peach/30"], [GraduationCap, "Tốt nghiệp", "Gom lời dặn dò, hình ảnh và tự hào của một chặng đường.", "from-brand-200 to-primary/20"], [BriefcaseBusiness, "Tiệc cuối năm", "Kết nối đồng đội bằng một không gian chia sẻ chung.", "from-status-info/20 to-brand-100"], [Presentation, "Hội nghị", "Để câu hỏi, thông tin chuyên sâu và khoảnh khắc sự kiện ở lại có hệ thống.", "from-status-success/25 to-brand-100"]] as const

export function UseCases() {
  return <LandingSection id="use-cases" className="bg-background"><PageShell>      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Tình huống Sử dụng</p>
        <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">Một áp phích riêng cho mỗi dịp</h2><p className="mt-4 text-base leading-7 text-muted-foreground">Chọn cách bắt đầu phù hợp với bối cảnh, rồi để khách mời cùng viết tiếp câu chuyện.</p></div><div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">{useCases.map(([Icon, title, description, gradient]) => <article key={title} className="group rounded-2xl border bg-card p-3 transition-shadow hover:shadow-md"><div aria-hidden="true" className={`relative aspect-[4/5] overflow-hidden rounded-xl bg-gradient-to-br ${gradient} p-4`}><Icon className="size-7 text-foreground/70" /><span className="absolute bottom-4 left-4 font-heading text-xl font-bold text-foreground/85">{title}</span><span className="absolute right-3 top-3 size-8 rounded bg-white/60" /></div><div className="p-2"><h3 className="font-heading text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></div></article>)}</div></PageShell></LandingSection>
}
