"use client"

import Link from "next/link"
import { useEffect } from "react"

type DashboardError = Error & { digest?: string }

export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: DashboardError
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error("dashboard_route_error", {
      code: "DASHBOARD_BOUNDARY",
      surface: "dashboard",
      resource: "route-boundary",
      digest: error.digest ?? "unknown",
    })
  }, [error])

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-6 py-16">
      <section className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold">Dashboard đang gặp sự cố</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Dữ liệu chưa thể tải an toàn. Thử lại để giữ nguyên phiên làm việc của bạn.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => unstable_retry()} className="min-h-11 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground">Thử lại</button>
          <Link href="/dashboard" className="inline-flex min-h-11 items-center rounded-xl border border-border px-5 text-sm font-medium">Về dashboard</Link>
        </div>
      </section>
    </main>
  )
}