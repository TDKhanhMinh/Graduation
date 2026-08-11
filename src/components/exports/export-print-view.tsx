import type { OwnerExportSnapshot } from "@/features/exports/contract"

import { ExportPrintControls } from "./export-print-controls"

function formatEventDate(value: string | null, timezone: string) {
  if (!value) return "Chưa cập nhật"

  try {
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: timezone,
    }).format(new Date(value))
  } catch {
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "UTC",
    }).format(new Date(value))
  }
}

function formatWishDate(value: string, timezone: string) {
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

export function ExportPrintView({ snapshot }: { snapshot: OwnerExportSnapshot }) {
  const { event, wishes } = snapshot
  const backHref = "/dashboard/events/" + event.id + "/export"

  return (
    <div className="mx-auto max-w-4xl print:max-w-none">
      <ExportPrintControls backHref={backHref} />

      <article className="rounded-2xl border border-border bg-background p-6 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <header className="border-b border-border pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Memoria · Event export
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">{event.title}</h1>
          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium">Ngày sự kiện</dt>
              <dd className="mt-1 text-muted-foreground">{formatEventDate(event.event_date, event.timezone)}</dd>
            </div>
            <div>
              <dt className="font-medium">Địa điểm</dt>
              <dd className="mt-1 text-muted-foreground">
                {event.location_name || event.location_address || "Chưa cập nhật"}
              </dd>
            </div>
          </dl>
        </header>

        <section className="mt-8" aria-labelledby="export-wishes-heading">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="export-wishes-heading" className="text-xl font-semibold">
              Lời chúc ({wishes.length})
            </h2>
            <p className="text-xs text-muted-foreground">Snapshot v{snapshot.schema_version}</p>
          </div>

          {wishes.length > 0 ? (
            <ol className="mt-5 space-y-4">
              {wishes.map((wish) => (
                <li
                  key={wish.id}
                  className="break-inside-avoid rounded-xl border border-border p-4 print:rounded-none"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="font-medium">{wish.sender_name}</p>
                    <time className="text-xs text-muted-foreground" dateTime={wish.created_at}>
                      {formatWishDate(wish.created_at, event.timezone)}
                    </time>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6">
                    {wish.content || "Không có nội dung"}
                  </p>
                  {wish.is_pinned ? (
                    <p className="mt-3 text-xs font-medium text-muted-foreground">Đã ghim</p>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-5 rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              Chưa có lời chúc trong snapshot này.
            </p>
          )}
        </section>

        <footer className="mt-10 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
          Bản in dành cho owner của sự kiện. Snapshot được tạo lúc {formatWishDate(snapshot.consistency_at, event.timezone)}.
        </footer>
      </article>
    </div>
  )
}
