import type { ReactNode } from "react"

import { MemoriaLogo } from "@/components/brand/memoria-logo"
import { AuthVisualShowcase } from "./auth-visual-showcase"

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
    <main id="main-content" className="relative flex min-h-screen overflow-hidden bg-background">
      <div className="flex w-full lg:grid lg:grid-cols-2">
        {/* Left Side: Auth Form */}
        <div className="flex w-full flex-col items-center justify-center py-8 sm:py-12 lg:py-0">
          {/* Mobile Background Blob */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-72 overflow-hidden bg-[radial-gradient(circle_at_15%_15%,color-mix(in_oklch,var(--memory-pink),transparent_75%),transparent_55%),radial-gradient(circle_at_85%_5%,color-mix(in_oklch,var(--brand-400),transparent_78%),transparent_50%)] lg:hidden" />
          
          <section className="relative w-full max-w-md px-6 sm:px-8">
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

            <div className="mt-6 border-t border-border/60 pt-6">{footer}</div>
          </section>
        </div>

        {/* Right Side: Visual Showcase (Hidden on Mobile) */}
        <div className="hidden h-full flex-col justify-center p-4 lg:flex lg:p-6 xl:p-8">
          <AuthVisualShowcase />
        </div>
      </div>
    </main>
  )
}
