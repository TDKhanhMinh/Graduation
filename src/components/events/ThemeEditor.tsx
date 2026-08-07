"use client"

import { Check, LoaderCircle, Maximize2, Monitor, Smartphone, Tv } from "lucide-react"

import { useActionState, useEffect, useState } from "react"
import { useFormStatus } from "react-dom"
import { toast } from "sonner"

import { EFFECT_PRESETS, type EffectIntensity, type EffectPreset } from "@/components/effects/effect-config"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Label } from "@/components/ui/label"
import type { EventActionState } from "@/features/events/actions"
import { getDefaultWelcomeHeroConfig, type WelcomeHeroConfig } from "@/features/events/welcome-config"
import { isCloudinaryDeliveryUrl } from "@/features/media/cloudinary-cover"

import { CloudinaryCoverUpload } from "./cloudinary-cover-upload"
import { WelcomeHeroPreview } from "./welcome-hero-preview"

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
  { key: "minimal", label: "Tối giản", description: "Tinh gọn, sáng và tập trung nội dung.", hint: "Ít tài nguyên", sample: "bg-[linear-gradient(135deg,#f8fafc,#e2e8f0)]", accent: "bg-slate-700" },
  { key: "elegant", label: "Thanh lịch", description: "Mềm mại với chất tạp chí hiện đại.", hint: "Cân bằng", sample: "bg-[linear-gradient(135deg,#fbf8f2,#ead6c3)]", accent: "bg-[#7d5a5f]" },
  { key: "romantic", label: "Lãng mạn", description: "Ấm áp, dịu dàng và giàu cảm xúc.", hint: "Cân bằng", sample: "bg-[linear-gradient(135deg,#fff1f2,#fbcfe8)]", accent: "bg-pink-500" },
  { key: "graduation", label: "Tốt nghiệp", description: "Trang trọng, nổi bật và giàu năng lượng.", hint: "Tài nguyên trung bình", sample: "bg-[linear-gradient(135deg,var(--brand-50),var(--memory-peach))]", accent: "bg-primary" },
  { key: "celebration", label: "Chúc mừng", description: "Rực rỡ cho những khoảnh khắc đáng nhớ.", hint: "Nhiều tài nguyên", sample: "bg-[linear-gradient(135deg,#fef3c7,#fed7aa)]", accent: "bg-orange-500" },
  { key: "galaxy", label: "Ngân hà", description: "Không gian sâu, huyền ảo và chuyển động nhẹ.", hint: "Nhiều tài nguyên", sample: "bg-[linear-gradient(135deg,#172554,#581c87)]", accent: "bg-violet-400" },
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
  eventDate?: string | null
  initialTheme: string
  initialCover: string | null
  initialExperiencePreset?: string
  initialEffectIntensity?: EffectIntensity
  initialEffectQuality?: EffectQuality
  initialWallLayout?: WallLayout
  initialQrVisible?: boolean
  initialQrCta?: string
  initialAnimationSpeed?: AnimationSpeed
  initialWelcomeHeroConfig?: WelcomeHeroConfig
}

export function ThemeEditor({
  action,
  eventTitle,
  eventDescription,
  eventDate,
  initialTheme,
  initialCover,
  initialExperiencePreset,
  initialEffectIntensity = "low",
  initialEffectQuality = "auto",
  initialWallLayout = "spotlight",
  initialQrVisible = true,
  initialQrCta = "Gửi lời chúc",
  initialAnimationSpeed = "normal",
  initialWelcomeHeroConfig = getDefaultWelcomeHeroConfig(),
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
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const handleResetTheme = () => {
    setCover(initialCover || "")
    setExperiencePreset(
      initialExperiencePreset && isPreset(initialExperiencePreset)
        ? initialExperiencePreset
        : legacyPresetFallback[(initialTheme as ThemeKey) in legacyPresetFallback ? initialTheme as ThemeKey : "minimal"],
    )
    setIntensity(initialEffectIntensity)
    setQuality(initialEffectQuality)
    setIsDirty(false)
    setShowResetConfirm(false)
    toast.success("Đã khôi phục cài đặt giao diện về ban đầu.")
  }
  const [layout, setLayout] = useState<WallLayout>(initialWallLayout)
  const [qrVisible, setQrVisible] = useState(initialQrVisible)
  const [qrCta, setQrCta] = useState(initialQrCta)
  const [animationSpeed, setAnimationSpeed] = useState<AnimationSpeed>(initialAnimationSpeed)
  const [welcomeConfig, setWelcomeConfig] = useState<WelcomeHeroConfig>(initialWelcomeHeroConfig)
  const [reducedMotionPreview, setReducedMotionPreview] = useState(false)
  const coverIsCloudinary = isCloudinaryDeliveryUrl(cover)
  const previewTheme = presetThemeMap[experiencePreset]

  const updateWelcomeConfig = (patch: Partial<WelcomeHeroConfig>) => {
    setWelcomeConfig((current) => ({ ...current, ...patch }))
  }

  const updateWelcomePoster = (patch: Partial<WelcomeHeroConfig["poster"]>) => {
    setWelcomeConfig((current) => ({ ...current, poster: { ...current.poster, ...patch } }))
  }

  const updateWelcomeEffects = (patch: Partial<WelcomeHeroConfig["effects"]>) => {
    setWelcomeConfig((current) => ({ ...current, effects: { ...current.effects, ...patch } }))
  }

  useEffect(() => {
    if (state.error) toast.error(state.error)
    if (state.message) toast.success(state.message)
  }, [state.error, state.message])

  return (
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(18rem,0.75fr)_minmax(0,1.55fr)]">
      <form
        action={formAction}
        onChange={() => setIsDirty(true)}
        className="min-w-0 space-y-8 rounded-3xl border border-border/80 bg-card p-5 shadow-sm sm:p-6 lg:p-8"
      >
        <input type="hidden" name="theme_key" value={previewTheme} />
        <input type="hidden" name="experience_preset" value={experiencePreset} />
        <input type="hidden" name="welcome_hero" value={JSON.stringify(welcomeConfig)} />

        <div className="border-b border-border/80 pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Cấu hình Giao diện</p>
          <h2 className="mt-1 font-heading text-2xl font-semibold">Thiết kế Trải nghiệm Sự kiện</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Cá nhân hóa giao diện hiển thị cho khách mời. Các thay đổi sẽ được cập nhật ngay trên bản xem trước.
          </p>
        </div>

        {/* Section 1: Mẫu giao diện */}
        <section className="space-y-4">
          <header>
            <h3 className="text-base font-semibold">1. Mẫu trải nghiệm (Theme)</h3>
            <p className="text-sm text-muted-foreground mt-1">Chọn phong cách chủ đạo cho toàn bộ sự kiện.</p>
          </header>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
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
                    onChange={() => {
                      setExperiencePreset(item.key)
                      updateWelcomeEffects({ preset: item.key })
                    }}
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
        </section>

        {/* Section 2: Trang chào mừng */}
        <section className="rounded-2xl border border-primary/15 bg-primary/5 p-5 sm:p-6 transition-colors">
          <header className="flex flex-col gap-3 border-b border-primary/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold">2. Màn hình Chào mừng (Welcome Hero)</h3>
              <p className="text-sm text-muted-foreground mt-1">Màn hình đầu tiên khách mời nhìn thấy.</p>
            </div>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/80 bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-muted/50 focus-within:ring-3 focus-within:ring-focus/40">
              <input type="checkbox" checked={welcomeConfig.enabled} onChange={(event) => updateWelcomeConfig({ enabled: event.target.checked })} className="size-4 rounded border-border accent-primary" />
              Kích hoạt
            </label>
          </header>

          <div className={`mt-5 space-y-4 ${!welcomeConfig.enabled ? "pointer-events-none opacity-50 grayscale transition-all" : "transition-all"}`}>
            <div className="grid gap-4 grid-cols-1">
              <div className="grid gap-2 min-w-0">
                <Label htmlFor="welcome_layout">Bố cục trang chào mừng</Label>
                <select id="welcome_layout" value={welcomeConfig.layout} onChange={(event) => updateWelcomeConfig({ layout: event.target.value as WelcomeHeroConfig["layout"] })} className="w-full min-h-11 rounded-xl border border-border/80 bg-background/70 px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-focus/40">
                  <option value="poster-focus">Poster Focus</option>
                  <option value="split">Cinematic Split</option>
                  <option value="full-bleed">Full Bleed</option>
                  <option value="minimal">Minimal</option>
                </select>
              </div>
              <div className="grid gap-2 min-w-0">
                <Label htmlFor="welcome_primary_label">Nút gọi hành động (CTA) chính</Label>
                <input id="welcome_primary_label" value={welcomeConfig.primaryLabel} onChange={(event) => updateWelcomeConfig({ primaryLabel: event.target.value })} maxLength={80} className="w-full min-h-11 rounded-xl border border-border/80 bg-background/70 px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-focus/40" />
              </div>
              <div className="grid gap-2 min-w-0">
                <Label htmlFor="welcome_secondary_label">Nút gọi hành động (CTA) phụ</Label>
                <input id="welcome_secondary_label" value={welcomeConfig.secondaryLabel} onChange={(event) => updateWelcomeConfig({ secondaryLabel: event.target.value })} maxLength={80} className="w-full min-h-11 rounded-xl border border-border/80 bg-background/70 px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-focus/40" />
              </div>
              <div className="grid gap-2 min-w-0">
                <Label htmlFor="welcome_message">Lời chào tùy chỉnh</Label>
                <textarea id="welcome_message" value={welcomeConfig.message ?? ""} onChange={(event) => updateWelcomeConfig({ message: event.target.value || null })} maxLength={500} rows={3} className="w-full min-h-24 resize-y rounded-xl border border-border/80 bg-background/70 px-3 py-2 text-sm leading-6 outline-none focus-visible:ring-3 focus-visible:ring-focus/40" placeholder="Để trống để dùng lời chào mặc định." />
              </div>
            </div>
            <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-3">
              {([
                ["showDate", "Hiển thị ngày"],
                ["showLocation", "Hiển thị địa điểm"],
                ["showHost", "Hiển thị host"],
              ] as const).map(([key, label]) => (
                <label key={key} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-border/70 bg-background/60 px-3 text-sm hover:bg-background/80 transition-colors">
                  <input type="checkbox" checked={welcomeConfig[key]} onChange={(event) => updateWelcomeConfig({ [key]: event.target.checked })} className="size-4 rounded border-border accent-primary" />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* Section 3: Poster và hiệu ứng */}
        <section className="space-y-5 rounded-2xl border border-border/80 bg-surface-sunken p-5 sm:p-6">
          <header>
            <h3 className="text-base font-semibold">3. Poster & Hiệu ứng Chuyển động</h3>
            <p className="text-sm text-muted-foreground mt-1">Tùy chỉnh cách hiển thị ảnh bìa và các hiệu ứng đi kèm.</p>
          </header>
          
          <div className="grid gap-4 grid-cols-1">
            <div className="grid gap-2 min-w-0">
              <Label htmlFor="welcome_poster_fit">Cách căn chỉnh poster</Label>
              <select id="welcome_poster_fit" value={welcomeConfig.poster.fit} onChange={(event) => updateWelcomePoster({ fit: event.target.value as WelcomeHeroConfig["poster"]["fit"] })} className="w-full min-h-11 rounded-xl border border-border/80 bg-background/70 px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-focus/40">
                <option value="contain">Giữ đủ toàn bộ poster (Contain)</option>
                <option value="cover">Phủ kín toàn bộ khung (Cover)</option>
              </select>
            </div>
            <div className="grid gap-2 min-w-0">
              <Label htmlFor="welcome_poster_position">Vị trí trọng tâm poster</Label>
              <select id="welcome_poster_position" value={welcomeConfig.poster.position} onChange={(event) => updateWelcomePoster({ position: event.target.value as WelcomeHeroConfig["poster"]["position"] })} className="w-full min-h-11 rounded-xl border border-border/80 bg-background/70 px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-focus/40">
                <option value="center">Ở giữa (Center)</option>
                <option value="top">Phía trên (Top)</option>
                <option value="bottom">Phía dưới (Bottom)</option>
              </select>
            </div>
          </div>
          
          <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-3">
            {([
              ["border", "Viền poster"],
              ["shadow", "Đổ bóng mờ"],
              ["backgroundBlur", "Hình nền mờ ảo"],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-border/70 bg-background px-3 text-sm hover:bg-muted/30 transition-colors">
                <input type="checkbox" checked={welcomeConfig.poster[key]} onChange={(event) => updateWelcomePoster({ [key]: event.target.checked })} className="size-4 rounded border-border accent-primary" />
                {label}
              </label>
            ))}
          </div>
          
          <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-3">
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-border/70 bg-background px-3 text-sm hover:bg-muted/30 transition-colors">
              <input type="checkbox" checked={welcomeConfig.effects.particles} onChange={(event) => updateWelcomeEffects({ particles: event.target.checked })} className="size-4 rounded border-border accent-primary" />
              Hạt trang trí bay
            </label>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-border/70 bg-background px-3 text-sm hover:bg-muted/30 transition-colors">
              <input type="checkbox" checked={welcomeConfig.effects.introAnimation} onChange={(event) => updateWelcomeEffects({ introAnimation: event.target.checked })} className="size-4 rounded border-border accent-primary" />
              Hoạt ảnh xuất hiện
            </label>
            <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-border/70 bg-background px-3 text-sm hover:bg-muted/30 transition-colors">
              <input type="checkbox" checked={reducedMotionPreview} onChange={(event) => setReducedMotionPreview(event.target.checked)} className="size-4 rounded border-border accent-primary" />
              Xem trước (Tắt animation)
            </label>
          </div>
        </section>

        {/* Section 4: Tính năng khác */}
        <section className="space-y-5">
          <header>
            <h3 className="text-base font-semibold">4. Cấu hình tính năng khác</h3>
            <p className="text-sm text-muted-foreground mt-1">Quản lý mã QR và bức tường thông điệp.</p>
          </header>
          
          <div className="grid gap-4 grid-cols-1">
            <div className="grid gap-2 min-w-0">
              <Label htmlFor="effect_intensity">Cường độ hiệu ứng chung</Label>
              <select id="effect_intensity" name="effect_intensity" value={intensity} onChange={(event) => { const next = event.target.value as EffectIntensity; setIntensity(next); updateWelcomeEffects({ intensity: next }) }} className="w-full min-h-11 rounded-xl border border-border/80 bg-background/70 px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-focus/40">
                <option value="off">Tắt</option>
                <option value="low">Thấp</option>
                <option value="medium">Trung bình</option>
                <option value="high">Cao</option>
              </select>
            </div>
            <div className="grid gap-2 min-w-0">
              <Label htmlFor="effect_quality">Chất lượng đồ họa</Label>
              <select id="effect_quality" name="effect_quality" value={quality} onChange={(event) => setQuality(event.target.value as EffectQuality)} className="w-full min-h-11 rounded-xl border border-border/80 bg-background/70 px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-focus/40">
                <option value="auto">Tự động (Khuyên dùng)</option>
                <option value="low">Thấp (Tối ưu hiệu năng)</option>
                <option value="medium">Trung bình</option>
                <option value="high">Cao (Hình ảnh sắc nét)</option>
              </select>
            </div>
            <div className="grid gap-2 min-w-0">
              <Label htmlFor="wall_layout">Bố cục tường thông điệp</Label>
              <select id="wall_layout" name="wall_layout" value={layout} onChange={(event) => setLayout(event.target.value as WallLayout)} className="w-full min-h-11 rounded-xl border border-border/80 bg-background/70 px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-focus/40">
                <option value="spotlight">Spotlight (Tập trung lời chúc)</option>
                <option value="grid">Grid (Dạng lưới cổ điển)</option>
                <option value="photo-focus">Photo Focus (Ưu tiên hiển thị ảnh)</option>
              </select>
            </div>
            <div className="grid gap-2 min-w-0">
              <Label htmlFor="animation_speed">Tốc độ cuộn của tường</Label>
              <select id="animation_speed" name="animation_speed" value={animationSpeed} onChange={(event) => setAnimationSpeed(event.target.value as AnimationSpeed)} className="w-full min-h-11 rounded-xl border border-border/80 bg-background/70 px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-focus/40">
                <option value="slow">Chậm rãi</option>
                <option value="normal">Bình thường</option>
                <option value="fast">Nhanh</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-border/80 p-4 bg-muted/10">
            <label className="flex cursor-pointer items-center gap-3 text-sm font-medium">
              <input type="hidden" name="qr_visible" value="false" />
              <input type="checkbox" name="qr_visible" value="true" checked={qrVisible} onChange={(event) => setQrVisible(event.target.checked)} className="size-4 rounded border-border accent-primary" />
              Hiển thị mã QR
            </label>
            <div className={`grid gap-2 min-w-0 transition-opacity ${!qrVisible ? "opacity-50 pointer-events-none" : ""}`}>
              <Label htmlFor="qr_cta">Nội dung kêu gọi ở mã QR</Label>
              <input id="qr_cta" name="qr_cta" value={qrCta} onChange={(event) => setQrCta(event.target.value)} maxLength={80} className="w-full min-h-11 rounded-xl border border-border/80 bg-background/70 px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-focus/40" placeholder="Ví dụ: Quét mã để gửi lời chúc!" />
            </div>
          </div>
        </section>

        {/* Section 5: Ảnh bìa */}
        <section className="space-y-4 pt-2">
          <header>
            <h3 className="text-base font-semibold">5. Ảnh bìa sự kiện</h3>
            <p className="text-sm text-muted-foreground mt-1">Hình ảnh đại diện sẽ hiển thị trên poster và các giao diện.</p>
          </header>
          
          <div className="grid gap-3 rounded-2xl border border-border/80 p-4 sm:p-5 bg-card shadow-sm">
            <CloudinaryCoverUpload value={cover} onChange={(value) => { setCover(value); setIsDirty(true) }} />
            <div className="mt-2 grid gap-2 min-w-0">
              <Label htmlFor="cover_path" className="truncate">Hoặc dán đường dẫn ảnh bìa (URL Cloudinary)</Label>
              <input id="cover_path" name="cover_path" value={cover} onChange={(event) => { setCover(event.target.value); setIsDirty(true) }} placeholder="https://res.cloudinary.com/..." className="w-full min-w-0 min-h-11 rounded-xl border border-border/80 bg-background/70 px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-focus/40" aria-describedby="cover-help" />
              <p id="cover-help" className="text-xs leading-5 text-muted-foreground">Bạn có thể tự nhập URL ảnh từ Cloudinary nếu đã có sẵn.</p>
              {cover && !coverIsCloudinary ? <p className="mt-1 rounded-lg bg-status-danger/10 px-3 py-2 text-sm text-status-danger" role="alert">Đường dẫn chưa hợp lệ; vui lòng sử dụng URL phân phối của Cloudinary.</p> : null}
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground" role="status" aria-live="polite">{state.message ? "Đã lưu" : isDirty ? "Có thay đổi chưa lưu" : "Đã lưu"}</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {isDirty && (
              <Button type="button" variant="outline" onClick={() => setShowResetConfirm(true)} className="min-h-(--control-min-size) w-full sm:w-auto">
                Khôi phục ban đầu
              </Button>
            )}
            <SubmitButton />
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={showResetConfirm}
        onOpenChange={setShowResetConfirm}
        variant="warning"
        title="Khôi phục cài đặt giao diện?"
        description="Mọi thay đổi chưa lưu về hiệu ứng, chất lượng, bố cục và ảnh bìa sẽ được hoàn tác về cài đặt ban đầu của sự kiện."
        confirmText="Khôi phục"
        cancelText="Giữ thay đổi"
        onConfirm={handleResetTheme}
      />

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
            <WelcomeHeroPreview
              eventTitle={eventTitle}
              eventDescription={eventDescription}
              eventDate={eventDate}
              cover={cover}
              coverIsCloudinary={coverIsCloudinary}
              previewTheme={previewTheme}
              experienceLabel={experiencePreset === "minimal" ? "Tối giản" : experiencePreset === "elegant" ? "Thanh lịch" : experiencePreset === "romantic" ? "Lãng mạn" : experiencePreset === "celebration" ? "Chúc mừng" : experiencePreset === "graduation" ? "Tốt nghiệp" : "Ngân hà"}
              qualityLabel={quality === "auto" ? "Tự động" : quality === "low" ? "Thấp" : quality === "medium" ? "Trung bình" : "Cao"}
              viewport={viewport}
              qrVisible={qrVisible}
              qrCta={qrCta}
              reducedMotion={reducedMotionPreview}
              config={welcomeConfig}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
