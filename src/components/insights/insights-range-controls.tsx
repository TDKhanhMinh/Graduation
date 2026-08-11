import { Filter } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type InsightsRangeControlsProps = {
  days: number
  timezone: string
  timezones: string[]
}

export function InsightsRangeControls({
  days,
  timezone,
  timezones,
}: InsightsRangeControlsProps) {
  return (
    <form
      method="get"
      className="flex flex-col gap-3 rounded-xl border border-border bg-surface-sunken/50 p-4 sm:flex-row sm:flex-wrap sm:items-end"
      aria-label="Bộ lọc Dashboard Insights"
    >
      <div className="grid gap-1.5">
        <label htmlFor="insights-days" className="text-xs font-medium text-muted-foreground">
          Khoảng thời gian
        </label>
        <select
          id="insights-days"
          name="days"
          defaultValue={String(days)}
          className="min-h-(--control-min-size) rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="7">7 ngày</option>
          <option value="30">30 ngày</option>
          <option value="90">90 ngày</option>
          <option value="180">180 ngày</option>
          <option value="366">366 ngày</option>
        </select>
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="insights-timezone" className="text-xs font-medium text-muted-foreground">
          Múi giờ bucket
        </label>
        <select
          id="insights-timezone"
          name="timezone"
          defaultValue={timezone}
          className="min-h-(--control-min-size) rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {timezones.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className={cn(buttonVariants({ variant: "outline" }), "min-h-(--control-min-size)")}
      >
        <Filter aria-hidden="true" />
        Áp dụng
      </button>
      <p className="text-xs leading-5 text-muted-foreground sm:ml-auto sm:max-w-xs">
        Dữ liệu được tính theo ngày địa phương trong múi giờ đã chọn.
      </p>
    </form>
  )
}
