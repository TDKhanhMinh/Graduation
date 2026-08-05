import {
  ArrowRight,
  Camera,
  Gift,
  GraduationCap,
  Heart,
  MessageSquareHeart,
  MonitorPlay,
  PartyPopper,
  QrCode,
  Rocket,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from "lucide-react"
import Link from "next/link"

import { MemoriaLogo } from "@/components/brand/memoria-logo"
import { SparkleDecoration } from "@/components/brand/sparkle-decoration"
import { StickerIcon } from "@/components/brand/sticker-icon"
import { AmbientParticles } from "@/components/effects/ambient-particles"
import { AuroraBackground } from "@/components/effects/aurora-background"
import { FilmGrainOverlay } from "@/components/effects/film-grain-overlay"
import { FloatingPhotoMemories } from "@/components/effects/floating-photo-memories"
import { LightTrail } from "@/components/effects/light-trail"
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
      <header className="sticky inset-x-0 top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/75">
        <PageShell className="flex h-16 items-center justify-between gap-4">
          <Link
            href="/"
            aria-label="Memoria - Trang chủ"
            className="rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/50"
          >
            <MemoriaLogo />
          </Link>

          <nav aria-label="Điều hướng chính" className="hidden items-center gap-1 md:flex">
            <a href="#how-it-works" className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/8 hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/50">Cách hoạt động</a>
            <a href="#features" className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/8 hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/50">Tính năng</a>
            <a href="#use-cases" className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary/8 hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/50">Mẫu sự kiện</a>
          </nav>

          {session ? (
            <Link href="/dashboard">
              <Button variant="soft" className="min-h-[44px]">Dashboard</Button>
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
        <section className="relative isolate overflow-hidden py-16 sm:py-24 lg:py-32">
          <AuroraBackground preset="elegant" intensity="low" className="z-0" />
          <AmbientParticles preset="elegant" intensity="low" className="z-0" />
          <FloatingPhotoMemories />
          <FilmGrainOverlay />
          <LightTrail />

          {/* Background glows */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[40rem] overflow-hidden opacity-40"
          >
            <div className="absolute -left-24 top-0 size-96 rounded-full bg-primary/20 blur-[120px]" />
            <div className="absolute right-0 top-24 size-80 rounded-full bg-memory-pink/20 blur-[100px]" />
          </div>

          <PageShell>
            <SparkleDecoration className="-right-4 top-16 hidden md:block" />
            <StickerIcon
              Icon={Heart}
              tone="pink"
              delay="short"
              className="right-[7%] top-8 hidden sm:grid lg:right-[4%] lg:top-16"
            />
            <StickerIcon
              Icon={Camera}
              tone="peach"
              delay="long"
              className="bottom-20 left-[3%] hidden lg:grid"
            />
            <div className="relative z-10 grid items-center gap-12 lg:grid-cols-[1fr_0.85fr] lg:gap-20">
              <div className="space-y-8 text-center lg:text-left">
                <div className="inline-flex cursor-default items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/12">
                  <Sparkles aria-hidden="true" className="size-4" />
                  <span>Nền tảng lưu giữ kỷ niệm thế hệ mới</span>
                </div>

                <div className="space-y-5">
                  <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
                    Lưu giữ mọi{" "}
                    <span className="text-primary">khoảnh khắc đẹp</span>
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
              <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
                <StickerIcon
                  Icon={Gift}
                  tone="gold"
                  delay="long"
                  className="-right-3 top-16 hidden sm:grid"
                />
                <div className="relative overflow-hidden rounded-[2rem] border border-primary/15 bg-card shadow-[0_30px_80px_-42px_var(--brand-700)]">
                  <div className="flex items-center justify-between border-b border-border/70 bg-background/80 px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5" aria-hidden="true">
                        <span className="size-2.5 rounded-full bg-memory-pink" />
                        <span className="size-2.5 rounded-full bg-memory-peach" />
                        <span className="size-2.5 rounded-full bg-memory-gold" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground sm:text-sm">Memoria · Public Wall</span>
                    </div>
                    <span className="rounded-full bg-status-success/10 px-2.5 py-1 text-[10px] font-semibold text-status-success sm:text-xs">Đang nhận lời chúc</span>
                  </div>

                  <div className="relative min-h-[400px] overflow-hidden bg-[radial-gradient(circle_at_75%_20%,var(--memory-peach)_0,transparent_28%),linear-gradient(145deg,var(--brand-50),var(--background)_62%)] p-5 sm:p-7">
                    <div className="mx-auto max-w-sm text-center">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/70">A day to remember</p>
                      <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Linh &amp; Quân</h2>
                      <p className="mt-2 text-sm text-muted-foreground">Một ngày thật đẹp, được viết tiếp bởi những lời chúc của bạn.</p>
                      <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-memory-pink/70" />
                    </div>

                    <div className="absolute bottom-7 left-5 max-w-[78%] rounded-2xl border border-white/70 bg-background/90 p-4 shadow-lg backdrop-blur sm:bottom-9 sm:left-8 sm:max-w-[70%]">
                      <div className="flex items-start gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><User className="size-4" /></div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold">Minh Quân</p>
                          <p className="text-xs leading-5 text-muted-foreground sm:text-sm">Chúc hai bạn trăm năm hạnh phúc! 🎉</p>
                        </div>
                      </div>
                    </div>

                    <div className="absolute right-5 top-24 rounded-2xl border border-white/70 bg-background/90 p-3 shadow-lg backdrop-blur sm:right-8 sm:top-28">
                      <div className="flex items-center gap-2 text-status-danger"><Heart className="size-4 fill-status-danger" /><span className="text-xs font-semibold">12 lời chúc mới</span></div>
                      <div className="mt-3 grid grid-cols-3 gap-1" aria-label="Ảnh kỷ niệm xem trước">
                        <span className="aspect-square rounded-md bg-memory-pink/30" /><span className="aspect-square rounded-md bg-memory-peach/50" /><span className="aspect-square rounded-md bg-primary/20" />
                      </div>
                    </div>

                    <div className="absolute bottom-7 right-5 hidden w-20 rounded-xl border border-white/70 bg-background/90 p-2 shadow-lg backdrop-blur sm:block">
                      <QrCode className="mx-auto size-10 text-foreground" />
                      <p className="mt-1 text-center text-[9px] font-medium text-muted-foreground">Quét để gửi</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </PageShell>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section id="how-it-works" className="scroll-mt-20 border-t bg-background py-16 sm:py-24 lg:py-32">
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
        <section id="features" className="relative scroll-mt-20 border-t bg-surface-sunken py-16 sm:py-24 lg:py-32">
          <StickerIcon
            Icon={Gift}
            tone="peach"
            delay="short"
            className="right-[7%] top-16 hidden lg:grid"
          />
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
                  className="group relative flex flex-col items-start overflow-hidden rounded-2xl border border-border/80 bg-card p-7 shadow-sm transition-all motion-safe:hover:-translate-y-0.5 hover:shadow-md hover:ring-1 hover:ring-primary/15 sm:p-8"
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
        <section id="use-cases" className="scroll-mt-20 border-t bg-background py-16 sm:py-24 lg:py-32">
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
                  className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-6 transition-all hover:-translate-y-0.5 hover:bg-surface-sunken hover:shadow-md sm:p-8"
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
            <div className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,var(--brand-700),var(--brand-500))] px-6 py-16 sm:px-12 sm:py-20 lg:px-16 lg:py-24">
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

              <SparkleDecoration className="right-8 top-8 text-white/70" />
              <StickerIcon
                Icon={Heart}
                tone="pink"
                delay="short"
                className="bottom-10 left-8 hidden sm:grid"
              />
              <StickerIcon
                Icon={Camera}
                tone="gold"
                delay="long"
                className="right-10 top-20 hidden sm:grid"
              />
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
              <Link href="/" aria-label="Memoria - Trang chủ" className="rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/50">
                <MemoriaLogo />
              </Link>
              <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                Nền tảng lưu giữ kỷ niệm thế hệ mới, mang đến trải nghiệm tương tác tuyệt vời cho mọi sự kiện của bạn.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Sản phẩm</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#features" className="inline-flex min-h-[44px] items-center hover:text-foreground">Tính năng</a></li>
                <li><span className="inline-flex min-h-[44px] items-center text-muted-foreground/70">Bảng giá</span></li>
                <li><a href="#how-it-works" className="inline-flex min-h-[44px] items-center hover:text-foreground">Hướng dẫn</a></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Công ty</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><span className="inline-flex min-h-[44px] items-center text-muted-foreground/70">Về chúng tôi</span></li>
                <li><span className="inline-flex min-h-[44px] items-center text-muted-foreground/70">Điều khoản</span></li>
                <li><span className="inline-flex min-h-[44px] items-center text-muted-foreground/70">Bảo mật</span></li>
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