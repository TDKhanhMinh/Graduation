import { Download, ExternalLink, Palette, QrCode, Settings } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

import { CapabilityCard } from "@/components/dashboard/capability-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SectionHeading } from "@/components/ui/section-heading"
import { StatusBadge } from "@/components/ui/status-badge"
import { getOwnedEventById } from "@/features/events/dal"

export default async function EventOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const event = await getOwnedEventById(id)

  if (!event) {
    notFound()
  }

  const publicUrl = "/e/" + event.slug

  return (
    <div className="space-y-8">
      <SectionHeading
        title="Tổng quan sự kiện"
        description="Theo dõi trạng thái hiển thị và luồng nhận lời chúc."
      />

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <CardTitle className="text-base">Truy cập công khai</CardTitle>
            <ExternalLink aria-hidden="true" className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <StatusBadge tone="info">{event.visibility}</StatusBadge>
            <p className="truncate text-sm text-muted-foreground">{publicUrl}</p>
            <Link href={publicUrl} target="_blank" rel="noreferrer">
              <Button variant="outline" className="min-h-(--control-min-size) w-full">
                Mở trang sự kiện
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <CardTitle className="text-base">Trạng thái nhận lời chúc</CardTitle>
            <Settings aria-hidden="true" className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            <StatusBadge tone={event.submission_mode === "closed" ? "warning" : "success"}>
              {event.submission_mode === "open"
                ? "Đang mở"
                : event.submission_mode === "approval_required"
                  ? "Cần duyệt"
                  : "Đã đóng"}
            </StatusBadge>
            <p className="text-sm leading-6 text-muted-foreground">
              {event.submission_mode === "open"
                ? "Lời chúc được nhận và hiển thị theo cấu hình sự kiện."
                : event.submission_mode === "approval_required"
                  ? "Lời chúc cần được duyệt trước khi hiển thị."
                  : "Sự kiện đã dừng nhận lời chúc mới."}
            </p>
            <Link href={"/dashboard/events/" + event.id + "/settings"}>
              <Button variant="secondary" className="min-h-(--control-min-size) w-full">
                <Settings aria-hidden="true" />
                Mở cài đặt
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4" aria-labelledby="workspace-capabilities-heading">
        <div>
          <h2 id="workspace-capabilities-heading" className="font-heading text-xl font-semibold">
            Không gian quản lý
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Các khu vực mở rộng được hiển thị rõ trạng thái để bạn không đi vào dead-end.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <CapabilityCard
            Icon={Palette}
            title="Giao diện"
            description="Chuẩn bị bố cục, màu sắc và kiểu hiển thị riêng cho sự kiện."
            href={"/dashboard/events/" + event.id + "/appearance"}
            actionLabel="Open appearance editor"
          />
          <CapabilityCard
            Icon={QrCode}
            title="Chia sẻ & QR"
            description="Tạo bộ liên kết và mã QR để chia sẻ trang sự kiện."
            href={"/dashboard/events/" + event.id + "/sharing"}
            actionLabel="Mở chia sẻ & QR"
          />
          <CapabilityCard
            Icon={Download}
            title="Xuất dữ liệu"
            description="Theo dõi và tải xuống dữ liệu lời chúc theo quyền của owner."
            detail="Chưa có route export khả dụng cho sự kiện này; không hiển thị thao tác tải giả."
          />
        </div>
      </section>
    </div>
  )
}