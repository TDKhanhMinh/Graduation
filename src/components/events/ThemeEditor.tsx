"use client"

import Image from "next/image"
import { Check, LoaderCircle, Monitor, Smartphone, Tablet } from "lucide-react"
import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { EventActionState } from "@/features/events/actions"

 type Viewport = "desktop" | "tablet" | "mobile"
 type ThemeKey = "graduation" | "editorial" | "minimal"

const themes: Array<{ key: ThemeKey; label: string; description: string; sample: string; accent: string }> = [
  { key: "graduation", label: "Graduation", description: "Ấm áp, trang trọng và giàu cảm xúc.", sample: "bg-[linear-gradient(135deg,var(--brand-50),var(--memory-peach))]", accent: "bg-primary" },
  { key: "editorial", label: "Editorial", description: "Mềm mại với chất tạp chí hiện đại.", sample: "bg-[linear-gradient(135deg,#fbf8f2,#ead6c3)]", accent: "bg-[#7d5a5f]" },
  { key: "minimal", label: "Minimal", description: "Tinh gọn, sáng và tập trung nội dung.", sample: "bg-[linear-gradient(135deg,#f8fafc,#e2e8f0)]", accent: "bg-slate-700" },
]

const viewportWidths: Record<Viewport, string> = { desktop: "100%", tablet: "768px", mobile: "390px" }

function SubmitButton() {
  const { pending } = useFormStatus()
  return <Button type="submit" disabled={pending} className="min-h-(--control-min-size) w-full sm:w-auto" variant="event">{pending ? <><LoaderCircle aria-hidden="true" className="animate-spin" />Đang lưu…</> : "Lưu thay đổi"}</Button>
}

export function ThemeEditor({ action, eventTitle, eventDescription, initialTheme, initialCover }: { action: (state: EventActionState, formData: FormData) => Promise<EventActionState>; eventTitle: string; eventDescription: string; initialTheme: string; initialCover: string | null }) {
  const [state, formAction] = useActionState(action, {})
  const [viewport, setViewport] = useState<Viewport>("desktop")
  const [isDirty, setIsDirty] = useState(false)
  const [cover, setCover] = useState(initialCover || "")
  const [theme, setTheme] = useState<ThemeKey>((themes.some((item) => item.key === initialTheme) ? initialTheme : "graduation") as ThemeKey)
  const coverIsCloudinary = /^https:\/\/res\.cloudinary\.com\//.test(cover)

  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(18rem,0.75fr)_minmax(0,1.55fr)]">
      <form action={formAction} onChange={() => setIsDirty(true)} className="min-w-0 space-y-6 rounded-3xl border border-border/80 bg-card p-5 shadow-sm sm:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Event identity</p>
          <h2 className="mt-1 font-heading text-xl font-semibold">Chọn cảm xúc cho sự kiện</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Preset chỉ thay đổi lớp hiển thị public của event; Product UI vẫn giữ token riêng.</p>
        </div>

        {state.error ? <p className="rounded-xl border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-sm text-status-danger" role="alert">{state.error}</p> : null}
        {state.message ? <p className="rounded-xl border border-status-success/30 bg-status-success/10 px-3 py-2 text-sm text-status-success" role="status">{state.message}</p> : null}

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold">Theme preset</legend>
          <div className="grid gap-3">
            {themes.map((item) => {
              const selected = theme === item.key
              return (
                <label key={item.key} className={`relative flex cursor-pointer gap-3 rounded-2xl border p-3 transition-all focus-within:ring-3 focus-within:ring-focus/40 ${selected ? "border-primary bg-primary/5 shadow-sm" : "border-border/80 hover:border-primary/35 hover:bg-muted/30"}`}>
                  <input type="radio" name="theme_key" value={item.key} checked={selected} onChange={() => setTheme(item.key)} className="sr-only" />
                  <span className={`mt-0.5 flex size-12 shrink-0 items-end justify-end rounded-xl p-1.5 ${item.sample}`}><span className={`size-4 rounded-full ${item.accent} ring-2 ring-white/80`} /></span>
                  <span className="min-w-0"><span className="flex items-center gap-2 text-sm font-semibold">{item.label}{selected ? <Check aria-hidden="true" className="size-4 text-primary" /> : null}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{item.description}</span></span>
                </label>
              )
            })}
          </div>
        </fieldset>

        <div className="grid gap-2">
          <Label htmlFor="cover_path">Cloudinary cover URL</Label>
          <input id="cover_path" name="cover_path" value={cover} onChange={(event) => setCover(event.target.value)} placeholder="https://res.cloudinary.com/..." className="min-h-11 rounded-xl border border-border/80 bg-background/70 px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-focus/40" aria-describedby="cover-help" />
          <p id="cover-help" className="text-xs leading-5 text-muted-foreground">Chỉ dùng delivery URL từ Cloudinary. Upload media chưa nằm trong task này.</p>
          {cover && !coverIsCloudinary ? <p className="rounded-lg bg-status-danger/10 px-3 py-2 text-sm text-status-danger" role="alert">Cover chưa hợp lệ; preview sẽ dùng fallback cho đến khi nhập Cloudinary URL.</p> : null}
        </div>

        <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground" role="status" aria-live="polite">{isDirty ? "Có thay đổi chưa lưu" : "Đã lưu"}</p>
          <SubmitButton />
        </div>
      </form>

      <section className="min-w-0 rounded-3xl border border-border/80 bg-surface-sunken p-4 sm:p-5" aria-labelledby="theme-preview-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p id="theme-preview-heading" className="text-sm font-semibold">Live public preview</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Preview an toàn, không truy vấn wish pending/private.</p></div>
          <div className="flex rounded-xl border bg-background p-1" role="group" aria-label="Kích thước preview">
            {(["desktop", "tablet", "mobile"] as const).map((value) => { const Icon = value === "desktop" ? Monitor : value === "tablet" ? Tablet : Smartphone; return <Button key={value} type="button" size="sm" variant={viewport === value ? "default" : "ghost"} onClick={() => setViewport(value)} aria-pressed={viewport === value}><Icon aria-hidden="true" className="size-4" /><span className="sr-only sm:not-sr-only">{value}</span></Button> })}
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border bg-background p-2 sm:p-3">
          <div className="mx-auto min-w-0 transition-[max-width]" style={{ maxWidth: viewportWidths[viewport] }}>
            <div data-event-theme={theme} className="event-theme overflow-hidden rounded-2xl border shadow-sm">
              <div className="relative min-h-64 overflow-hidden p-6 sm:p-8" style={{ backgroundColor: "var(--event-background)", color: "var(--event-text)" }}>
                {coverIsCloudinary ? <Image src={cover} alt="" fill sizes="(max-width: 768px) 100vw, 60vw" className="object-cover opacity-25" /> : null}
                <div className="relative z-10 max-w-xl"><p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--event-primary)" }}>Memoria</p><h2 className="mt-4 font-heading text-3xl font-semibold">{eventTitle}</h2><p className="mt-3 text-sm leading-6" style={{ color: "var(--event-muted)" }}>{eventDescription || "Mô tả sự kiện sẽ xuất hiện ở đây."}</p><div className="mt-6 inline-flex rounded-full px-4 py-3 text-sm font-medium" style={{ backgroundColor: "var(--event-primary)", color: "var(--event-on-primary)" }}>Gửi lời chúc</div></div>
              </div>
              <div className="grid gap-4 p-4 sm:grid-cols-2" style={{ backgroundColor: "var(--event-surface)" }}><article className="rounded-2xl border p-4" style={{ borderColor: "var(--event-border)" }}><p className="text-sm leading-6">Một lời chúc được duyệt sẽ xuất hiện ở đây.</p><p className="mt-3 text-xs" style={{ color: "var(--event-muted)" }}>Approved public content only</p></article><article className="rounded-2xl border p-4" style={{ borderColor: "var(--event-border)" }}><p className="text-sm leading-6">Gallery và QR sẽ theo cùng event theme.</p><p className="mt-3 text-xs" style={{ color: "var(--event-muted)" }}>Theme: {theme}</p></article></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}