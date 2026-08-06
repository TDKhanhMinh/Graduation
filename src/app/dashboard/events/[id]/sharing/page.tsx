import { ExternalLink, Link2, QrCode as QrCodeIcon, Settings } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

import { EventSharingActions } from "@/components/sharing/EventSharingActions"
import { QrCode } from "@/components/sharing/QrCode"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SectionHeading } from "@/components/ui/section-heading"
import { StatusBadge } from "@/components/ui/status-badge"
import { getOwnedEventById } from "@/features/events/dal"
import { buildPublicEventUrl } from "@/features/sharing/public-url"
import { getSiteUrl } from "@/lib/supabase/env"

export default async function EventSharingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const event = await getOwnedEventById(id)

  if (!event) {
    notFound()
  }

  const publicUrl = buildPublicEventUrl(getSiteUrl(), event.slug)
  const submissionLabel =
    event.submission_mode === "open"
      ? "Đang mở"
      : event.submission_mode === "approval_required"
        ? "Cần duyệt"
        : "Đã đóng"

  return (
    <div className="space-y-8">
      <SectionHeading
        title="Chia sẻ & QR"
        description="Tạo mã QR và chia sẻ đường dẫn công khai của sự kiện."
        actions={
          <Link href={publicUrl} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline", className: "min-h-(--control-min-size)" })}>
            <ExternalLink aria-hidden="true" />
            Mở trang công khai
          </Link>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)]">
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <QrCodeIcon aria-hidden="true" className="size-5" />
              </span>
              <div className="min-w-0">
                <CardTitle>Mã QR sự kiện</CardTitle>
                <CardDescription className="pt-1">
                  Người tham dự có thể quét mã để mở trang sự kiện.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <QrCode value={publicUrl} className="mx-auto max-w-[20rem]" />
            <div className="space-y-2">
              <p className="text-sm font-medium">Đường dẫn công khai</p>
              <p className="break-all rounded-lg bg-surface-sunken px-3 py-2 text-sm text-muted-foreground">
                {publicUrl}
              </p>
            </div>
            <EventSharingActions title={event.title} slug={event.slug} url={publicUrl} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thông tin chia sẻ</CardTitle>
            <CardDescription>Trạng thái hiện tại của trang công khai.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone="info">{event.visibility}</StatusBadge>
              <StatusBadge tone={event.submission_mode === "closed" ? "warning" : "success"}>
                {submissionLabel}
              </StatusBadge>
            </div>
            <div className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                Mã QR chỉ chứa đường dẫn công khai và không chứa id nội bộ hoặc dữ liệu riêng tư của owner.
              </p>
              <p>
                Khi thay đổi cấu hình sự kiện, hãy dùng lại đường dẫn này để bảo đảm khách mời mở đúng trang.
              </p>
            </div>
            <Link href={"/dashboard/events/" + event.id + "/settings"} className={buttonVariants({ variant: "secondary", className: "min-h-(--control-min-size) w-full" })}>
              <Settings aria-hidden="true" />
              Mở cài đặt sự kiện
            </Link>
            <div className="flex items-start gap-2 rounded-lg border border-border/70 bg-surface-sunken/50 p-3 text-xs leading-5 text-muted-foreground">
              <Link2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>Slug được quản lý trong Cài đặt; đường dẫn chia sẻ không cho phép chỉnh sửa trực tiếp.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}