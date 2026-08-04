"use client"

import {
  Download,
  LayoutDashboard,
  Palette,
  QrCode,
  Settings,
  ShieldCheck,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const items = [
  { segment: "", label: "Tổng quan", Icon: LayoutDashboard, available: true },
  {
    segment: "/moderation",
    label: "Kiểm duyệt",
    Icon: ShieldCheck,
    available: true,
  },
  { segment: "/settings", label: "Cài đặt", Icon: Settings, available: true },
  {
    segment: "/appearance",
    label: "Giao diện",
    Icon: Palette,
    available: false,
  },
  {
    segment: "/sharing",
    label: "Chia sẻ & QR",
    Icon: QrCode,
    available: false,
  },
  {
    segment: "/export",
    label: "Xuất dữ liệu",
    Icon: Download,
    available: false,
  },
] as const

export function EventNav({ eventId }: { eventId: string }) {
  const pathname = usePathname()
  const basePath = "/dashboard/events/" + eventId

  return (
    <nav aria-label="Điều hướng sự kiện" className="space-y-2">
      <ul className="flex max-w-full flex-wrap gap-1 border-b">
        {items.map(({ segment, label, Icon, available }) => {
          const href = basePath + segment
          const isActive = segment
            ? pathname.startsWith(href)
            : pathname === basePath

          return (
            <li key={href}>
              {available ? (
                <Link
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-(--control-min-size) max-w-full items-center gap-2 rounded-t-lg border-b-2 px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/50",
                    isActive
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:border-muted hover:text-foreground"
                  )}
                >
                  <Icon aria-hidden="true" className="size-4 shrink-0" />
                  <span className="truncate">{label}</span>
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  title={`${label} sẽ được mở trong phiên bản sau`}
                  className="inline-flex min-h-(--control-min-size) max-w-full cursor-not-allowed items-center gap-2 rounded-t-lg border-b-2 border-transparent px-3 text-sm font-medium text-muted-foreground/60"
                >
                  <Icon aria-hidden="true" className="size-4 shrink-0" />
                  <span className="truncate">{label}</span>
                  <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                    Sắp có
                  </span>
                </span>
              )}
            </li>
          )
        })}
      </ul>
      <p className="text-xs text-muted-foreground">
        Các mục mờ là capability chưa có route hoặc backend contract; chúng chưa phải là
        thao tác khả dụng.
      </p>
    </nav>
  )
}