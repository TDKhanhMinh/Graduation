import Link from "next/link"
import { SearchX } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PageShell } from "@/components/ui/page-shell"

export default function NotFound() {
  return (
    <main className="min-h-screen bg-surface-sunken">
      <PageShell className="flex min-h-screen items-center justify-center py-10">
        <div className="flex w-full max-w-xl flex-col items-center rounded-xl border bg-card px-6 py-10 text-center shadow-sm sm:px-10">
          <span className="flex size-16 items-center justify-center rounded-full bg-muted">
            <SearchX aria-hidden="true" className="size-8 text-muted-foreground" />
          </span>
          <h1 className="mt-5 font-heading text-2xl font-semibold">Không tìm thấy sự kiện</h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Sự kiện không tồn tại, đã bị xóa, đang ở chế độ riêng tư hoặc đường dẫn chưa chính xác.
          </p>
          <Link href="/" className="mt-6">
            <Button className="min-h-(--control-min-size)">Quay về trang chủ</Button>
          </Link>
        </div>
      </PageShell>
    </main>
  )
}