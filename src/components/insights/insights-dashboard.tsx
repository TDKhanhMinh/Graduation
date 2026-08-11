import type { EventInsights } from "@/features/insights/contract"

import { InsightsRangeControls } from "./insights-range-controls"

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value)
}

function formatLocalDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(value + "T12:00:00Z"))
}

function MetricCard({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{formatNumber(value)}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  )
}

export function InsightsDashboard({
  eventTitle,
  insights,
  selectedDays,
  selectedTimezone,
  rangeWasAdjusted,
}: {
  eventTitle: string
  insights: EventInsights
  selectedDays: number
  selectedTimezone: string
  rangeWasAdjusted: boolean
}) {
  const trendMax = Math.max(1, ...insights.trend.map((bucket) => bucket.total))
  const trendTotal = insights.trend.reduce((sum, bucket) => sum + bucket.total, 0)
  const hasPartialTrend = trendTotal < insights.summary.total
  const timezones = Array.from(
    new Set([selectedTimezone, insights.range.timezone, "UTC", "Asia/Ho_Chi_Minh", "America/New_York", "Europe/London"]),
  )

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-primary">Dashboard Insights</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{eventTitle}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Tổng hợp owner-only về lời chúc, trạng thái duyệt, media và reaction trong khoảng thời gian đã chọn.
        </p>
      </div>

      <InsightsRangeControls days={selectedDays} timezone={selectedTimezone} timezones={timezones} />

      {rangeWasAdjusted ? (
        <div role="status" className="rounded-xl border border-status-warning/30 bg-status-warning/10 p-4 text-sm leading-6">
          Khoảng thời gian hoặc múi giờ không hợp lệ đã được đưa về giá trị an toàn trước khi tải dữ liệu.
        </div>
      ) : null}

      <section aria-labelledby="insights-summary-heading">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="insights-summary-heading" className="text-xl font-semibold">Tổng quan</h2>
          <p className="text-xs text-muted-foreground">{selectedDays} ngày · {selectedTimezone}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Tổng lời chúc" value={insights.summary.total} detail="Tất cả trạng thái trong range" />
          <MetricCard label="Đã duyệt" value={insights.summary.approved} detail="Sẵn sàng hiển thị công khai" />
          <MetricCard label="Chờ duyệt" value={insights.summary.pending} detail="Cần owner xử lý tiếp" />
          <MetricCard label="Reaction" value={insights.reactions.total} detail="Tổng reaction đã ghi nhận" />
        </div>
      </section>

      <section aria-labelledby="insights-trend-heading" className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 id="insights-trend-heading" className="text-xl font-semibold">Xu hướng theo ngày</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Biểu đồ có bảng dữ liệu tương đương để đọc bằng bàn phím hoặc screen reader.
            </p>
          </div>
          {hasPartialTrend ? (
            <span className="rounded-full bg-status-warning/15 px-2.5 py-1 text-xs font-medium text-status-warning">
              Partial aggregate
            </span>
          ) : null}
        </div>

        {insights.trend.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <p className="font-medium">Chưa có dữ liệu trong khoảng này</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Hãy thử chọn khoảng thời gian dài hơn hoặc quay lại sau khi có lời chúc mới.
            </p>
          </div>
        ) : (
          <>
            <div
              role="img"
              aria-label="Biểu đồ số lời chúc theo ngày"
              className="grid min-h-56 grid-cols-[repeat(auto-fit,minmax(2.25rem,1fr))] items-end gap-2 rounded-xl border border-border bg-surface-sunken/50 p-4"
            >
              {insights.trend.map((bucket) => (
                <div key={bucket.local_date} className="flex min-w-0 flex-col items-center gap-2">
                  <span className="text-[10px] font-medium text-muted-foreground">{formatNumber(bucket.total)}</span>
                  <div className="flex h-36 w-full items-end">
                    <div
                      aria-hidden="true"
                      className="w-full rounded-t-md bg-primary/80 transition-[height]"
                      style={{ height: ((bucket.total / trendMax) * 100).toFixed(2) + "%" }}
                    />
                  </div>
                  <span className="max-w-full truncate text-[10px] text-muted-foreground" title={bucket.local_date}>
                    {bucket.local_date.slice(5)}
                  </span>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[38rem] text-left text-sm">
                <caption className="sr-only">Bảng dữ liệu xu hướng lời chúc theo ngày</caption>
                <thead className="bg-muted/50 text-xs text-muted-foreground">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">Ngày</th>
                    <th scope="col" className="px-4 py-3 font-medium">Tổng</th>
                    <th scope="col" className="px-4 py-3 font-medium">Đã duyệt</th>
                    <th scope="col" className="px-4 py-3 font-medium">Chờ duyệt</th>
                    <th scope="col" className="px-4 py-3 font-medium">Reaction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {insights.trend.map((bucket) => (
                    <tr key={bucket.local_date}>
                      <th scope="row" className="px-4 py-3 font-medium">{formatLocalDate(bucket.local_date)}</th>
                      <td className="px-4 py-3">{formatNumber(bucket.total)}</td>
                      <td className="px-4 py-3">{formatNumber(bucket.approved)}</td>
                      <td className="px-4 py-3">{formatNumber(bucket.pending)}</td>
                      <td className="px-4 py-3">{formatNumber(bucket.reactions)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section aria-labelledby="insights-breakdown-heading">
        <h2 id="insights-breakdown-heading" className="mb-3 text-xl font-semibold">Breakdown</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border p-4">
            <h3 className="font-medium">Media</h3>
            <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
              <div><dt className="text-muted-foreground">Tổng</dt><dd className="mt-1 font-semibold">{formatNumber(insights.media.total)}</dd></div>
              <div><dt className="text-muted-foreground">Ảnh</dt><dd className="mt-1 font-semibold">{formatNumber(insights.media.image)}</dd></div>
              <div><dt className="text-muted-foreground">Audio</dt><dd className="mt-1 font-semibold">{formatNumber(insights.media.audio)}</dd></div>
            </dl>
          </div>
          <div className="rounded-xl border border-border p-4">
            <h3 className="font-medium">Reaction theo emoji</h3>
            {Object.keys(insights.reactions.by_emoji).length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Chưa có reaction trong khoảng này.</p>
            ) : (
              <ul className="mt-3 flex flex-wrap gap-2" aria-label="Reaction theo emoji">
                {Object.entries(insights.reactions.by_emoji).map(([emoji, count]) => (
                  <li key={emoji} className="rounded-full bg-muted px-3 py-1.5 text-sm">
                    <span aria-hidden="true">{emoji}</span> <span className="font-medium">{formatNumber(count)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <p className="text-xs leading-5 text-muted-foreground">
        Aggregate được trả về từ owner-only contract v{insights.schema_version}; dữ liệu có thể trễ nhẹ so với thao tác vừa thực hiện.
      </p>
    </div>
  )
}
