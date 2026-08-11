"use client"

import Link from "next/link"
import { useEffect } from "react"

type AppError = Error & { digest?: string }

export default function Error({
  error,
  unstable_retry,
}: {
  error: AppError
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error("route_error", {
      code: "ROUTE_BOUNDARY",
      surface: "public",
      resource: "route-boundary",
      digest: error.digest ?? "unknown",
    })
  }, [error])

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-6 py-16">
      <section className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Memoria</p>
        <h1 className="mt-3 text-2xl font-semibold">Có lỗi xảy ra</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Trang chưa thể hiển thị lúc này. Bạn có thể thử lại hoặc quay về nơi an toàn.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => unstable_retry()} className="min-h-11 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground">
            Thử lại
          </button>
          <Link href="/" className="inline-flex min-h-11 items-center rounded-xl border border-border px-5 text-sm font-medium">Về trang chủ</Link>
          <Link href="/dashboard" className="inline-flex min-h-11 items-center rounded-xl border border-border px-5 text-sm font-medium">Mở dashboard</Link>
        </div>
      </section>
    </main>
  )
}