import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

export function LandingSection({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("scroll-mt-24 border-t py-16 sm:py-24 lg:py-32", className)} {...props} />
}
