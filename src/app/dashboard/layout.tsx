import { LogOut, Sparkles } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ReactNode } from "react"

import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { IconButton } from "@/components/ui/icon-button"
import { PageShell } from "@/components/ui/page-shell"
import { signOut } from "@/app/auth/actions"
import { verifySession } from "@/lib/auth/dal"

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await verifySession()

  if (!session) {
    redirect("/auth/login?next=/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface-sunken">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-3 focus:text-primary-foreground">Skip to main content</a>
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <PageShell className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link
              href="/dashboard"
              className="flex min-h-(--control-min-size) items-center gap-2 rounded-lg font-semibold tracking-tight text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/50"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles aria-hidden="true" className="size-4" />
              </span>
              <span>Memoria</span>
              <span className="hidden text-sm font-normal text-muted-foreground sm:inline">
                Workspace
              </span>
            </Link>

            <form action={signOut}>
              <IconButton label="Đăng xuất" variant="ghost">
                <LogOut aria-hidden="true" />
              </IconButton>
            </form>
          </div>
        </PageShell>
        <div className="border-t lg:hidden">
          <DashboardNav mobile />
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-64 shrink-0 border-r bg-background lg:block">
          <div className="sticky top-16 p-4">
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Workspace
            </p>
            <DashboardNav />
          </div>
        </aside>

        <main id="main-content" className="min-w-0 flex-1">
          <PageShell className="py-6 sm:py-8 md:py-10">{children}</PageShell>
        </main>
      </div>
    </div>
  )
}