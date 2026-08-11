import { Download, FileJson, FileText, Printer } from "lucide-react"
import Link from "next/link"

import type { OwnerExportSnapshot } from "@/features/exports/contract"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SectionHeading } from "@/components/ui/section-heading"
import { StatusBadge } from "@/components/ui/status-badge"

function formatTimestamp(value: string, timezone: string) {
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: timezone,
    }).format(new Date(value))
  } catch {
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    }).format(new Date(value))
  }
}

export function ExportCenter({ snapshot }: { snapshot: OwnerExportSnapshot }) {
  const { event, wishes } = snapshot
  const csvHref = "/api/exports/" + event.id + "/csv"
  const jsonHref = "/api/exports/" + event.id + "/json"
  const printHref = "/dashboard/events/" + event.id + "/export/print"

  return (
    <div className="space-y-8">
      <SectionHeading
        title="Export Center"
        description="Tải snapshot lời chúc của sự kiện theo định dạng phù hợp với nhu cầu lưu trữ hoặc xử lý tiếp."
        actions={
          <Link
            href={printHref}
            className={buttonVariants({ variant: "outline", className: "min-h-(--control-min-size)" })}
          >
            <Printer aria-hidden="true" />
            Mở bản in
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="success">Snapshot riêng tư</StatusBadge>
            <StatusBadge tone="info">{wishes.length} lời chúc</StatusBadge>
          </div>
          <CardTitle className="pt-2">{event.title}</CardTitle>
          <CardDescription>
            Snapshot được tạo lúc {formatTimestamp(snapshot.consistency_at, event.timezone)} theo múi giờ {event.timezone}.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Link
            href={csvHref}
            className="group rounded-xl border border-border bg-background p-4 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <FileText aria-hidden="true" className="size-5 text-primary" />
            <p className="mt-3 font-medium">CSV</p>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              Dữ liệu dạng bảng, phù hợp với spreadsheet.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
              <Download aria-hidden="true" className="size-4" />
              Tải CSV
            </span>
          </Link>
          <Link
            href={jsonHref}
            className="group rounded-xl border border-border bg-background p-4 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <FileJson aria-hidden="true" className="size-5 text-primary" />
            <p className="mt-3 font-medium">JSON</p>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              Payload có schema version để tích hợp hoặc lưu trữ máy đọc.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
              <Download aria-hidden="true" className="size-4" />
              Tải JSON
            </span>
          </Link>
          <Link
            href={printHref}
            className="group rounded-xl border border-border bg-background p-4 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Printer aria-hidden="true" className="size-5 text-primary" />
            <p className="mt-3 font-medium">Bản in</p>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              Bố cục tuyến tính, tối ưu cho print preview và giấy A4.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
              Mở bản in
            </span>
          </Link>
        </CardContent>
      </Card>

      {wishes.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="font-medium">Chưa có lời chúc để export</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Các file vẫn giữ metadata sự kiện và header schema để có thể lưu trữ ngay.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Phạm vi snapshot</CardTitle>
            <CardDescription>
              Export chỉ chứa dữ liệu owner được phép xem tại thời điểm snapshot; không mở dữ liệu cho khách công khai.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-lg bg-surface-sunken p-3">
              <p className="font-medium">Sự kiện</p>
              <p className="mt-1 text-muted-foreground">{event.slug}</p>
            </div>
            <div className="rounded-lg bg-surface-sunken p-3">
              <p className="font-medium">Schema</p>
              <p className="mt-1 text-muted-foreground">Owner export v{snapshot.schema_version}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
