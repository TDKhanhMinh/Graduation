import type { ReactNode } from "react"

import { MemoriaLogo } from "@/components/brand/memoria-logo"
import { SparkleDecoration } from "@/components/brand/sparkle-decoration"
import { PageShell } from "@/components/ui/page-shell"

type AuthPageShellProps = {
  title: string
  description: string
  alert?: ReactNode
  footer: ReactNode
  children: ReactNode
}

export function AuthPageShell({
  title,
  description,
  alert,
  footer,
  children,
}: AuthPageShellProps) {
  return (
    <main id="main-content" className="relative flex min-h-screen items-center overflow-hidden bg-surface-sunken py-8 sm:py-12">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-72 overflow-hidden bg-[radial-gradient(circle_at_15%_15%,color-mix(in_oklch,var(--memory-pink),transparent_75%),transparent_55%),radial-gradient(circle_at_85%_5%,color-mix(in_oklch,var(--brand-400),transparent_78%),transparent_50%)]" />
      <SparkleDecoration className="right-[12%] top-20 hidden size-16 sm:block" />
      <PageShell className="flex justify-center">
        <section className="relative w-full max-w-md rounded-3xl border border-border/80 bg-card/95 p-6 shadow-[0_24px_80px_-48px_var(--brand-700)] backdrop-blur sm:p-8">
          <div className="mb-8 space-y-4">
            <MemoriaLogo />
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary/80">
              Không gian lưu giữ kỷ niệm
            </p>
            <div className="space-y-2">
              <h1 className="font-heading text-3xl font-semibold tracking-tight">
                {title}
              </h1>
              <p className="text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </div>
          </div>

          {alert ? <div className="mb-5">{alert}</div> : null}

          {children}

          <div className="mt-6 border-t pt-6">{footer}</div>
        </section>
      </PageShell>
    </main>
  )
}
