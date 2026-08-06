"use client"

import { Heart, QrCode, Sparkles, User } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { localPosterTemplates } from "@/features/posters/templates"

const demoTemplates = localPosterTemplates.slice(0, 3)

export function HeroPosterDemo() {
  const [templateIndex, setTemplateIndex] = useState(0)
  const [showWish, setShowWish] = useState(true)
  const [active, setActive] = useState(true)
  const rootRef = useRef<HTMLDivElement>(null)
  const template = demoTemplates[templateIndex]
  const palette = template.palette

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const observer = new IntersectionObserver(([entry]) => setActive(Boolean(entry?.isIntersecting)), { threshold: 0.1 })
    observer.observe(root)
    const onVisibility = () => setActive(document.visibilityState === "visible")
    document.addEventListener("visibilitychange", onVisibility)
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", onVisibility) }
  }, [])

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (media.matches || !active) return
    const timer = window.setInterval(() => {
      setTemplateIndex((current) => (current + 1) % demoTemplates.length)
      setShowWish((current) => !current)
    }, 4200)
    return () => window.clearInterval(timer)
  }, [active])

  return <div ref={rootRef} className="relative mx-auto w-full max-w-2xl" aria-label="Xem trước trình tạo áp phích"><div className="relative mx-auto aspect-[4/3] max-w-xl overflow-hidden rounded-[2rem] border border-primary/15 bg-card p-4 shadow-[0_30px_80px_-42px_var(--brand-700)] sm:p-6"><div className="flex items-center justify-between border-b border-border/70 pb-3 text-xs text-muted-foreground"><span className="font-medium">Memoria · Xưởng áp phích</span><span className="rounded-full bg-status-success/10 px-2 py-1 font-semibold text-status-success">Bản minh họa</span></div><div className="grid h-[calc(100%-2.5rem)] gap-4 pt-4 sm:grid-cols-[1fr_0.38fr]"><div className="relative overflow-hidden rounded-2xl p-5 text-white transition-colors duration-700 sm:p-8" style={{ background: `linear-gradient(145deg, ${palette[0]}, ${palette[1]})` }}><p className="text-[10px] uppercase tracking-[0.3em] text-white/70">{template.name}</p><h2 className="mt-8 max-w-xs font-heading text-3xl font-bold sm:text-5xl">Linh &amp; Quân</h2><p className="absolute bottom-5 max-w-xs text-xs leading-5 text-white/80 sm:bottom-8 sm:text-sm">Một ngày thật đẹp, được viết tiếp bởi những lời chúc của bạn.</p><div className="absolute right-4 top-4 rounded-lg bg-white p-2 text-foreground"><QrCode className="size-9" aria-label="Mã QR minh họa" /></div>{showWish ? <div className="absolute bottom-5 left-5 max-w-[70%] rounded-xl bg-white/90 p-3 text-foreground shadow-lg sm:bottom-8 sm:left-8"><div className="flex items-start gap-2"><div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><User className="size-3" /></div><p className="text-[10px] leading-4">Chúc hai bạn trăm năm hạnh phúc!</p></div></div> : <div className="absolute bottom-5 left-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-xs text-white/90 sm:bottom-8 sm:left-8"><Sparkles className="size-3" />Khách mời xem trước</div>}</div><div className="hidden flex-col gap-3 sm:flex"><div className="rounded-xl border bg-background p-3"><p className="text-[10px] font-semibold uppercase text-muted-foreground">Bảng màu</p><div className="mt-3 flex gap-1.5">{palette.slice(0, 3).map((color) => <span key={color} className="size-6 rounded-full border border-border" style={{ backgroundColor: color }} />)}</div></div><div className="rounded-xl border bg-background p-3"><p className="text-[10px] font-semibold uppercase text-muted-foreground">Khách mời xem trước</p><div className="mt-3 rounded-lg bg-surface-sunken p-2"><div className="flex items-start gap-2"><div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary"><User className="size-3" /></div><p className="text-[10px] leading-4">Lời chúc và tệp đa phương tiện ở cùng một nơi.</p></div><Heart className="ml-auto mt-2 size-3 fill-memory-pink text-memory-pink" /></div></div></div></div></div><div className="mt-5 grid grid-cols-3 gap-3 text-center text-xs text-muted-foreground"><span className="rounded-xl border bg-card px-3 py-3">Áp phích</span><span className="rounded-xl border bg-card px-3 py-3">QR</span><span className="rounded-xl border bg-card px-3 py-3">Bức tường công khai</span></div></div>
}
