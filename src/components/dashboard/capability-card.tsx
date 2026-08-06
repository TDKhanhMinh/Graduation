import type { LucideIcon } from "lucide-react"
import Link from "next/link"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"

type CapabilityCardProps = {
  Icon: LucideIcon
  title: string
  description: string
  detail?: string
  href?: string
  actionLabel?: string
}

export function CapabilityCard({
  Icon,
  title,
  description,
  detail,
  href,
  actionLabel = "Mở khu vực",
}: CapabilityCardProps) {
  return (
    <Card className="h-full bg-surface-sunken/50">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Icon aria-hidden="true" className="size-4" />
            </span>
            <CardTitle className="truncate">{title}</CardTitle>
          </div>
          <StatusBadge tone={href ? "success" : "info"}>{href ? "Sẵn sàng" : "Sắp có"}</StatusBadge>
        </div>
        <CardDescription className="pt-1 leading-6">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-xs leading-5 text-muted-foreground">
          {detail ?? "Khu vực này sẽ được mở khi đường dẫn và hợp đồng khả năng sẵn sàng."}
        </p>
        {href ? (
          <Link
            href={href}
            className="inline-flex min-h-(--control-min-size) items-center rounded-md text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/50"
          >
            {actionLabel}
          </Link>
        ) : null}
      </CardContent>
    </Card>
  )
}