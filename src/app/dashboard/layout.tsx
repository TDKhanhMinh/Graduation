import { LayoutDashboard, LogOut } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ReactNode } from "react"

import { signOut } from "@/app/auth/actions"
import { Button } from "@/components/ui/button"
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
    <div className="flex min-h-screen flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <LayoutDashboard className="h-5 w-5" />
          <span>Dashboard</span>
        </Link>
        <div className="ml-auto flex items-center space-x-4">
          <form action={signOut}>
            <Button
              aria-label="Đăng xuất"
              title="Đăng xuất"
              variant="ghost"
              size="icon"
              type="submit"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  )
}
