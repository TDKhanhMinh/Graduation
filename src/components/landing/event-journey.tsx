import { CalendarHeart, Clock3, ImageIcon } from "lucide-react"

import { LandingSection } from "@/components/landing/landing-section"
import { PageShell } from "@/components/ui/page-shell"

const journey = [[Clock3, "Trước sự kiện", "Chọn poster, chuẩn bị QR và đặt tone cho trải nghiệm."], [CalendarHeart, "Trong sự kiện", "Khách mời gửi lời chúc/media; chủ sự kiện kiểm duyệt và trình chiếu."], [ImageIcon, "Sau sự kiện", "Nhìn lại album và những lời nhắn đã làm ngày đó đặc biệt."]] as const

export function EventJourney() {
  return <LandingSection id="event-journey" className="bg-background"><PageShell><div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-end"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Event Journey</p><h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">Giá trị trước, trong và sau sự kiện</h2></div><p className="max-w-xl text-base leading-7 text-muted-foreground">Memoria làm rõ việc gì xảy ra ở từng giai đoạn để người tổ chức và khách mời luôn biết bước tiếp theo.</p></div><div className="mt-12 grid gap-5 md:grid-cols-3">{journey.map(([Icon, title, description]) => <article key={title} className="rounded-2xl border bg-card p-6"><Icon aria-hidden="true" className="size-7 text-primary" /><h3 className="mt-6 font-heading text-xl font-semibold">{title}</h3><p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p></article>)}</div></PageShell></LandingSection>
}
