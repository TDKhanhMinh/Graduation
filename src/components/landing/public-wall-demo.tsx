"use client"

import { Heart, Image as ImageIcon, MessageCircle, Play, QrCode, Sparkles } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { ReactionBurst } from "@/components/effects/reaction-burst"
import { WallLayer, WallStage } from "@/features/wall/components/wall-stage"

const modes = [["spotlight", "Spotlight"], ["grid", "Grid"], ["photo-focus", "Photo Focus"], ["celebration", "Celebration"]] as const
const wishes = [{ id: "wish-01", name: "Minh Quân", content: "Chúc hai bạn trăm năm hạnh phúc! 🎉" }, { id: "wish-02", name: "Lan Anh", content: "Một ngày thật đẹp, được viết tiếp bởi những người thương." }, { id: "wish-03", name: "Team Memoria", content: "Lưu lại khoảnh khắc này để cùng nhìn lại sau này." }] as const

export function PublicWallDemo() {
  const [mode, setMode] = useState<(typeof modes)[number][0]>("spotlight")
  const [step, setStep] = useState(0)
  const [running, setRunning] = useState(true)
  const [active, setActive] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const observer = new IntersectionObserver(([entry]) => setActive(Boolean(entry?.isIntersecting)), { threshold: 0.1 })
    observer.observe(root)
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const updateMotion = () => setReducedMotion(media.matches)
    updateMotion()
    media.addEventListener("change", updateMotion)
    const onVisibility = () => setActive(document.visibilityState === "visible")
    document.addEventListener("visibilitychange", onVisibility)
    return () => { observer.disconnect(); media.removeEventListener("change", updateMotion); document.removeEventListener("visibilitychange", onVisibility) }
  }, [])

  useEffect(() => {
    if (!active || !running || reducedMotion) return
    const timer = window.setInterval(() => setStep((current) => { if (current >= 4) { setRunning(false); return current }; return current + 1 }), 1800)
    return () => window.clearInterval(timer)
  }, [active, reducedMotion, running])

  const replay = () => { setStep(0); setRunning(true) }
  const spotlight = mode === "spotlight" || mode === "celebration"
  const visibleWishes = mode === "grid" ? wishes : [wishes[Math.min(step, wishes.length - 1)]]

  return <section ref={rootRef} id="public-wall" className="scroll-mt-24 border-t bg-surface-sunken py-16 sm:py-24 lg:py-32"><div className="mx-auto w-full max-w-(--content-max-width) px-(--page-gutter)"><div className="grid items-start gap-10 lg:grid-cols-[1.1fr_0.9fr]"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Minh họa Public Wall</p><h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">Poster không kết thúc sau khi được chia sẻ</h2><p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">Khách mời quét QR để gửi lời chúc và media; Public Wall biến những đóng góp đó thành một phần của buổi tiệc.</p><div className="mt-7 flex flex-wrap gap-2" role="tablist" aria-label="Chế độ Public Wall">{modes.map(([value, label]) => <button key={value} type="button" role="tab" aria-selected={mode === value} onClick={() => setMode(value)} className="min-h-11 rounded-full border px-4 text-sm font-medium aria-selected:border-primary aria-selected:bg-primary/10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/50">{label}</button>)}</div><div className="mt-6 flex items-center gap-3"><button type="button" onClick={replay} className="inline-flex min-h-11 items-center gap-2 rounded-lg border bg-background px-4 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/50"><Play aria-hidden="true" className="size-4" />{running ? "Đang minh họa" : "Chạy lại demo"}</button><span className="text-xs text-muted-foreground">Dữ liệu mẫu, không phải realtime production.</span></div></div><WallStage layout={mode === "photo-focus" ? "photo-focus" : mode === "grid" ? "grid" : "spotlight"} aspect="wide" className="min-h-[25rem] overflow-hidden rounded-3xl border bg-[radial-gradient(circle_at_25%_15%,var(--memory-pink)_0,transparent_30%),linear-gradient(145deg,var(--brand-800),var(--brand-600))] p-4 text-white sm:p-6"><WallLayer name="content"><div className="flex h-full min-h-[22rem] flex-col"><div className="flex items-center justify-between text-xs text-white/70"><span className="font-semibold tracking-[0.2em]">BỨC TƯỜNG CÔNG KHAI</span><span className="rounded-full bg-white/15 px-2 py-1">Dữ liệu mẫu</span></div><div className="relative mt-5 flex-1"><div className={`grid h-full gap-3 ${mode === "grid" ? "sm:grid-cols-2" : "place-items-center"}`}>{visibleWishes.map((wish, index) => <article key={wish.id} className={`relative rounded-2xl bg-white/95 p-4 text-foreground shadow-xl ${mode === "grid" ? "w-full" : "w-[min(100%,20rem)]"} ${spotlight && index === 0 && step >= 1 ? "wish-card-spotlight" : ""}`}><div className="flex items-center gap-2"><span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary"><MessageCircle className="size-4" /></span><span className="text-sm font-semibold">{wish.name}</span></div><p className="mt-3 text-sm leading-6">{wish.content}</p><div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><Heart className="size-3 fill-memory-pink text-memory-pink" /> Lời chúc mới</div>{step === 2 && index === 0 && !reducedMotion ? <ReactionBurst emoji="🎉" trigger={step} /> : null}</article>)}</div>{step >= 3 && !reducedMotion ? <div aria-hidden="true" className="absolute right-3 top-3 rounded-xl border border-white/30 bg-white/10 p-3"><QrCode className="size-10" /><span className="sr-only">QR halo đang sáng</span></div> : null}{step >= 4 ? <div className="absolute bottom-2 right-2 rounded-xl border border-white/30 bg-white/15 p-2"><ImageIcon aria-hidden="true" className="size-5" /><span className="sr-only">Poster thu nhỏ</span></div> : null}</div><div className="mt-4 flex items-center justify-between text-xs text-white/70"><span>{mode === "photo-focus" ? "Photo Focus" : mode === "celebration" ? "Celebration" : mode === "grid" ? "Grid" : "Spotlight"}</span><span>{reducedMotion ? "Chế độ giảm chuyển động" : `Bước ${Math.min(step + 1, 5)}/5`}</span></div></div></WallLayer></WallStage></div></div></section>
}
