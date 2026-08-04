import {
  CircleAlert,
  CircleCheck,
  Inbox,
  LoaderCircle,
} from "lucide-react"
import * as React from "react"

import { cn } from "@/lib/utils"

const feedbackConfig = {
  loading: {
    Icon: LoaderCircle,
    iconClassName: "text-status-info",
    role: "status" as const,
  },
  empty: {
    Icon: Inbox,
    iconClassName: "text-muted-foreground",
    role: "status" as const,
  },
  error: {
    Icon: CircleAlert,
    iconClassName: "text-status-danger",
    role: "alert" as const,
  },
  success: {
    Icon: CircleCheck,
    iconClassName: "text-status-success",
    role: "status" as const,
  },
} as const

type FeedbackStateProps = {
  status: keyof typeof feedbackConfig
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function FeedbackState({
  status,
  title,
  description,
  action,
  className,
}: FeedbackStateProps) {
  const { Icon, iconClassName, role } = feedbackConfig[status]

  return (
    <div
      data-slot="feedback-state"
      data-status={status}
      role={role}
      className={cn(
        "flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed bg-surface-sunken px-6 py-10 text-center",
        className
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn("size-8", iconClassName, status === "loading" && "animate-spin")}
      />
      <h2 className="mt-4 text-base font-semibold">{title}</h2>
      {description ? (
        <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}