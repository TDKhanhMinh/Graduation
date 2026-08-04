import { Sparkles } from "lucide-react"
import type { ReactNode } from "react"

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
    <main id="main-content" className="flex min-h-screen items-center bg-surface-sunken py-8 sm:py-12">
      <PageShell className="flex justify-center">
        <section className="w-full max-w-md rounded-2xl border bg-surface-elevated p-6 shadow-sm sm:p-8">
          <div className="mb-8 space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles aria-hidden="true" className="size-4" />
              </span>
              <span>Memoria</span>
            </div>
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