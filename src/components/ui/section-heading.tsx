import * as React from "react"

import { cn } from "@/lib/utils"

type SectionHeadingProps = {
  as?: "h1" | "h2" | "h3"
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function SectionHeading({
  as: Heading = "h2",
  title,
  description,
  actions,
  className,
}: SectionHeadingProps) {
  return (
    <div
      data-slot="section-heading"
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <Heading className="font-heading text-2xl font-semibold tracking-tight">
          {title}
        </Heading>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  )
}