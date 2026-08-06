import { ArrowRight, Check, Minus } from "lucide-react"

import { LandingSection } from "@/components/landing/landing-section"
import { PageShell } from "@/components/ui/page-shell"

const rows = [["Một điểm vào cho khách mời", "Thông tin thường nằm rải rác", true], ["Lời chúc và media cùng câu chuyện", "Cần tự gom lại sau sự kiện", true], ["Trình chiếu khoảnh khắc chung", "Phụ thuộc vào cách tổ chức riêng", true]] as const

export function ComparisonSection() {
  return <LandingSection id="before-after" className="bg-surface-sunken"><PageShell><div className="mx-auto max-w-2xl text-center"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Before / After</p><h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">Một cách kể chuyện tập trung hơn</h2><p className="mt-4 text-base leading-7 text-muted-foreground">Không phán xét cách làm cũ; chỉ cho thấy Memoria đặt poster và kỷ niệm vào cùng một flow.</p></div><div className="mx-auto mt-10 max-w-3xl overflow-hidden rounded-3xl border bg-card"><div className="grid grid-cols-[1fr_1fr] border-b bg-muted/50 p-4 text-sm font-semibold"><span>Chuẩn bị rời rạc</span><span className="text-primary">Với Memoria</span></div>{rows.map(([before, after, supported]) => <div key={before} className="grid grid-cols-[1fr_1fr] gap-4 border-b p-4 text-sm last:border-b-0"><span className="flex items-start gap-2 text-muted-foreground"><Minus aria-hidden="true" className="mt-0.5 size-4 shrink-0" />{before}</span><span className="flex items-start gap-2"><Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-status-success" />{after}</span></div>)}</div></PageShell></LandingSection>
}
