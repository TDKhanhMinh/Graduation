"use client"

import { Check, LoaderCircle, Maximize2, Monitor, Smartphone, Tv } from "lucide-react"
import Image from "next/image"
import { useActionState, useEffect, useState } from "react"
import { useFormStatus } from "react-dom"
import { toast } from "sonner"

import { EFFECT_PRESETS, type EffectIntensity, type EffectPreset } from "@/components/effects/effect-config"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { EventActionState } from "@/features/events/actions"
import { isCloudinaryDeliveryUrl } from "@/features/media/cloudinary-cover"

import { CloudinaryCoverUpload } from "./cloudinary-cover-upload"

type PreviewViewport = "desktop" | "tv" | "mobile" | "fullscreen"
type ThemeKey = "graduation" | "editorial" | "minimal"
type EffectQuality = "auto" | "low" | "medium" | "high"
type WallLayout = "spotlight" | "grid" | "photo-focus"
type AnimationSpeed = "slow" | "normal" | "fast"

const presetThemeMap: Record<EffectPreset, ThemeKey> = {
  minimal: "minimal",
  elegant: "editorial",
  romantic: "editorial",
  graduation: "graduation",
  celebration: "graduation",
  galaxy: "minimal",
}

const presets: Array<{
  key: EffectPreset
  label: string
  description: string
  hint: string
  sample: string
  accent: string
}> = [
  { key: "minimal", label: "Minimal", description: "Tinh gọn, sáng và tập trung nội dung.", hint: "Low resource", sample: "bg-[linear-gradient(135deg,#f8fafc,#e2e8f0)]", accent: "bg-slate-700" },
  { key: "elegant", label: "Elegant", description: "Mềm mại với chất tạp chí hiện đại.", hint: "Balanced", sample: "bg-[linear-gradient(135deg,#fbf8f2,#ead6c3)]", accent: "bg-[#7d5a5f]" },
  { key: "romantic", label: "Romantic", description: "Ấm áp, dịu dàng và giàu cảm xúc.", hint: "Balanced", sample: "bg-[linear-gradient(135deg,#fff1f2,#fbcfe8)]", accent: "bg-pink-500" },
  { key: "graduation", label: "Graduation", description: "Trang trọng, nổi bật và giàu năng lượng.", hint: "Medium resource", sample: "bg-[linear-gradient(135deg,var(--brand-50),var(--memory-peach))]", accent: "bg-primary" },
  { key: "celebration", label: "Celebration", description: "Rực rỡ cho những khoảnh khắc đáng nhớ.", hint: "High resource", sample: "bg-[linear-gradient(135deg,#fef3c7,#fed7aa)]", accent: "bg-orange-500" },
  { key: "galaxy", label: "Galaxy", description: "Không gian sâu, huyền ảo và chuyển động nhẹ.", hint: "High resource", sample: "bg-[linear-gradient(135deg,#172554,#581c87)]", accent: "bg-violet-400" },
]

const viewportWidths: Record<PreviewViewport, string> = {
  desktop: "100%",
  tv: "960px",
  mobile: "390px",
  fullscreen: "100%",
}

const legacyPresetFallback: Record<ThemeKey, EffectPreset> = {
  graduation: "graduation",
  editorial: "elegant",
  minimal: "minimal",
}

function isPreset(value: string): value is EffectPreset {
  return EFFECT_PRESETS.includes(value as EffectPreset)
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending} className="min-h-(--control-min-size) w-full sm:w-auto" variant="event">
      {pending ? <><LoaderCircle aria-hidden="true" className="animate-spin" />Đang lưu…</> : "Lưu thay đổi"}
    </Button>
  )
}

type ThemeEditorProps = {
  action: (state: EventActionState, formData: FormData) => Promise<EventActionState>
  eventTitle: string
  eventDescription: string
  initialTheme: string
  initialCover: string | null
  initialExperiencePreset?: string
  initialEffectIntensity?: EffectIntensity
  initialEffectQuality?: EffectQuality
  initialWallLayout?: WallLayout
  initialQrVisible?: boolean
  initialQrCta?: string
  initialAnimationSpeed?: AnimationSpeed
}

export function ThemeEditor({
  action,
  eventTitle,
  eventDescription,
  initialTheme,
  initialCover,
  initialExperiencePreset,
  initialEffectIntensity = "low",
  initialEffectQuality = "auto",
  initialWallLayout = "spotlight",
  initialQrVisible = true,
  initialQrCta = "Send a wish",
  initialAnimationSpeed = "normal",
}: ThemeEditorProps) {
  const [state, formAction] = useActionState(action, {})
  const [viewport, setViewport] = useState<PreviewViewport>("desktop")
  const [isDirty, setIsDirty] = useState(false)
  const [cover, setCover] = useState(initialCover || "")
  const [experiencePreset, setExperiencePreset] = useState<EffectPreset>(
    initialExperiencePreset && isPreset(initialExperiencePreset)
      ? initialExperiencePreset
      : legacyPresetFallback[(initialTheme as ThemeKey) in legacyPresetFallback ? initialTheme as ThemeKey : "minimal"],
  )
  const [intensity, setIntensity] = useState<EffectIntensity>(initialEffectIntensity)
  const [quality, setQuality] = useState<EffectQuality>(initialEffectQuality)
  const [layout, setLayout] = useState<WallLayout>(initialWallLayout)
  const [qrVisible, setQrVisible] = useState(initialQrVisible)
  const [qrCta, setQrCta] = useState(initialQrCta)
  const [animationSpeed, setAnimationSpeed] = useState<AnimationSpeed>(initialAnimationSpeed)
  const coverIsCloudinary = isCloudinaryDeliveryUrl(cover)
  const previewTheme = presetThemeMap[experiencePreset]

  useEffect(() => {
    if (state.error) toast.error(state.error)
    if (state.message) toast.success(state.message)
  }, [state.error, state.message])

  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(18rem,0.75fr)_minmax(0,1.55fr)]">
      <form
        action={formAction}
        onChange={() => setIsDirty(true)}
        className="min-w-0 space-y-6 rounded-3xl border border-border/80 bg-card p-5 shadow-sm sm:p-6"
      >
        <input type="hidden" name="theme_key" value={previewTheme} />
        <input type="hidden" name="experience_preset" value={experiencePreset} />

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Cấu hình Giao diện Sự kiện</p>
          <h2 className="mt-1 font-heading text-xl font-semibold">Chọn trải nghiệm cho sự kiện</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Giao diện mẫu điều khiển lớp hiển thị công khai; giao diện hệ thống vẫn giữ nguyên.
          </p>
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold">Trải nghiệm hiển thị (Preset)</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {presets.map((item) => {
              const selected = experiencePreset === item.key
              return (
                <label
                  key={item.key}
                  className={`relative flex min-w-0 cursor-pointer gap-3 rounded-2xl border p-3 transition-all focus-within:ring-3 focus-within:ring-focus/40 ${selected ? "border-primary bg-primary/5 shadow-sm" : "border-border/80 hover:border-primary/35 hover:bg-muted/30"}`}
                >
                  <input
                    type="radio"
                    name="preset_choice"
                    value={item.key}
                    checked={selected}
                    onChange={() => setExperiencePreset(item.key)}
                    className="sr-only"
                  />
                  <span className={`mt-0.5 flex size-12 shrink-0 items-end justify-end rounded-xl p-1.5 ${item.sample}`}>
                    <span className={`size-4 rounded-full ${item.accent} ring-2 ring-white/80`} />
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      {item.label}
                      {selected ? <Check aria-hidden="true" className="size-4 text-primary" /> : null}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">{item.description}</span>
                    <span className="mt-1 block text-[11px] font-medium text-primary/80">{item.hint}</span>
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="effect_intensity">Cường độ hiệu ứng</Label>
            <select id="effect_intensity" name="effect_intensity" value={intensity} onChange={(event) => setIntensity(event.target.value as EffectIntensity)} className="min-h-11 rounded-xl border border-border/80 bg-background/70 px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-focus/40">
              <option value="off">tắt</option>
              <option value="low">thấp</option>
              <option value="medium">trung bình</option>
              <option value="high">cao</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="effect_quality">Chất lượng hiệu ứng</Label>
            <select id="effect_quality" name="effect_quality" value={quality} onChange={(event) => setQuality(event.target.value as EffectQuality)} className="min-h-11 rounded-xl border border-border/80 bg-background/70 px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-focus/40">
              <option value="auto">tự động</option>
              <option value="low">thấp</option>
              <option value="medium">trung bình</option>
              <option value="high">cao</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="wall_layout">Bố cục bức tường</Label>
            <select id="wall_layout" name="wall_layout" value={layout} onChange={(event) => setLayout(event.target.value as WallLayout)} className="min-h-11 rounded-xl border border-border/80 bg-background/70 px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-focus/40">
              <option value="spotlight">Nổi bật</option>
              <option value="grid">Dạng lưới</option>
              <option value="photo-focus">Ưu tiên ảnh</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="animation_speed">Tốc độ hoạt ảnh</Label>
            <select id="animation_speed" name="animation_speed" value={animationSpeed} onChange={(event) => setAnimationSpeed(event.target.value as AnimationSpeed)} className="min-h-11 rounded-xl border border-border/80 bg-background/70 px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-focus/40">
              <option value="slow">chậm</option>
              <option value="normal">bình thường</option>
              <option value="fast">nhanh</option>
            </select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-end">
          <label className="flex min-h-11 items-center gap-2 text-sm font-medium">
            <input type="hidden" name="qr_visible" value="false" />
            <input type="checkbox" name="qr_visible" value="true" checked={qrVisible} onChange={(event) => setQrVisible(event.target.checked)} className="size-4 rounded border-border accent-primary" />
            Hiển thị mã QR
          </label>
          <div className="grid gap-2">
            <Label htmlFor="qr_cta">Nội dung nút gọi hành động QR</Label>
            <input id="qr_cta" name="qr_cta" value={qrCta} onChange={(event) => setQrCta(event.target.value)} maxLength={80} className="min-h-11 rounded-xl border border-border/80 bg-background/70 px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-focus/40" />
          </div>
        </div>

        <div className="grid gap-2">
          <CloudinaryCoverUpload value={cover} onChange={(value) => { setCover(value); setIsDirty(true) }} />
          <Label htmlFor="cover_path">Đường dẫn ảnh bìa (Cloudinary URL)</Label>
          <input id="cover_path" name="cover_path" value={cover} onChange={(event) => setCover(event.target.value)} placeholder="https://res.cloudinary.com/..." className="min-h-11 rounded-xl border border-border/80 bg-background/70 px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-focus/40" aria-describedby="cover-help" />
          <p id="cover-help" className="text-xs leading-5 text-muted-foreground">Chỉ dùng đường dẫn (delivery URL) từ Cloudinary.</p>
          {cover && !coverIsCloudinary ? <p className="rounded-lg bg-status-danger/10 px-3 py-2 text-sm text-status-danger" role="alert">Đường dẫn chưa hợp lệ; bản xem trước sẽ dùng ảnh mặc định cho đến khi nhập Cloudinary URL.</p> : null}
        </div>

        <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground" role="status" aria-live="polite">{state.message ? "Đã lưu" : isDirty ? "Có thay đổi chưa lưu" : "Đã lưu"}</p>
          <SubmitButton />
        </div>
      </form>

      <section className="min-w-0 rounded-3xl border border-border/80 bg-surface-sunken p-4 sm:p-5" aria-labelledby="theme-preview-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p id="theme-preview-heading" className="text-sm font-semibold">Xem trước giao diện công khai</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Chế độ xem an toàn, không hiển thị dữ liệu riêng tư.</p>
          </div>
          <div className="flex flex-wrap rounded-xl border bg-background p-1" role="group" aria-label="Kích thước xem trước">
            {([
              ["desktop", Monitor, "Máy tính"],
              ["tv", Tv, "TV 16:9"],
              ["mobile", Smartphone, "Điện thoại 9:16"],
              ["fullscreen", Maximize2, "Toàn màn hình"],
            ] as const).map(([value, Icon, label]) => (
              <Button key={value} type="button" size="sm" variant={viewport === value ? "default" : "ghost"} onClick={() => setViewport(value)} aria-pressed={viewport === value}>
                <Icon aria-hidden="true" className="size-4" />
                <span className="sr-only sm:not-sr-only">{label}</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border bg-background p-2 sm:p-3">
          <div className="mx-auto min-w-0 transition-[max-width]" style={{ maxWidth: viewportWidths[viewport] }}>
            <div
              data-event-theme={previewTheme}
              className={`event-theme overflow-hidden rounded-2xl border shadow-sm ${viewport === "tv" ? "aspect-video" : viewport === "mobile" ? "aspect-[9/16] max-h-[60vh]" : viewport === "fullscreen" ? "min-h-[32rem]" : ""}`}
            >
              <div className="relative min-h-64 overflow-hidden p-6 sm:p-8" style={{ backgroundColor: "var(--event-background)", color: "var(--event-text)" }}>
                {coverIsCloudinary ? <Image src={cover} alt="" fill sizes="(max-width: 768px) 100vw, 60vw" className="object-cover opacity-25" /> : null}
                <div className="relative z-10 max-w-xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--event-primary)" }}>Memoria</p>
                  <h2 className="mt-4 font-heading text-3xl font-semibold">{eventTitle}</h2>
                  <p className="mt-3 text-sm leading-6" style={{ color: "var(--event-muted)" }}>{eventDescription || "Mô tả sự kiện sẽ xuất hiện ở đây."}</p>
                  <div className="mt-6 inline-flex rounded-full px-4 py-3 text-sm font-medium" style={{ backgroundColor: "var(--event-primary)", color: "var(--event-on-primary)" }}>{qrVisible ? qrCta : "Gửi lời chúc"}</div>
                </div>
              </div>
              <div className="grid gap-4 p-4 sm:grid-cols-2" style={{ backgroundColor: "var(--event-surface)" }}>
                <article className="rounded-2xl border p-4" style={{ borderColor: "var(--event-border)" }}>
                  <p className="text-sm leading-6">Một lời chúc được duyệt sẽ xuất hiện ở đây.</p>
                  <p className="mt-3 text-xs" style={{ color: "var(--event-muted)" }}>Chỉ hiển thị nội dung đã duyệt</p>
                </article>
                <article className="rounded-2xl border p-4" style={{ borderColor: "var(--event-border)" }}>
                  <p className="text-sm leading-6">{qrVisible ? "Mã QR sẽ hiển thị theo cấu hình." : "Mã QR đã được ẩn theo cấu hình."}</p>
                  <p className="mt-3 text-xs" style={{ color: "var(--event-muted)" }}>Giao diện mẫu: {experiencePreset} · Chất lượng: {quality}</p>
                </article>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
