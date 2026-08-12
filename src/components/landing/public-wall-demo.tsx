"use client"

import { Heart, MessageCircle, Send, Sparkles, User } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

import { GlowingRunningBorder } from "@/components/effects/running-border"
import { ReactionBurst } from "@/components/effects/reaction-burst"
import { WallLayer, WallStage } from "@/features/wall/components/wall-stage"

const modes = [
  ["spotlight", "Nổi bật"],
  ["grid", "Lưới"],
  ["photo-focus", "Ưu tiên ảnh"],
  ["celebration", "Chúc mừng"],
] as const

const initialWishes = [
  { id: "wish-01", name: "Minh Quân", content: "Chúc hai bạn trăm năm hạnh phúc! 🎉", isUser: false },
  { id: "wish-02", name: "Lan Anh", content: "Một ngày thật đẹp, được viết tiếp bởi những người thương.", isUser: false },
  { id: "wish-03", name: "Team Memoria", content: "Lưu lại khoảnh khắc này để cùng nhìn lại sau này.", isUser: false },
]

export function PublicWallDemo() {
  const [mode, setMode] = useState<(typeof modes)[number][0]>("spotlight")
  const [step, setStep] = useState(0)
  const [active, setActive] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)").matches : false
  )
  const [wishesList, setWishesList] = useState(initialWishes)
  const [userWishText, setUserWishText] = useState("")
  const [userNameText, setUserNameText] = useState("")
  const [justSubmitted, setJustSubmitted] = useState(false)
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const observer = new IntersectionObserver(([entry]) => setActive(Boolean(entry?.isIntersecting)), { threshold: 0.1 })
    observer.observe(root)
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const updateMotion = () => setReducedMotion(media.matches)
    media.addEventListener("change", updateMotion)
    const onVisibility = () => setActive(document.visibilityState === "visible")
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      observer.disconnect()
      media.removeEventListener("change", updateMotion)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [])

  useEffect(() => {
    if (!active || reducedMotion) return
    const timer = window.setInterval(() => setStep((current) => (current + 1) % 5), 2500)
    return () => window.clearInterval(timer)
  }, [active, reducedMotion])

  const handleSendWish = (e: React.FormEvent) => {
    e.preventDefault()
    if (!userWishText.trim()) return

    const newWish = {
      id: `user-wish-${Date.now()}`,
      name: userNameText.trim() || "Bạn (Khách mời)",
      content: userWishText.trim(),
      isUser: true,
    }

    setWishesList((prev) => [newWish, ...prev])
    setUserWishText("")
    setJustSubmitted(true)
    setMode("spotlight")
    setTimeout(() => setJustSubmitted(false), 3000)
  }

  const visibleWishes = mode === "grid" ? wishesList : [wishesList[Math.min(step, wishesList.length - 1)]]

  return (
    <section ref={rootRef} id="public-wall" className="scroll-mt-20 border-t bg-surface-sunken py-16 sm:py-24 lg:py-32">
      <div className="mx-auto w-full max-w-(--content-max-width) px-(--page-gutter)">
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_1fr]">
          {/* Left Column: Description & Interactive Greeting Input */}
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
                <Sparkles className="size-3.5" /> Interactive Public Wall Demo
              </div>
              <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Biến màn hình sự kiện thành một bức tường kỷ niệm sống động.
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                Khách mời quét mã QR để gửi lời chúc, hình ảnh và video. Bức tường công khai ngay lập tức hiển thị những đóng góp đó trên màn hình lớn của sự kiện.
              </p>
            </div>

            {/* Wall Mode Selector Tabs */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Chế độ hiển thị</p>
              <div className="flex flex-wrap gap-2" role="tablist" aria-label="Chế độ bức tường công khai">
                {modes.map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={mode === value}
                    onClick={() => setMode(value)}
                    className={`min-h-10 rounded-full border px-4 text-xs font-semibold transition-all ${
                      mode === value
                        ? "border-primary bg-primary/15 text-primary shadow-xs"
                        : "border-border bg-card hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive "Thử gửi một lời chúc" Micro-demo Card */}
            <div className="rounded-3xl border border-primary/30 bg-card p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <MessageCircle className="size-4" />
                </span>
                <h3 className="font-heading text-lg font-bold">Thử gửi một lời chúc trực tiếp</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Gõ câu chúc bên dưới để trải nghiệm lời chúc của bạn ngay lập tức bay vào màn hình Public Wall Demo bên phải!
              </p>

              <form onSubmit={handleSendWish} className="space-y-3">
                <div className="grid gap-2">
                  <input
                    type="text"
                    placeholder="Viết một lời chúc..."
                    value={userWishText}
                    onChange={(e) => setUserWishText(e.target.value)}
                    required
                    className="min-h-10 rounded-xl border border-border bg-background px-3 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-xs font-bold text-primary-foreground shadow-md transition-all hover:scale-102 active:scale-98"
                >
                  <Send className="size-4" /> Gửi lời chúc lên Public Wall →
                </button>
              </form>

              {justSubmitted && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-primary/10 p-3 text-center border border-primary/20"
                >
                  <p className="text-xs font-medium text-foreground">
                    Đây là điều khách mời của bạn sẽ trải nghiệm.
                  </p>
                  <a href="/auth/sign-up" className="mt-1 inline-block text-xs font-bold text-primary hover:underline">
                    Tạo sự kiện của riêng bạn →
                  </a>
                </motion.div>
              )}
            </div>
          </div>

          {/* Right Column: Live Wall Display Stage */}
          <div className="relative">
            <GlowingRunningBorder borderRadius="rounded-[2.5rem]" glowTheme="pink" duration={7}>
              <WallStage
                layout={mode === "photo-focus" ? "photo-focus" : mode === "grid" ? "grid" : "spotlight"}
                aspect="wide"
                className="min-h-[28rem] overflow-hidden rounded-[2.5rem] bg-[radial-gradient(circle_at_25%_15%,var(--memory-pink)_0,transparent_30%),linear-gradient(145deg,var(--brand-800),var(--brand-600))] p-6 text-white"
              >
              <WallLayer name="content">
                <div className="flex h-full min-h-[25rem] flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-white/80">
                    <span className="font-bold tracking-widest flex items-center gap-2">
                      <span className="size-2 rounded-full bg-red-400 animate-ping" />
                      LIVE DEMO
                    </span>
                    <span className="flex items-center gap-2 font-semibold">
                      <span>12 memories</span>
                      <span className="opacity-50">•</span>
                      <span>8 guests</span>
                    </span>
                  </div>

                  {/* Wishes Cards Stage */}
                  <div className="relative my-6 flex-1 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                      <div className={`grid w-full gap-4 ${mode === "grid" ? "sm:grid-cols-2" : "place-items-center"}`}>
                        {visibleWishes.map((wish, index) => (
                          <motion.article
                            key={wish.id}
                            initial={reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.8, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.5 }}
                            className={`relative rounded-2xl bg-white/95 p-5 text-foreground shadow-2xl ${
                              mode === "grid" ? "w-full" : "w-[min(100%,22rem)]"
                            } ${wish.isUser ? "ring-4 ring-primary shadow-primary/30" : ""}`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <User className="size-4" />
                              </span>
                              <div>
                                <p className="text-xs font-bold">{wish.name}</p>
                                {wish.isUser && (
                                  <span className="text-[10px] font-semibold text-primary">Lời chúc của bạn ✨</span>
                                )}
                              </div>
                            </div>
                            <p className="mt-3 text-sm font-medium leading-relaxed">{wish.content}</p>
                            <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Heart className="size-3.5 fill-memory-pink text-memory-pink" /> 1 vừa gửi
                            </div>
                            {index === 0 && !reducedMotion && <ReactionBurst emoji="🎉" trigger={step} />}
                          </motion.article>
                        ))}
                      </div>
                    </AnimatePresence>
                  </div>

                  {/* Footer Status */}
                  <div className="flex items-center justify-between text-xs text-white/70 border-t border-white/10 pt-3">
                    <span>Đã nhận: {wishesList.length} đóng góp</span>
                    <span>Tự động cập nhật 24/7</span>
                  </div>
                </div>
              </WallLayer>
            </WallStage>
          </GlowingRunningBorder>
        </div>
        </div>
      </div>
    </section>
  )
}
