"use client"

import { Clapperboard, LayoutDashboard, Palette, QrCode, Settings, ShieldCheck, Download } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const items = [
  { segment: "", label: "Tổng quan", Icon: LayoutDashboard, available: true },
  { segment: "/moderation", label: "Kiểm duyệt", Icon: ShieldCheck, available: true },
  { segment: "/settings", label: "Cài đặt", Icon: Settings, available: true },
  { segment: "/appearance", label: "Giao diện", Icon: Palette, available: true },
  { segment: "/poster-studio", label: "Poster Studio", Icon: Palette, available: true },
  { segment: "/director", label: "Director", Icon: Clapperboard, available: true },
  { segment: "/sharing", label: "Chia sẻ & QR", Icon: QrCode, available: true },
  { segment: "/export", label: "Xuất dữ liệu", Icon: Download, available: false },
] as const

export function EventNav({ eventId }: { eventId: string }) {
  const pathname = usePathname()
  const basePath = "/dashboard/events/" + eventId

  return (
    <nav aria-label="Điều hướng sự kiện" className="space-y-2">
      <div className="-mx-2 overflow-x-auto px-2 pb-px">
        <ul className="flex min-w-max gap-1 border-b">
          {items.map(({ segment, label, Icon, available }) => {
            const href = basePath + segment
            const isActive = segment ? pathname.startsWith(href) : pathname === basePath

            return (
              <li key={href} className="shrink-0">
                {available ? (
                  <Link
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "inline-flex min-h-(--control-min-size) items-center gap-2 rounded-t-xl border-b-2 px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/50",
                      isActive ? "border-primary bg-primary/8 text-primary" : "border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    )}
                  >
                    <Icon aria-hidden="true" className="size-4 shrink-0" />
                    <span>{label}</span>
                  </Link>
                ) : (
                  <span aria-disabled="true" title={`${label} sẽ được mở trong phiên bản sau`} className="inline-flex min-h-(--control-min-size) items-center gap-2 rounded-t-xl border-b-2 border-transparent px-3 text-sm font-medium text-muted-foreground/60">
                    <Icon aria-hidden="true" className="size-4 shrink-0" />
                    <span>{label}</span>
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">Sắp có</span>
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      </div>
      <p className="text-xs leading-5 text-muted-foreground">Các mục hiển thị theo capability đã có route và handler thật.</p>
    </nav>
  )
}