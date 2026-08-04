"use client"

import { CalendarPlus, LayoutDashboard } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

const items = [
  {
    href: "/dashboard",
    label: "Tổng quan",
    Icon: LayoutDashboard,
  },
  {
    href: "/dashboard/events/new",
    label: "Tạo sự kiện",
    Icon: CalendarPlus,
  },
] as const

export function DashboardNav({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname()

  return (
    <nav aria-label="Điều hướng dashboard">
      <ul className={cn(mobile ? "grid grid-cols-2" : "space-y-1")}>
        {items.map(({ href, label, Icon }) => {
          const isActive = pathname === href

          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-(--control-min-size) items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/50",
                  mobile
                    ? "justify-center border-r border-border last:border-r-0"
                    : "w-full hover:bg-muted",
                  isActive
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon aria-hidden="true" className="size-4 shrink-0" />
                <span>{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}