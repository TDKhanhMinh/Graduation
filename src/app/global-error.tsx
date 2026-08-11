"use client"

import { useEffect } from "react"

type GlobalError = Error & { digest?: string }

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: GlobalError
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error("global_error", {
      code: "GLOBAL_BOUNDARY",
      surface: "root",
      resource: "global-boundary",
      digest: error.digest ?? "unknown",
    })
  }, [error])

  return (
    <html lang="vi">
      <body className="bg-slate-950 text-white">
        <main className="flex min-h-screen items-center justify-center px-6 py-16">
          <section className="w-full max-w-lg rounded-3xl border border-white/15 bg-white/10 p-8 text-center shadow-xl">
            <h1 className="text-2xl font-semibold">Memoria tạm thời không khả dụng</h1>
            <p className="mt-3 text-sm leading-6 text-white/75">Hệ thống đã giữ an toàn cho phiên hiện tại. Vui lòng thử tải lại trang.</p>
            <button type="button" onClick={() => unstable_retry()} className="mt-6 min-h-11 rounded-xl bg-white px-5 text-sm font-medium text-slate-950">Thử lại</button>
          </section>
        </main>
      </body>
    </html>
  )
}