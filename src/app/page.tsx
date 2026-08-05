import {
  ArrowRight,
  MessageSquareHeart,
  QrCode,
  ShieldCheck,
  Sparkles,
  PartyPopper,
  Users,
  GraduationCap,
  Heart,
  Image as ImageIcon,
  MonitorPlay,
  Rocket,
  User,
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

const steps = [
  {
    number: "01",
    title: "Tạo không gian",
    description: "Tạo sự kiện của bạn trong vài giây và tùy chỉnh giao diện trình chiếu theo ý thích.",
    Icon: Rocket,
  },
  {
    number: "02",
    title: "Khách mời quét mã",
    description: "Chia sẻ mã QR. Khách mời dùng điện thoại quét mã để truy cập ngay không cần cài app.",
    Icon: QrCode,
  },
  {
    number: "03",
    title: "Tương tác trực tiếp",
    description: "Hình ảnh và lời chúc của khách sẽ hiện lên màn hình lớn ngay lập tức cùng với các reaction.",
    Icon: MonitorPlay,
  },
] as const

const useCases = [
  {
    title: "Đám cưới",
    description: "Lưu giữ khoảnh khắc thiêng liêng và nhận lời chúc từ mọi khách mời.",
    Icon: Heart,
    color: "from-pink-500/20 to-rose-500/20",
    iconColor: "text-pink-500",
  },
  {
    title: "Sinh nhật",
    description: "Tạo sự bất ngờ với cơn mưa lời chúc hiện lên màn hình bữa tiệc.",
    Icon: PartyPopper,
    color: "from-orange-500/20 to-amber-500/20",
    iconColor: "text-orange-500",
  },
  {
    title: "Year End Party",
    description: "Gắn kết nhân viên, vinh danh cá nhân và chia sẻ hình ảnh nội bộ.",
    Icon: Users,
    color: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-500",
  },
  {
    title: "Lễ tốt nghiệp",
    description: "Lưu lại những bức ảnh kỷ yếu và lời dặn dò từ thầy cô, bạn bè.",
    Icon: GraduationCap,
    color: "from-status-success/20 to-emerald-500/20",
    iconColor: "text-status-success",
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
            className="flex min-h-[44px] items-center gap-2 rounded-lg font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/50"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles aria-hidden="true" className="size-4" />
            </span>
            <span>Memoria</span>
          </Link>

          {session ? (
            <Link href="/dashboard">
              <Button variant="secondary" className="min-h-[44px]">Dashboard</Button>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login" className="hidden sm:block">
                <Button variant="ghost" className="min-h-[44px]">Đăng nhập</Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button className="min-h-[44px]">Bắt đầu</Button>
              </Link>
            </div>
          )}
        </PageShell>
      </header>

      <main id="main-content" className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32">
          {/* Background glows */}
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
                <div className="inline-flex items-center gap-2 rounded-full border border-status-success/30 bg-status-success/10 px-3 py-1.5 text-sm font-medium text-status-success transition-colors hover:bg-status-success/20 cursor-default">
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
                    <Button size="lg" className="min-h-[44px] w-full sm:w-auto sm:min-h-14">
                      {session ? "Truy cập dashboard" : "Tạo sự kiện miễn phí"}
                      <ArrowRight aria-hidden="true" className="ml-2 size-5" />
                    </Button>
                  </Link>
                  {!session ? (
                    <Link href="/auth/login" className="w-full sm:w-auto">
                      <Button size="lg" variant="outline" className="min-h-[44px] w-full sm:w-auto sm:min-h-14">
                        Đã có tài khoản
                      </Button>
                    </Link>
                  ) : null}
                </div>
              </div>

              {/* Mockup UI */}
              <div className="mx-auto w-full max-w-lg lg:max-w-none">
                <div className="relative overflow-hidden rounded-3xl border bg-surface-elevated shadow-2xl">
                  {/* Browser Window Header */}
                  <div className="flex items-center justify-between border-b bg-surface-sunken px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="flex gap-2">
                        <span className="size-3 rounded-full bg-status-danger" />
                        <span className="size-3 rounded-full bg-status-warning" />
                        <span className="size-3 rounded-full bg-status-success" />
                      </div>
                      <div className="h-6 w-32 rounded-md bg-muted-foreground/10 sm:w-48" />
                    </div>
                  </div>
                  
                  {/* App Content Simulation */}
                  <div className="relative h-[400px] w-full bg-background p-6">
                    {/* Simulated big image placeholder */}
                    <div className="absolute inset-0 bg-muted/30">
                       <div className="absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2 text-muted-foreground/40">
                         <ImageIcon className="size-24" />
                       </div>
                    </div>
                    
                    {/* Simulated floating message */}
                    <div className="absolute bottom-6 left-6 max-w-[80%] rounded-2xl border bg-background/90 p-4 shadow-lg backdrop-blur sm:bottom-12 sm:left-12 sm:p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <User className="size-5" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-sm sm:text-base">Minh Quân</p>
                          <p className="text-sm text-muted-foreground sm:text-base">
                            Chúc hai bạn trăm năm hạnh phúc! 🎉
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Notification pill */}
                    <div className="absolute right-6 top-6 animate-pulse rounded-full border bg-background/90 px-4 py-2 text-sm font-medium shadow-sm backdrop-blur">
                      <div className="flex items-center gap-2 text-status-danger">
                        <Heart className="size-4 fill-status-danger" />
                        <span>+12 reaction</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </PageShell>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section className="border-t bg-background py-16 sm:py-24 lg:py-32">
          <PageShell>
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                3 bước đơn giản để bắt đầu
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
                Không cần cài đặt phức tạp, Memoria được thiết kế để ai cũng có thể sử dụng dễ dàng.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3 md:gap-6 lg:gap-12">
              {steps.map((step, index) => (
                <div key={step.number} className="relative flex flex-col items-center text-center md:items-start md:text-left">
                  {/* Connector line on desktop */}
                  {index < steps.length - 1 && (
                    <div className="absolute left-[3rem] top-[3rem] hidden h-px w-[calc(100%-2rem)] bg-border md:block lg:w-[calc(100%-4rem)]" />
                  )}
                  
                  <div className="relative z-10 mb-6 flex size-16 items-center justify-center rounded-2xl bg-surface-elevated border shadow-sm transition-transform hover:scale-110 md:mb-8 md:size-20">
                    <step.Icon className="size-8 text-primary md:size-10" />
                  </div>
                  
                  <div className="mb-2 text-sm font-bold text-muted-foreground/60">{step.number}</div>
                  <h3 className="mb-3 font-heading text-xl font-semibold">{step.title}</h3>
                  <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </PageShell>
        </section>

        {/* FEATURES SECTION */}
        <section className="border-t bg-surface-sunken py-16 sm:py-24 lg:py-32">
          <PageShell>
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                Mọi thứ bạn cần cho một sự kiện trọn vẹn
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
                Tính năng mạnh mẽ, tối ưu hóa trải nghiệm cho cả chủ tiệc và khách mời.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ Icon, title, description, tone, surface }) => (
                <article
                  className="group relative flex flex-col items-start overflow-hidden rounded-3xl border bg-surface-elevated p-8 shadow-sm transition-all hover:shadow-md hover:ring-1 hover:ring-border"
                  key={title}
                >
                  <div className={`mb-6 flex size-14 items-center justify-center rounded-2xl ${surface} ${tone} transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                    <Icon aria-hidden="true" className="size-7" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold mb-3">{title}</h3>
                  <p className="text-sm leading-7 text-muted-foreground sm:text-base">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </PageShell>
        </section>

        {/* USE CASES SECTION */}
        <section className="border-t bg-background py-16 sm:py-24 lg:py-32">
          <PageShell>
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                Phù hợp với mọi sự kiện
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
                Từ những buổi tiệc nhỏ thân mật đến sự kiện quy mô lớn, Memoria luôn sẵn sàng đáp ứng.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {useCases.map((useCase) => (
                <div 
                  key={useCase.title}
                  className="group relative overflow-hidden rounded-3xl border bg-surface-elevated p-6 sm:p-8 transition-colors hover:bg-surface-sunken"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${useCase.color} opacity-0 transition-opacity group-hover:opacity-100`} />
                  <div className="relative z-10">
                    <useCase.Icon className={`mb-5 size-8 ${useCase.iconColor}`} />
                    <h3 className="font-heading text-lg font-semibold mb-2">{useCase.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {useCase.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </PageShell>
        </section>

        {/* CTA SECTION */}
        <section className="border-t bg-surface-sunken py-16 sm:py-24 lg:py-32">
          <PageShell>
            <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 sm:px-12 sm:py-20 lg:px-16 lg:py-24">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M0 40L40 0H20L0 20M40 40V20L20 40" stroke="currentColor" strokeWidth="2" fill="none"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid-pattern)" />
                </svg>
              </div>

              <div className="relative z-10 mx-auto max-w-2xl text-center">
                <h2 className="font-heading text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl lg:text-5xl">
                  Sẵn sàng lưu giữ mọi khoảnh khắc?
                </h2>
                <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-primary-foreground/80">
                  Khởi tạo sự kiện đầu tiên của bạn hoàn toàn miễn phí. Khách mời sẽ yêu thích trải nghiệm tương tác mới lạ này.
                </p>
                <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <Link href={session ? "/dashboard" : "/auth/sign-up"} className="w-full sm:w-auto">
                    <Button 
                      size="lg" 
                      variant="secondary" 
                      className="min-h-[44px] w-full text-primary hover:bg-white/90 sm:w-auto sm:min-h-14 sm:px-8"
                    >
                      Bắt đầu miễn phí
                    </Button>
                  </Link>
                  <Link href="#main-content" className="w-full sm:w-auto">
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="min-h-[44px] w-full border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 sm:w-auto sm:min-h-14 sm:px-8"
                    >
                      Tìm hiểu thêm
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </PageShell>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t bg-background py-12 sm:py-16">
        <PageShell>
          <div className="grid gap-12 sm:grid-cols-2 md:grid-cols-4 lg:gap-8">
            <div className="space-y-4 md:col-span-2">
              <Link href="/" className="flex items-center gap-2 font-semibold">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Sparkles className="size-4" />
                </span>
                <span className="text-lg">Memoria</span>
              </Link>
              <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                Nền tảng lưu giữ kỷ niệm thế hệ mới, mang đến trải nghiệm tương tác tuyệt vời cho mọi sự kiện của bạn.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Sản phẩm</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="#" className="min-h-[44px] inline-flex items-center hover:text-foreground">Tính năng</Link></li>
                <li><Link href="#" className="min-h-[44px] inline-flex items-center hover:text-foreground">Bảng giá</Link></li>
                <li><Link href="#" className="min-h-[44px] inline-flex items-center hover:text-foreground">Hướng dẫn</Link></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Công ty</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="#" className="min-h-[44px] inline-flex items-center hover:text-foreground">Về chúng tôi</Link></li>
                <li><Link href="#" className="min-h-[44px] inline-flex items-center hover:text-foreground">Điều khoản</Link></li>
                <li><Link href="#" className="min-h-[44px] inline-flex items-center hover:text-foreground">Bảo mật</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Memoria. Bản quyền thuộc về bạn.
            </p>
            <div className="flex gap-4">
              {/* Social icons placeholders */}
              <div className="size-8 rounded-full bg-muted transition-colors hover:bg-muted-foreground/20" />
              <div className="size-8 rounded-full bg-muted transition-colors hover:bg-muted-foreground/20" />
              <div className="size-8 rounded-full bg-muted transition-colors hover:bg-muted-foreground/20" />
            </div>
          </div>
        </PageShell>
      </footer>
    </div>
  )
}