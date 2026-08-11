export default function EventExportLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="h-9 w-56 animate-pulse rounded-lg bg-muted" />
      <div className="h-24 animate-pulse rounded-2xl bg-muted" />
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-44 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <span className="sr-only">Đang tải Export Center</span>
    </div>
  )
}
