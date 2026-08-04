import * as React from "react"

import { cn } from "@/lib/utils"

export function PageShell({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="page-shell"
      className={cn(
        "mx-auto w-full max-w-(--content-max-width) px-(--page-gutter)",
        className
      )}
      {...props}
    />
  )
}