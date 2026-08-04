import type { LucideIcon } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"

type CapabilityCardProps = {
  Icon: LucideIcon
  title: string
  description: string
  detail?: string
}

export function CapabilityCard({ Icon, title, description, detail }: CapabilityCardProps) {
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
          <StatusBadge tone="info">Sắp có</StatusBadge>
        </div>
        <CardDescription className="pt-1 leading-6">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-xs leading-5 text-muted-foreground">
          {detail ?? "Khu vực này sẽ được mở khi route và capability contract sẵn sàng."}
        </p>
      </CardContent>
    </Card>
  )
}