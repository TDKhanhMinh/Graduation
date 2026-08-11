"use client"

import { AnimatePresence, motion } from "framer-motion"
import { CheckCircle2, Heart, Image as ImageIcon, MessageCircle, MonitorPlay, Palette, QrCode, Sparkles } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { GlowingRunningBorder } from "@/components/effects/running-border"
import { LandingSection } from "@/components/landing/landing-section"
import { PageShell } from "@/components/ui/page-shell"

const storySteps = [
  {
    id: "01",
    title: "1. Thiết kế Áp phích Sự kiện",
    subtitle: "Tạo nét riêng độc bản cho bữa tiệc",
    description: "Chọn mẫu áp phích yêu thích, chỉnh sửa thông tin chương trình và thiết lập tông màu phù hợp với tinh thần sự kiện.",
    icon: Palette,
    accent: "from-blue-500/20 to-indigo-500/20",
  },
  {
    id: "02",
    title: "2. Chia sẻ Mã QR đến Khách mời",
    subtitle: "Lối vào đơn giản chỉ trong 1 chạm",
    description: "In mã QR trực tiếp trên áp phích, thiệp mời hoặc đặt tại bàn tiệc để mọi người dễ dàng quét và tham gia bằng điện thoại.",
    icon: QrCode,
    accent: "from-purple-500/20 to-pink-500/20",
  },
  {
    id: "03",
    title: "3. Khách mời Gửi Kỷ Niệm",
    subtitle: "Trực tiếp từ điện thoại, không cần cài app",
    description: "Khách mời quét mã QR để viết lời chúc, chụp ảnh check-in và gửi gắm những khoảnh khắc đáng nhớ ngay tại bàn tiệc.",
    icon: Heart,
    accent: "from-pink-500/20 to-rose-500/20",
  },
  {
    id: "04",
    title: "4. Bức Tường Trình Chiếu",
    subtitle: "Visual climax cho sự kiện của bạn",
    description: "Mọi lời chúc và hình ảnh được tự động tổng hợp và bay lên màn hình sự kiện tạo thành một bức tường kỷ niệm sống động.",
    icon: MonitorPlay,
    accent: "from-amber-500/20 to-orange-500/20",
  },
]

export function ProductStoryScrollytelling() {
  const [activeStep, setActiveStep] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false
  )
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const onChange = () => setReducedMotion(media.matches)
    media.addEventListener("change", onChange)

    const handleScroll = () => {
      stepRefs.current.forEach((el, index) => {
        if (!el) return
        const rect = el.getBoundingClientRect()
        if (rect.top <= window.innerHeight * 0.5 && rect.bottom >= window.innerHeight * 0.2) {
          setActiveStep(index)
        }
      })
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      media.removeEventListener("change", onChange)
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  return (
    <LandingSection id="product-story" className="scroll-mt-20 border-t bg-surface-sunken py-16 sm:py-24 lg:py-32">
      <PageShell>
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
            <Sparkles className="size-3.5" /> Scrollytelling Experience
          </div>
          <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Từ Áp Phích Đơn Thuần Đến Bức Tường Kỷ Niệm
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Khám phá quy trình khép kín giúp sự kiện của bạn trở thành khoảnh khắc đáng nhớ trong mắt mọi người.
          </p>
        </div>

        {/* 2-Column Sticky Layout */}
        <div className="mt-16 grid items-start gap-10 lg:grid-cols-[45%_55%] lg:gap-14">
          {/* Left Column: Interactive Steps List */}
          <div className="space-y-8 lg:py-12">
            {storySteps.map((step, idx) => {
              const isActive = activeStep === idx
              const Icon = step.icon

              return (
                <div
                  key={step.id}
                  ref={(el) => { stepRefs.current[idx] = el }}
                  onClick={() => setActiveStep(idx)}
                  className={`group relative cursor-pointer rounded-3xl border p-6 transition-all duration-300 ${
                    isActive
                      ? "border-primary/40 bg-card shadow-xl shadow-primary/5"
                      : "border-border/60 bg-card/50 opacity-70 hover:opacity-100 hover:border-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className={`flex size-12 items-center justify-center rounded-2xl transition-colors ${
                      isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      <Icon className="size-6" />
                    </div>
                    <span className={`font-heading text-2xl font-bold ${isActive ? "text-primary" : "text-muted-foreground/40"}`}>
                      {step.id}
                    </span>
                  </div>

                  <h3 className="mt-5 font-heading text-xl font-bold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-primary">
                    {step.subtitle}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {step.description}
                  </p>

                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute inset-y-0 left-0 w-1.5 rounded-l-3xl bg-primary"
                    />
                  )}
                </div>
              )
            })}
          </div>

          {/* Right Column: Sticky Visual Transformation Stage */}
          <div className="sticky top-28">
            <GlowingRunningBorder borderRadius="rounded-[2.5rem]" glowTheme="cyan" duration={6} variant="static">
              <div className="p-6 min-h-[28rem] flex flex-col justify-between">
                <div className="flex items-center justify-between border-b pb-4 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-primary animate-pulse" />
                Minh hoạ bước {activeStep + 1}/4
              </span>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                {storySteps[activeStep].title}
              </span>
            </div>

            <div className="relative my-6 flex-1 flex items-center justify-center min-h-[18rem]">
              <AnimatePresence mode="wait">
                {/* STEP 1 VISUAL: POSTER CREATION */}
                {activeStep === 0 && (
                  <motion.div
                    key="step1"
                    initial={reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-sm rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-6 text-white shadow-xl flex flex-col justify-between aspect-[4/3]"
                  >
                    <div>
                      <span className="text-[10px] tracking-widest uppercase text-white/70">Mẫu Đám Cưới</span>
                      <h4 className="mt-2 font-heading text-2xl font-bold">Quang &amp; Nhã</h4>
                    </div>
                    <div className="space-y-2 border-t border-white/20 pt-3 text-xs text-white/80">
                      <div className="flex items-center justify-between">
                        <span>Đã chọn Bảng màu</span>
                        <div className="flex gap-1">
                          <span className="size-3.5 rounded-full bg-pink-400" />
                          <span className="size-3.5 rounded-full bg-indigo-300" />
                          <span className="size-3.5 rounded-full bg-amber-300" />
                        </div>
                      </div>
                      <p className="text-[10px] text-white/60">Tự động hoàn thiện trong 30 giây</p>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2 VISUAL: QR SHARING & SCANNING */}
                {activeStep === 1 && (
                  <motion.div
                    key="step2"
                    initial={reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4 }}
                    className="relative flex items-center justify-center"
                  >
                    <div className="rounded-3xl bg-background p-6 shadow-2xl border flex flex-col items-center gap-3">
                      <div className="relative rounded-2xl bg-white p-4 shadow-md">
                        <QrCode className="size-28 text-foreground" />
                        <motion.div
                          animate={{ top: ["0%", "100%", "0%"] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="absolute inset-x-0 h-1 bg-primary shadow-md"
                        />
                      </div>
                      <p className="text-xs font-bold text-foreground">Quét mã QR để gửi lời chúc</p>
                    </div>

                    {/* Phone Scanning Overlay Graphic */}
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -bottom-4 -right-4 rounded-2xl border-2 border-primary bg-card p-3 shadow-2xl flex items-center gap-2 text-xs font-semibold text-primary"
                    >
                      <CheckCircle2 className="size-4" /> Khách mời kết nối tức thì
                    </motion.div>
                  </motion.div>
                )}

                {/* STEP 3 VISUAL: MEMORY TRANSFER */}
                {activeStep === 2 && (
                  <motion.div
                    key="step3"
                    initial={reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4 }}
                    className="relative w-full h-full min-h-[220px] flex items-center justify-center"
                  >
                    {/* Phone Layout */}
                    <div className="absolute left-6 bottom-0 w-32 h-44 bg-background border-4 border-foreground/10 rounded-2xl p-2 shadow-xl flex flex-col justify-end z-10">
                       <div className="w-full h-24 rounded-lg bg-muted flex items-center justify-center mb-2 border overflow-hidden relative">
                         <div className="absolute inset-0 bg-blue-100/50" />
                         <ImageIcon className="size-6 text-blue-500/50 relative z-10" />
                       </div>
                       <div className="h-8 bg-primary/90 rounded-md flex items-center justify-center text-white text-[10px] font-bold">
                         Gửi lên Wall ↑
                       </div>
                    </div>
                    {/* Public Wall Layout */}
                    <div className="absolute right-2 top-0 w-44 h-32 bg-card border shadow-lg rounded-xl overflow-hidden flex flex-wrap gap-2 p-3 opacity-80">
                       <div className="w-10 h-10 bg-muted rounded border" />
                       <div className="w-14 h-10 bg-muted rounded border" />
                       <div className="w-10 h-10 bg-muted rounded border" />
                       <div className="w-8 h-8 bg-muted rounded border" />
                    </div>
                    {/* Animated transferring card */}
                    <motion.div
                      initial={{ x: -50, y: 60, scale: 0.5, rotate: -10, opacity: 0 }}
                      animate={{ 
                        x: [ -50, -10, 40 ], 
                        y: [ 60, -10, -50 ], 
                        scale: [ 0.5, 0.8, 1 ], 
                        rotate: [ -10, 5, 12 ],
                        opacity: [ 0, 1, 0 ] 
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute z-20 w-16 h-16 bg-white p-1 rounded-md shadow-xl border"
                    >
                      <div className="w-full h-full bg-blue-100 rounded-sm flex items-center justify-center">
                        <ImageIcon className="size-5 text-blue-500" />
                      </div>
                    </motion.div>
                  </motion.div>
                )}

                {/* STEP 4 VISUAL: LIVE PUBLIC WALL STREAM */}
                {activeStep === 3 && (
                  <motion.div
                    key="step4"
                    initial={reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4 }}
                    className="w-full space-y-3"
                  >
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="rounded-2xl border bg-background p-4 shadow-md flex items-center gap-3"
                    >
                      <div className="size-8 rounded-full bg-pink-500/10 text-pink-600 flex items-center justify-center font-bold text-xs">
                        <MessageCircle className="size-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold">Minh Thư</p>
                        <p className="text-xs text-muted-foreground">&quot;Chúc hai bạn trăm năm hạnh phúc! 🎉&quot;</p>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="rounded-2xl border bg-background p-4 shadow-md flex items-center gap-3"
                    >
                      <div className="size-8 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-xs">
                        <ImageIcon className="size-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold">Tuấn Anh</p>
                        <p className="text-xs text-muted-foreground">Đã tải lên 3 ảnh kỷ niệm bàn tiệc 📸</p>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="rounded-2xl border border-primary/30 bg-primary/5 p-3 text-center text-xs font-bold text-primary"
                    >
                      <Heart className="inline-block size-3.5 fill-current mr-1" />
                      Đang trình chiếu trực tiếp trên Public Wall
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Progress Controls */}
            <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground">
              <span>Bấm từng bước để trải nghiệm</span>
              <div className="flex gap-1.5">
                {storySteps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveStep(i)}
                    className={`size-2.5 rounded-full transition-all ${activeStep === i ? "w-6 bg-primary" : "bg-muted-foreground/30"}`}
                    aria-label={`Chuyển đến bước ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </GlowingRunningBorder>
      </div>
    </div>
      </PageShell>
    </LandingSection>
  )
}
