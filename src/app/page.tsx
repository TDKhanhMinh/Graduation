import {
  ArrowRight,
  MessageSquareHeart,
  QrCode,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { PageShell } from "@/components/ui/page-shell"
import { verifySession } from "@/lib/auth/dal"

export const dynamic = "force-dynamic"

const features = [
  {
    Icon: QrCode,
    title: "Quét mã và gửi",
    description:
      "Khách mời không cần tải app hay đăng nhập. Chỉ cần quét mã QR để gửi lời chúc và media ngay lập tức.",
    tone: "text-status-info",
    surface: "bg-status-info/10",
  },
  {
    Icon: MessageSquareHeart,
    title: "Tương tác realtime",
    description:
      "Lời chúc, hình ảnh và reaction hiển thị ngay trên màn hình sự kiện, tạo không khí sôi động và gắn kết.",
    tone: "text-status-danger",
    surface: "bg-status-danger/10",
  },
  {
    Icon: ShieldCheck,
    title: "Kiểm duyệt an toàn",
    description:
      "Quản lý nội dung dễ dàng và duyệt lời chúc trước khi chúng được hiển thị công khai.",
    tone: "text-status-success",
    surface: "bg-status-success/10",
  },
] as const

export default async function Home() {
  const session = await verifySession()

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-surface-sunken text-foreground">
      <header className="sticky inset-x-0 top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <PageShell className="flex h-16 items-center justify-between gap-4">
          <Link
            href="/"
            className="flex min-h-(--control-min-size) items-center gap-2 rounded-lg font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/50"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles aria-hidden="true" className="size-4" />
            </span>
            <span>Memoria</span>
          </Link>

          {session ? (
            <Link href="/dashboard">
              <Button variant="secondary">Dashboard</Button>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login" className="hidden sm:block">
                <Button variant="ghost">Đăng nhập</Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button className="min-h-(--control-min-size)">Bắt đầu</Button>
              </Link>
            </div>
          )}
        </PageShell>
      </header>

      <main id="main-content" className="flex-1">
        <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[40rem] overflow-hidden opacity-40"
          >
            <div className="absolute -left-24 top-0 size-96 rounded-full bg-status-success/20 blur-[120px]" />
            <div className="absolute right-0 top-24 size-80 rounded-full bg-status-info/20 blur-[100px]" />
          </div>

          <PageShell>
            <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.85fr] lg:gap-20">
              <div className="space-y-8 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-status-success/30 bg-status-success/10 px-3 py-1.5 text-sm font-medium text-status-success">
                  <Sparkles aria-hidden="true" className="size-4" />
                  <span>Nền tảng lưu giữ kỷ niệm thế hệ mới</span>
                </div>

                <div className="space-y-5">
                  <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
                    Lưu giữ mọi{" "}
                    <span className="text-status-success">khoảnh khắc đẹp</span>
                  </h1>
                  <p className="mx-auto max-w-xl text-base leading-7 text-muted-foreground sm:text-lg lg:mx-0">
                    Tạo không gian số tương tác cho sự kiện của bạn. Thu thập lời
                    chúc, hình ảnh và video từ khách mời chỉ qua một mã QR đơn giản.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                  <Link
                    href={session ? "/dashboard" : "/auth/sign-up"}
                    className="w-full sm:w-auto"
                  >
                    <Button size="lg" className="min-h-14 w-full sm:w-auto">
                      {session ? "Truy cập dashboard" : "Tạo sự kiện miễn phí"}
                      <ArrowRight aria-hidden="true" />
                    </Button>
                  </Link>
                  {!session ? (
                    <Link href="/auth/login" className="w-full sm:w-auto">
                      <Button size="lg" variant="outline" className="min-h-14 w-full sm:w-auto">
                        Đã có tài khoản
                      </Button>
                    </Link>
                  ) : null}
                </div>
              </div>

              <div className="mx-auto w-full max-w-lg">
                <div className="overflow-hidden rounded-3xl border bg-surface-elevated shadow-xl">
                  <div className="flex items-center justify-between border-b bg-surface-sunken px-6 py-4">
                    <div className="h-2 w-12 rounded-full bg-muted-foreground/40" />
                    <div className="flex gap-2">
                      <span className="size-2 rounded-full bg-status-danger" />
                      <span className="size-2 rounded-full bg-status-warning" />
                      <span className="size-2 rounded-full bg-status-success" />
                    </div>
                  </div>
                  <div className="space-y-5 p-6">
                    <div className="h-40 w-full animate-pulse rounded-2xl bg-muted" />
                    {["success", "info"].map((tone) => (
                      <div className="flex gap-4" key={tone}>
                        <div className="size-12 shrink-0 animate-pulse rounded-full bg-muted" />
                        <div className="flex-1 space-y-2 pt-2">
                          <div className="h-3 w-1/3 rounded-full bg-muted-foreground/30" />
                          <div className="h-3 w-3/4 rounded-full bg-muted" />
                          <div className="h-3 w-1/2 rounded-full bg-muted" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mx-6 mb-6 rounded-2xl border bg-background p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-full bg-status-danger/10 text-status-danger">
                        <MessageSquareHeart aria-hidden="true" className="size-5" />
                      </span>
                      <div>
                        <p className="text-sm font-medium">+12 lời chúc mới</p>
                        <p className="text-xs text-muted-foreground">Vừa xong</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </PageShell>
        </section>

        <section className="border-t bg-background py-16 sm:py-24 lg:py-32">
          <PageShell>
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                Mọi thứ bạn cần cho một sự kiện trọn vẹn
              </h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                Đơn giản, bảo mật và tương tác theo thời gian thực.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ Icon, title, description, tone, surface }) => (
                <article
                  className="rounded-2xl border bg-surface-elevated p-6 transition-colors hover:bg-surface-sunken sm:p-8"
                  key={title}
                >
                  <div className={"mb-6 flex size-12 items-center justify-center rounded-2xl " + surface + " " + tone}>
                    <Icon aria-hidden="true" className="size-6" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </PageShell>
        </section>
      </main>

      <footer className="border-t bg-background py-8 text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Memoria. Bản quyền thuộc về bạn.
        </p>
      </footer>
    </div>
  )
}