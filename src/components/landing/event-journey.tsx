"use client"

import { CalendarHeart, Clock3, ImageIcon, Sparkles, Heart } from "lucide-react"
import { motion } from "framer-motion"

import { LandingSection } from "@/components/landing/landing-section"
import { PageShell } from "@/components/ui/page-shell"

const journeyStages = [
  {
    phase: "BEFORE",
    title: "1. Trước Sự Kiện",
    subtitle: "Một sự kiện bắt đầu từ một lời mời",
    description: "Chọn mẫu áp phích, tùy chỉnh nội dung và chuẩn bị mã QR. Chuẩn bị mọi thứ sẵn sàng chỉ trong vài phút.",
    icon: Clock3,
    badge: "Chuẩn bị",
    bgTheme: "from-blue-500/10 via-card to-card border-blue-500/20",
    accentColor: "text-blue-600 bg-blue-500/10",
  },
  {
    phase: "DURING",
    title: "2. Trong Sự Kiện",
    subtitle: "Khi mọi người cùng tham gia, sự kiện trở nên sống động",
    description: "Khách mời quét mã QR gửi lời chúc, hình ảnh và cảm xúc. Tất cả bùng nổ trực tiếp trên màn hình Public Wall rực rỡ.",
    icon: CalendarHeart,
    badge: "Sôi động nhất",
    bgTheme: "from-pink-500/15 via-purple-500/10 to-card border-pink-500/30 shadow-lg shadow-pink-500/5",
    accentColor: "text-pink-600 bg-pink-500/10",
  },
  {
    phase: "AFTER",
    title: "3. Sau Sự Kiện",
    subtitle: "Khi sự kiện kết thúc, những khoảnh khắc vẫn còn ở lại",
    description: "Tất cả các tin nhắn, bức ảnh kỷ niệm được lưu trữ trong một Album điện tử đong đầy cảm xúc để nhìn lại bất cứ lúc nào.",
    icon: ImageIcon,
    badge: "Lưu giữ",
    bgTheme: "from-amber-500/10 via-card to-card border-amber-500/20",
    accentColor: "text-amber-600 bg-amber-500/10",
  },
]

export function EventJourney() {
  return (
    <LandingSection id="event-journey" className="relative isolate overflow-hidden scroll-mt-20 border-t bg-background py-16 sm:py-24 lg:py-32">
      {/* Ambient background lighting representing Before -> During -> After */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute left-0 top-0 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/4 rounded-full bg-blue-400/20 blur-[120px]" />
        <div className="absolute left-1/2 top-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-500/20 blur-[120px]" />
        <div className="absolute right-0 bottom-0 h-[40rem] w-[40rem] translate-x-1/3 translate-y-1/4 rounded-full bg-amber-500/20 blur-[120px]" />
      </div>
      <PageShell>
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
            <Sparkles className="size-3.5" /> Emotional Event Journey
          </div>
          <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Đồng Hành Cùng Bạn Qua Từng Khoảnh Khắc
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Memoria không chỉ là công cụ tạo poster — chúng tôi chăm chút cho trải nghiệm cảm xúc trước, trong và sau bữa tiệc.
          </p>
        </div>

        {/* 3 Emotional Stages Cards */}
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {journeyStages.map((stage, idx) => {
            const Icon = stage.icon

            return (
              <motion.article
                key={stage.phase}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={`relative flex flex-col justify-between rounded-3xl border bg-gradient-to-b p-7 shadow-md transition-all hover:shadow-xl ${stage.bgTheme}`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className={`flex size-12 items-center justify-center rounded-2xl ${stage.accentColor}`}>
                      <Icon aria-hidden="true" className="size-6" />
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${stage.accentColor}`}>
                      {stage.badge}
                    </span>
                  </div>

                  <h3 className="mt-6 font-heading text-2xl font-bold text-foreground">
                    {stage.title}
                  </h3>
                  <p className="mt-1.5 text-xs font-semibold text-primary">
                    &quot;{stage.subtitle}&quot;
                  </p>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    {stage.description}
                  </p>
                </div>

                {stage.phase === "DURING" && (
                  <div className="mt-6 rounded-2xl bg-card/80 p-3 border border-pink-200 text-xs font-bold text-pink-600 flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><Heart className="size-4 fill-pink-500 text-pink-500" /> Bùng nổ tương tác</span>
                    <span>Live Wall Active</span>
                  </div>
                )}

                {stage.phase === "AFTER" && (
                  <div className="mt-6 relative h-24 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200 flex items-center justify-center">
                    <div className="absolute inset-0 pointer-events-none">
                       {/* Scattered memories converging */}
                       <motion.div
                         animate={{ x: [0, 40, 0], y: [0, 20, 0], opacity: [0.3, 0, 0.3] }}
                         transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                         className="size-6 bg-pink-400 rounded-sm absolute left-4 top-2 shadow-sm"
                       />
                       <motion.div
                         animate={{ x: [0, -30, 0], y: [0, 20, 0], opacity: [0.3, 0, 0.3] }}
                         transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                         className="size-8 bg-blue-400 rounded-sm absolute right-4 top-4 shadow-sm"
                       />
                       <motion.div
                         animate={{ x: [0, 30, 0], y: [0, -15, 0], opacity: [0.3, 0, 0.3] }}
                         transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                         className="size-5 bg-green-400 rounded-sm absolute left-12 bottom-3 shadow-sm"
                       />
                    </div>
                    
                    <motion.div
                      animate={{ y: [4, -4, 4] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="relative z-10 w-32 h-16 bg-white rounded-lg shadow-xl border border-amber-200 flex items-center justify-center font-serif text-amber-800 text-xs font-bold"
                    >
                      <div className="absolute left-2 top-0 bottom-0 w-2 bg-amber-100 border-r border-amber-200/50" />
                      Memory Album
                    </motion.div>
                  </div>
                )}
              </motion.article>
            )
          })}
        </div>
      </PageShell>
    </LandingSection>
  )
}
