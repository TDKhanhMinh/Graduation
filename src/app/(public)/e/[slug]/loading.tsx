import { PageShell } from "@/components/ui/page-shell"

export default function Loading() {
  return (
    <div className="min-h-screen bg-surface-sunken" role="status" aria-label="Đang tải trang sự kiện">
      <header className="border-b bg-background">
        <PageShell className="flex min-h-18 items-center justify-between gap-4 py-3">
          <div className="min-w-0 space-y-2">
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            <div className="h-6 w-48 max-w-full animate-pulse rounded bg-muted" />
          </div>
          <div className="size-11 shrink-0 animate-pulse rounded-lg bg-muted" />
        </PageShell>
      </header>
      <PageShell className="space-y-8 py-6 sm:py-8">
        <div className="grid min-h-[520px] animate-pulse overflow-hidden rounded-[2rem] border bg-card lg:grid-cols-[3fr_2fr]">
          <div className="space-y-4 p-6 sm:p-10 lg:p-14">
            <div className="h-4 w-32 rounded bg-muted" />
            <div className="h-16 w-4/5 rounded bg-muted" />
            <div className="h-6 w-3/5 rounded bg-muted" />
          </div>
          <div className="min-h-64 bg-muted lg:min-h-full" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="h-44 animate-pulse rounded-xl border bg-card"
              aria-hidden="true"
            />
          ))}
        </div>
      </PageShell>
    </div>
  )
}