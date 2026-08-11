export default function EventInsightsLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="h-9 w-64 animate-pulse rounded-lg bg-muted" />
      <div className="h-20 animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-28 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-xl bg-muted" />
      <span className="sr-only">Đang tải Dashboard Insights</span>
    </div>
  )
}
