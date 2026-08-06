import Link from "next/link"

import { MemoriaLogo } from "@/components/brand/memoria-logo"
import { PageShell } from "@/components/ui/page-shell"

const groups = [{ title: "Product", links: [["How It Works", "#how-it-works"], ["Template Showcase", "#template-showcase"], ["Public Wall", "#public-wall"], ["Features", "#features"]] }, { title: "Solutions", links: [["Đám cưới", "#use-cases"], ["Sinh nhật", "#use-cases"], ["Tốt nghiệp", "#use-cases"], ["Doanh nghiệp", "#use-cases"]] }, { title: "Support", links: [["FAQ", "#faq"], ["Đăng nhập", "/auth/login"], ["Tạo sự kiện miễn phí", "/auth/sign-up"]] }] as const

export function LandingFooter() {
  return <footer className="border-t bg-background py-12 sm:py-16"><PageShell><div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(4,1fr)]"><div className="space-y-4"><Link href="/" aria-label="Memoria - Trang chủ" className="inline-flex rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/50"><MemoriaLogo /></Link><p className="max-w-xs text-sm leading-7 text-muted-foreground">Poster là nơi mọi kỷ niệm bắt đầu — từ lời chúc đầu tiên đến Public Wall của sự kiện.</p></div>{groups.map((group) => <div key={group.title} className="space-y-4"><h2 className="text-sm font-semibold">{group.title}</h2><ul className="space-y-2 text-sm text-muted-foreground">{group.links.map(([label, href]) => <li key={`${group.title}-${label}`}><a href={href} className="inline-flex min-h-11 items-center rounded-md hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/50">{label}</a></li>)}</ul></div>)}<div className="space-y-4"><h2 className="text-sm font-semibold">Legal</h2><p className="text-sm leading-6 text-muted-foreground">Điều khoản và chính sách bảo mật sẽ được liên kết khi các route pháp lý được phát hành.</p></div></div><div className="mt-10 border-t pt-6 text-sm text-muted-foreground">© {new Date().getFullYear()} Memoria.</div></PageShell></footer>
}
