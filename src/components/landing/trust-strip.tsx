import { Camera, Heart, PartyPopper, Users } from "lucide-react"

const trustPoints = [[PartyPopper, "Đám cưới & sinh nhật"], [Camera, "Khoảnh khắc từ khách mời"], [Users, "Sự kiện cá nhân & doanh nghiệp"], [Heart, "Lời chúc ở lại sau buổi tiệc"]] as const

export function TrustStrip() {
  return <div aria-label="Các loại trải nghiệm được hỗ trợ" className="mt-10 grid gap-3 border-t border-border/70 pt-5 sm:grid-cols-2 lg:grid-cols-4">{trustPoints.map(([Icon, label]) => <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground"><Icon aria-hidden="true" className="size-4 shrink-0 text-primary" />{label}</div>)}</div>
}
