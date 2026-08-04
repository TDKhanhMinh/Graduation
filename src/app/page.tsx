import { ArrowRight, MessageSquareHeart, QrCode, ShieldCheck, Sparkles } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { verifySession } from "@/lib/auth/dal"

export const dynamic = "force-dynamic"

export default async function Home() {
  const session = await verifySession()

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-zinc-950 selection:bg-emerald-500/30">
      {/* Navigation */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-zinc-950/60 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
              <Sparkles className="h-5 w-5 text-zinc-950" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">Memoria</span>
          </div>
          <div className="flex items-center gap-3">
            {session ? (
              <Link href="/dashboard">
                <Button className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0" variant="secondary">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="hidden sm:block">
                  <Button variant="ghost" className="text-zinc-300 hover:text-white">
                    Đăng nhập
                  </Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button className="min-h-[44px] min-w-[44px] bg-emerald-500 text-zinc-950 hover:bg-emerald-400 sm:min-h-0 sm:min-w-0">
                    Bắt đầu
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pb-16 pt-32 sm:pb-24 sm:pt-40 lg:pb-32 lg:pt-48">
          {/* Background Gradients */}
          <div className="absolute inset-x-0 top-0 -z-10 flex h-[1000px] items-center justify-center overflow-hidden opacity-30">
            <div className="absolute -top-[10%] left-[20%] h-[500px] w-[500px] rounded-full bg-emerald-500/20 blur-[120px]" />
            <div className="absolute right-[10%] top-[20%] h-[400px] w-[400px] rounded-full bg-blue-500/20 blur-[100px]" />
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:gap-12 xl:gap-24">
              
              {/* Text Content (Left on Tablet/Desktop) */}
              <div className="flex-1 space-y-8 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-300">
                  <Sparkles className="h-4 w-4" />
                  <span>Nền tảng lưu giữ kỷ niệm thế hệ mới</span>
                </div>
                
                <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
                  Lưu giữ mọi <br className="hidden lg:block" />
                  <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    khoảnh khắc đẹp
                  </span>
                </h1>
                
                <p className="mx-auto max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg lg:mx-0 lg:max-w-xl">
                  Tạo không gian số tương tác cho sự kiện của bạn. Thu thập lời chúc, hình ảnh và video từ khách mời chỉ qua một mã QR đơn giản.
                </p>
                
                <div className="flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
                  <Link href={session ? "/dashboard" : "/auth/sign-up"} className="w-full sm:w-auto">
                    <Button size="lg" className="min-h-[56px] w-full rounded-2xl bg-emerald-500 text-base font-semibold text-zinc-950 hover:bg-emerald-400 sm:min-h-[48px] sm:w-auto sm:rounded-xl">
                      {session ? "Truy cập Dashboard" : "Tạo sự kiện miễn phí"}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  {!session && (
                    <Link href="/auth/login" className="w-full sm:w-auto">
                      <Button size="lg" variant="outline" className="min-h-[56px] w-full rounded-2xl border-zinc-800 bg-zinc-900/50 text-base font-medium text-zinc-300 hover:bg-zinc-800 sm:min-h-[48px] sm:w-auto sm:rounded-xl">
                        Xem demo
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              {/* Visual Mockup (Right on Tablet/Desktop, hidden on small mobile) */}
              <div className="mt-16 hidden flex-1 sm:block lg:mt-0 lg:shrink-0">
                <div className="relative mx-auto w-full max-w-lg">
                  <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/50 shadow-2xl backdrop-blur-xl">
                    {/* Mockup Header */}
                    <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-6 py-4">
                      <div className="h-2 w-12 rounded-full bg-zinc-700" />
                      <div className="flex gap-2">
                        <div className="h-2 w-2 rounded-full bg-red-400" />
                        <div className="h-2 w-2 rounded-full bg-amber-400" />
                        <div className="h-2 w-2 rounded-full bg-emerald-400" />
                      </div>
                    </div>
                    {/* Mockup Content */}
                    <div className="space-y-4 p-6">
                      <div className="h-40 w-full animate-pulse rounded-2xl bg-zinc-800/50" />
                      <div className="flex gap-4">
                        <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-emerald-500/20" />
                        <div className="flex-1 space-y-2 pt-2">
                          <div className="h-3 w-1/3 rounded-full bg-zinc-700" />
                          <div className="h-3 w-3/4 rounded-full bg-zinc-800" />
                          <div className="h-3 w-1/2 rounded-full bg-zinc-800" />
                        </div>
                      </div>
                      <div className="flex gap-4 pt-4">
                        <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-blue-500/20" />
                        <div className="flex-1 space-y-2 pt-2">
                          <div className="h-3 w-1/4 rounded-full bg-zinc-700" />
                          <div className="h-3 w-full rounded-full bg-zinc-800" />
                          <div className="h-3 w-5/6 rounded-full bg-zinc-800" />
                        </div>
                      </div>
                    </div>
                    {/* Floating elements */}
                    <div className="absolute -right-6 bottom-12 rounded-2xl border border-white/10 bg-zinc-800/80 p-4 shadow-xl backdrop-blur-md">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
                          <MessageSquareHeart className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">+12 Lời chúc mới</p>
                          <p className="text-xs text-zinc-400">Vừa xong</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t border-white/5 bg-zinc-950/50 py-16 sm:py-24 lg:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-16 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
                Mọi thứ bạn cần cho một sự kiện trọn vẹn
              </h2>
              <p className="mt-4 text-zinc-400">Đơn giản, bảo mật và tương tác theo thời gian thực.</p>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {/* Feature 1 */}
              <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-8 transition hover:bg-white/[0.04]">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
                  <QrCode className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-white">Quét mã và Gửi</h3>
                <p className="text-sm leading-relaxed text-zinc-400">
                  Khách mời không cần tải app hay đăng nhập. Chỉ cần quét mã QR được chiếu trên màn hình để gửi lời chúc và media ngay lập tức.
                </p>
              </div>
              
              {/* Feature 2 */}
              <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-8 transition hover:bg-white/[0.04]">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400">
                  <MessageSquareHeart className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-white">Tương tác Real-time</h3>
                <p className="text-sm leading-relaxed text-zinc-400">
                  Lời chúc, hình ảnh và phản hồi (reactions) sẽ hiện lên màn hình sự kiện ngay lập tức, tạo ra không khí sôi động và gắn kết.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-8 transition hover:bg-white/[0.04] sm:col-span-2 lg:col-span-1">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-white">Kiểm duyệt an toàn</h3>
                <p className="text-sm leading-relaxed text-zinc-400">
                  Quản lý nội dung dễ dàng. Bạn có toàn quyền duyệt lời chúc và hình ảnh trước khi chúng được hiển thị công khai trên màn hình lớn.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center">
        <p className="text-sm text-zinc-500">
          © {new Date().getFullYear()} Memoria. Bản quyền thuộc về bạn.
        </p>
      </footer>
    </div>
  )
}
