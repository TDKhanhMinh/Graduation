"use client"

import { useState } from "react"
import { LayoutTemplate, MonitorPlay, QrCode, ShieldCheck, Album, Sparkles, Check, X, Heart, MessageCircle } from "lucide-react"

import { LandingSection } from "@/components/landing/landing-section"
import { PageShell } from "@/components/ui/page-shell"

export function FeatureBento() {
  // Micro-demo state 1: Poster Studio Palette
  const [activePalette, setActivePalette] = useState(0)
  const palettes = [
    ["#e11d48", "#9333ea"],
    ["#2563eb", "#059669"],
    ["#d97706", "#dc2626"],
    ["#4f46e5", "#06b6d4"],
  ]

  // Micro-demo state 2: Moderation status
  const [modStatus, setModStatus] = useState<"pending" | "approved" | "rejected">("pending")

  return (
    <LandingSection id="features" className="scroll-mt-20 bg-surface-sunken py-16 sm:py-24 lg:py-32">
      <PageShell>
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
            <Sparkles className="size-3.5" /> Interactive Bento Micro-demos
          </div>
          <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Sáu thành phần, một trải nghiệm trọn vẹn
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Dùng thử trực tiếp các tính năng chính bằng cách tương tác với từng thẻ bên dưới.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: Xưởng áp phích (Interactive Palette Switcher) */}
          <div className="group rounded-3xl border border-primary/20 bg-card p-6 shadow-md transition-all hover:shadow-xl hover:border-primary/40 flex flex-col justify-between min-h-[18rem]">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <LayoutTemplate className="size-5" />
                </div>
                <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                  Thử đổi màu
                </span>
              </div>
              <h3 className="mt-5 font-heading text-xl font-bold">Xưởng Áp Phích</h3>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Tự do biến tấu màu sắc và phong cách thiết kế theo đúng tinh thần sự kiện.
              </p>
            </div>

            {/* Micro Demo Visual */}
            <div className="mt-4 rounded-2xl p-4 transition-all duration-500 text-white flex items-center justify-between shadow-inner" style={{ background: `linear-gradient(135deg, ${palettes[activePalette][0]}, ${palettes[activePalette][1]})` }}>
              <div>
                <p className="text-[10px] uppercase font-bold text-white/80">Preview Palette</p>
                <p className="text-sm font-bold mt-1">Linh &amp; Quân</p>
              </div>
              <div className="flex gap-1.5 bg-white/20 p-1.5 rounded-full backdrop-blur-md">
                {palettes.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePalette(i)}
                    className={`size-5 rounded-full border-2 border-white transition-transform ${activePalette === i ? "scale-125" : "opacity-80"}`}
                    style={{ backgroundColor: p[0] }}
                    aria-label={`Chọn màu ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: QR Event (Pulse & Scan on hover) */}
          <div className="group rounded-3xl border border-primary/20 bg-card p-6 shadow-md transition-all hover:shadow-xl hover:border-primary/40 flex flex-col justify-between min-h-[18rem]">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <QrCode className="size-5" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground">Chạm/Rê để scan</span>
              </div>
              <h3 className="mt-5 font-heading text-xl font-bold">Mã QR Sự Kiện</h3>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Lối vào siêu tốc cho khách mời quét mã bằng camera điện thoại mà không cần cài app.
              </p>
            </div>

            {/* Micro Demo Visual */}
            <div className="mt-4 rounded-2xl border bg-background p-4 flex items-center justify-center relative overflow-hidden">
              <QrCode className="size-16 text-foreground" />
            </div>
          </div>

          {/* Card 3: Moderation (Interactive Approve/Reject) */}
          <div className="group rounded-3xl border border-primary/20 bg-card p-6 shadow-md transition-all hover:shadow-xl hover:border-primary/40 flex flex-col justify-between min-h-[18rem]">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <ShieldCheck className="size-5" />
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  modStatus === "approved" ? "bg-status-success/15 text-status-success" :
                  modStatus === "rejected" ? "bg-status-error/15 text-status-error" : "bg-muted text-muted-foreground"
                }`}>
                  {modStatus === "approved" ? "Đã duyệt ✓" : modStatus === "rejected" ? "Từ chối ✕" : "Chờ duyệt"}
                </span>
              </div>
              <h3 className="mt-5 font-heading text-xl font-bold">Kiểm Duyệt Nội Dung</h3>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Quyền kiểm soát 100% hình ảnh và lời chúc trước khi đưa lên màn hình công khai.
              </p>
            </div>

            {/* Micro Demo Visual */}
            <div className="mt-4 rounded-2xl border bg-background p-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <MessageCircle className="size-4 shrink-0 text-primary" />
                <span className="text-xs truncate font-medium">&quot;Chúc 2 bạn mãi hạnh phúc!&quot;</span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setModStatus("approved")}
                  className="size-8 rounded-lg bg-status-success/10 text-status-success flex items-center justify-center hover:bg-status-success/20 active:scale-95"
                  title="Duyệt lời chúc"
                >
                  <Check className="size-4" />
                </button>
                <button
                  onClick={() => setModStatus("rejected")}
                  className="size-8 rounded-lg bg-status-error/10 text-status-error flex items-center justify-center hover:bg-status-error/20 active:scale-95"
                  title="Từ chối"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Card 4: Public Wall (Continuous Popup Animation) */}
          <div className="group rounded-3xl border border-primary/20 bg-card p-6 shadow-md transition-all hover:shadow-xl hover:border-primary/40 flex flex-col justify-between min-h-[18rem]">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <MonitorPlay className="size-5" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground">Live Stream</span>
              </div>
              <h3 className="mt-5 font-heading text-xl font-bold">Public Wall Trực Tiếp</h3>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Tạo không khí sôi động, biến các đóng góp nhỏ thành trải nghiệm xem chung hoành tráng.
              </p>
            </div>

            <div className="mt-4 rounded-2xl bg-gradient-to-r from-primary/5 to-purple-500/5 p-3 border text-xs font-bold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Heart className="size-3.5 fill-red-500 text-red-500" /> Bùng nổ cảm xúc</span>
              <span className="text-[10px] bg-background px-2 py-0.5 rounded-full border">Đồng bộ tức thì</span>
            </div>
          </div>

          {/* Card 5: Album sau sự kiện (Polaroid Fan-out on hover) */}
          <div className="group rounded-3xl border border-primary/20 bg-card p-6 shadow-md transition-all hover:shadow-xl hover:border-primary/40 flex flex-col justify-between min-h-[18rem] md:col-span-2 lg:col-span-2">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <Album className="size-5" />
                </div>
                <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                  Kỷ niệm trọn vẹn
                </span>
              </div>
              <h3 className="mt-5 font-heading text-xl font-bold">Album Lưu Giữ Kỷ Niệm</h3>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Khi sự kiện kết thúc, toàn bộ lời chúc và hình ảnh được tổng hợp tự động thành album điện tử bền vững.
              </p>
            </div>

            {/* Fan-out Polaroid Micro Demo */}
            <div className="mt-4 relative h-20 w-full flex items-center justify-center">
              {[
                { title: "Kỷ niệm 1", color: "bg-pink-500", rot: "-rotate-6 -translate-x-12" },
                { title: "Kỷ niệm 2", color: "bg-indigo-500", rot: "rotate-0 z-10" },
                { title: "Kỷ niệm 3", color: "bg-amber-500", rot: "rotate-6 translate-x-12" },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`absolute w-36 rounded-xl border-2 border-white bg-card p-2 shadow-lg transition-all duration-500 hover:-translate-y-2 ${item.rot}`}
                >
                  <div className={`h-8 rounded-lg ${item.color} opacity-80`} />
                  <p className="mt-1 text-[9px] font-bold text-center text-muted-foreground">{item.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageShell>
    </LandingSection>
  )
}
