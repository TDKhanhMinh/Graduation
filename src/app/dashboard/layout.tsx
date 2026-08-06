import { LogOut } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ReactNode } from "react"

import { signOut } from "@/app/auth/actions"
import { MemoriaLogo } from "@/components/brand/memoria-logo"
import { SparkleDecoration } from "@/components/brand/sparkle-decoration"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { IconButton } from "@/components/ui/icon-button"
import { PageShell } from "@/components/ui/page-shell"
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
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-3 focus:text-primary-foreground">Bỏ qua đến nội dung chính</a>
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/75">
        <PageShell className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link
              href="/dashboard"
              aria-label="Memoria - về bảng điều khiển"
              className="flex min-h-(--control-min-size) items-center rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/50"
            >
              <MemoriaLogo />
            </Link>

            <div className="flex items-center gap-3">
              <span className="hidden rounded-full bg-primary/8 px-3 py-1.5 text-xs font-medium text-primary sm:inline-flex">
                Không gian làm việc
              </span>
              <form action={signOut}>
                <IconButton type="submit" label="Đăng xuất" variant="ghost">
                  <LogOut aria-hidden="true" />
                </IconButton>
              </form>
            </div>
          </div>
        </PageShell>
        <div className="border-t border-border/70 bg-muted/25 lg:hidden">
          <DashboardNav mobile />
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-72 shrink-0 border-r border-border/80 bg-background/70 lg:block">
          <div className="sticky top-16 flex min-h-[calc(100vh-4rem)] flex-col p-5">
            <div className="mb-8 rounded-2xl border border-primary/10 bg-primary/5 p-4">
              <div className="relative">
                <MemoriaLogo compact />
                <SparkleDecoration className="right-0 top-0 size-12" />
              </div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                Quản lý sự kiện và những lời chúc đáng nhớ.
              </p>
            </div>
            <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Điều hướng
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
