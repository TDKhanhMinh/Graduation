"use client"

import { AnimatePresence, motion } from "framer-motion"
import { BriefcaseBusiness, Cake, GraduationCap, Heart, QrCode, Sparkles, User } from "lucide-react"
import { useState } from "react"

import { LandingSection } from "@/components/landing/landing-section"
import { PageShell } from "@/components/ui/page-shell"

const eventTabs = [
  {
    id: "wedding",
    label: "Tiệc Cưới 💍",
    icon: Heart,
    title: "Đám Cưới · Ngày Chung Đôi",
    subtitle: "Giữ trọn những lời chúc thân tình và hình ảnh ngọt ngào quanh câu chuyện tình yêu.",
    palette: ["#e11d48", "#f43f5e"],
    sampleName: "Linh & Quỳnh Anh",
    sampleWish: "Chúc hai bạn trăm năm hạnh phúc, đầu bạc răng long! 💕",
    bgColor: "from-pink-500/10 via-rose-500/5 to-transparent",
    fontClass: "font-serif",
  },
  {
    id: "birthday",
    label: "Sinh Nhật 🎂",
    icon: Cake,
    title: "Tiệc Sinh Nhật · Tuổi Mới Rực Rỡ",
    subtitle: "Biến khoảnh khắc bất ngờ thành một kho kỷ niệm rộn rã tiếng cười cùng bạn bè.",
    palette: ["#d97706", "#f59e0b"],
    sampleName: "Hoàng Nam · 25th",
    sampleWish: "Chúc Nam tuổi mới rực rỡ, thành công bứt phá nhé! 🎉",
    bgColor: "from-amber-500/10 via-yellow-500/5 to-transparent",
    fontClass: "font-sans uppercase tracking-widest",
  },
  {
    id: "graduation",
    label: "Tốt Nghiệp 🎓",
    icon: GraduationCap,
    title: "Lễ Tốt Nghiệp · Hành Trình Mới",
    subtitle: "Gom lại những lời dặn dò, kỷ niệm thời sinh viên và niềm tự hào của cả gia đình.",
    palette: ["#2563eb", "#3b82f6"],
    sampleName: "Nguyễn Hà · K64",
    sampleWish: "Chúc mừng tân cử nhân! Tương lai rộng mở phía trước! 🎓✨",
    bgColor: "from-blue-500/10 via-indigo-500/5 to-transparent",
    fontClass: "font-heading italic",
  },
  {
    id: "corporate",
    label: "Hội Thảo & Year End Party 🎤",
    icon: BriefcaseBusiness,
    title: "Sự Kiện Doanh Nghiệp · Gala Dinner",
    subtitle: "Kết nối đồng đội, vinh danh cá nhân xuất sắc và lưu lại những khoảnh khắc gắn kết.",
    palette: ["#4f46e5", "#6366f1"],
    sampleName: "Tech Corp · YEP 2026",
    sampleWish: "Cùng nhau chinh phục những đỉnh cao mới trong năm tới! 🚀",
    bgColor: "from-purple-500/10 via-indigo-500/5 to-transparent",
    fontClass: "font-mono",
  },
]

export function UseCases() {
  const [activeTab, setActiveTab] = useState(0)
  const currentEvent = eventTabs[activeTab]

  return (
    <LandingSection id="use-cases" className="scroll-mt-20 border-t bg-background py-16 sm:py-24 lg:py-32">
      <PageShell>
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
            <Sparkles className="size-3.5" /> Interactive Event Switcher
          </div>
          <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Một Áp Phích Cho Mọi Loại Sự Kiện
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Bấm chọn từng loại sự kiện bên dưới để khám phá giao diện và lời chúc mẫu được cá nhân hóa tương ứng.
          </p>

          {/* Tab Switcher Pills */}
          <div className="mt-8 flex flex-wrap justify-center gap-2" role="tablist">
            {eventTabs.map((tab, idx) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === idx}
                onClick={() => setActiveTab(idx)}
                className={`min-h-11 rounded-full border px-5 text-sm font-semibold transition-all ${
                  activeTab === idx
                    ? "border-primary bg-primary text-primary-foreground shadow-md"
                    : "border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Event Preview Display Card */}
        <div className="mt-12 mx-auto max-w-4xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentEvent.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5 }}
              className={`rounded-[2.5rem] border border-primary/20 bg-gradient-to-br ${currentEvent.bgColor} p-6 sm:p-10 shadow-xl grid items-center gap-8 md:grid-cols-2 transition-colors duration-500`}
            >
              {/* Left Column: Event Poster Mockup */}
              <div
                className="aspect-[4/5] rounded-3xl p-6 text-white shadow-2xl flex flex-col justify-between"
                style={{ background: `linear-gradient(135deg, ${currentEvent.palette[0]}, ${currentEvent.palette[1]})` }}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] tracking-widest uppercase font-bold text-white/80">Áp phích mẫu</span>
                  <div className="rounded-xl bg-white p-2 text-foreground shadow-md">
                    <QrCode className="size-6" />
                  </div>
                </div>

                <div>
                  <h3 className={`text-3xl sm:text-4xl tracking-tight ${currentEvent.fontClass}`}>{currentEvent.sampleName}</h3>
                  <p className="text-xs text-white/80 mt-2 font-sans">Quét mã QR để gửi câu chúc của bạn!</p>
                </div>

                <div className="border-t border-white/20 pt-3 text-[11px] text-white/70">
                  <p>Memoria Event Hub · Live Wall Active</p>
                </div>
              </div>

              {/* Right Column: Event Details & Sample Wish */}
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">Tình huống áp dụng</span>
                  <h3 className="mt-2 font-heading text-2xl font-bold text-foreground sm:text-3xl">
                    {currentEvent.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {currentEvent.subtitle}
                  </p>
                </div>

                {/* Sample Wish Card */}
                <div className="rounded-2xl border bg-card/90 p-4 shadow-md space-y-2 backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <User className="size-3.5" />
                    </span>
                    <span className="text-xs font-bold">Khách mời tiêu biểu</span>
                  </div>
                  <p className="text-xs font-medium italic text-foreground leading-relaxed">
                    &quot;{currentEvent.sampleWish}&quot;
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <span className="text-xs font-bold text-muted-foreground">Bảng màu gợi ý:</span>
                  <div className="flex gap-1.5">
                    {currentEvent.palette.map((c) => (
                      <span key={c} className="size-5 rounded-full border shadow-2xs" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </PageShell>
    </LandingSection>
  )
}
