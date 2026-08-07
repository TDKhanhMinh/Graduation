"use client"

import {
  Check,
  Edit3,
  Eye,
  Image as ImageIcon,
  LoaderCircle,
  Maximize2,
  Monitor,
  Palette,
  RefreshCw,
  Sliders,
  Smartphone,
  Sparkles,
  Tv,
  X,
} from "lucide-react"

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
type StudioTab = "presets" | "welcome" | "poster" | "features"

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
    <Button type="submit" disabled={pending} className="min-h-(--control-min-size) w-full sm:w-auto px-6 font-semibold" variant="event">
      {pending ? <><LoaderCircle aria-hidden="true" className="animate-spin size-4" />Đang lưu…</> : "Lưu thay đổi"}
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
  const [activeTab, setActiveTab] = useState<StudioTab>("presets")
  const [mobileView, setMobileView] = useState<"editor" | "preview">("editor")
  const [viewport, setViewport] = useState<PreviewViewport>("desktop")
  const [isFullscreenPreviewOpen, setIsFullscreenPreviewOpen] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  const [cover, setCover] = useState(initialCover || "")
  const [experiencePreset, setExperiencePreset] = useState<EffectPreset>(
    initialExperiencePreset && isPreset(initialExperiencePreset)
      ? initialExperiencePreset
      : legacyPresetFallback[(initialTheme as ThemeKey) in legacyPresetFallback ? (initialTheme as ThemeKey) : "minimal"],
  )
  const [intensity, setIntensity] = useState<EffectIntensity>(initialEffectIntensity)
  const [quality, setQuality] = useState<EffectQuality>(initialEffectQuality)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

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
    setIsDirty(true)
  }

  const updateWelcomePoster = (patch: Partial<WelcomeHeroConfig["poster"]>) => {
    setWelcomeConfig((current) => ({ ...current, poster: { ...current.poster, ...patch } }))
    setIsDirty(true)
  }

  const updateWelcomeEffects = (patch: Partial<WelcomeHeroConfig["effects"]>) => {
    setWelcomeConfig((current) => ({ ...current, effects: { ...current.effects, ...patch } }))
    setIsDirty(true)
  }

  const handleResetTheme = () => {
    setCover(initialCover || "")
    setExperiencePreset(
      initialExperiencePreset && isPreset(initialExperiencePreset)
        ? initialExperiencePreset
        : legacyPresetFallback[(initialTheme as ThemeKey) in legacyPresetFallback ? (initialTheme as ThemeKey) : "minimal"],
    )
    setIntensity(initialEffectIntensity)
    setQuality(initialEffectQuality)
    setLayout(initialWallLayout)
    setQrVisible(initialQrVisible)
    setQrCta(initialQrCta)
    setAnimationSpeed(initialAnimationSpeed)
    setWelcomeConfig(initialWelcomeHeroConfig)
    setIsDirty(false)
    setShowResetConfirm(false)
    toast.success("Đã khôi phục cài đặt giao diện về ban đầu.")
  }

  useEffect(() => {
    if (state.error) toast.error(state.error)
    if (state.message) {
      toast.success(state.message)
      setIsDirty(false)
    }
  }, [state.error, state.message])

  const tabs = [
    {
      id: "presets" as const,
      label: "Chủ đề & Phong cách",
      description: "Tùy chọn giao diện mẫu, bảng màu và đồ họa",
      icon: Palette,
    },
    {
      id: "welcome" as const,
      label: "Trang Chào mừng",
      description: "Cấu hình màn hình splash chào mừng khách tham dự",
      icon: Sparkles,
    },
    {
      id: "poster" as const,
      label: "Poster & Ảnh bìa",
      description: "Tải lên ảnh bìa Cloudinary và hiệu ứng poster",
      icon: ImageIcon,
    },
    {
      id: "features" as const,
      label: "Bức tường & Mã QR",
      description: "Tùy chỉnh bố cục tường thông điệp và quét mã QR",
      icon: Sliders,
    },
  ]

  return (
    <form action={formAction} onChange={() => setIsDirty(true)} className="space-y-6">
      {/* Hidden inputs to guarantee all form values are submitted regardless of active tab */}
      <input type="hidden" name="theme_key" value={previewTheme} />
      <input type="hidden" name="experience_preset" value={experiencePreset} />
      <input type="hidden" name="welcome_hero" value={JSON.stringify(welcomeConfig)} />
      <input type="hidden" name="effect_intensity" value={intensity} />
      <input type="hidden" name="effect_quality" value={quality} />
      <input type="hidden" name="wall_layout" value={layout} />
      <input type="hidden" name="animation_speed" value={animationSpeed} />
      <input type="hidden" name="qr_visible" value="false" />
      {qrVisible ? <input type="hidden" name="qr_visible" value="true" /> : null}
      <input type="hidden" name="qr_cta" value={qrCta} />
      <input type="hidden" name="cover_path" value={cover} />

      {/* Sticky Studio Top Header Bar */}
      <header className="sticky top-0 z-30 flex flex-col gap-4 rounded-3xl border border-border/80 bg-background/95 p-4 shadow-xs backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Palette className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-lg font-bold sm:text-xl">Giao diện Sự kiện</h1>
              {isDirty ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                  <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Có thay đổi chưa lưu
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Đã đồng bộ
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Tùy chỉnh nhận diện thương hiệu công khai cho sự kiện.</p>
          </div>
        </div>

        {/* Action Controls & Mobile View Switcher */}
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          {/* Mobile / Tablet Segmented View Switcher */}
          <div className="flex rounded-xl border border-border/80 bg-muted/40 p-1 xl:hidden">
            <button
              type="button"
              onClick={() => setMobileView("editor")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${mobileView === "editor" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Edit3 className="size-3.5" />
              <span>Cấu hình</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileView("preview")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${mobileView === "preview" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Eye className="size-3.5" />
              <span>Xem trước</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {isDirty && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowResetConfirm(true)}
                className="hidden sm:inline-flex text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="mr-1.5 size-3.5" />
                Khôi phục
              </Button>
            )}
            <SubmitButton />
          </div>
        </div>
      </header>

      {/* Main Studio Grid: Split Panel on Desktop, View Toggled on Mobile/Tablet */}
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* Left Column: Form Controls with Studio Tabs */}
        <div className={`space-y-6 ${mobileView === "preview" ? "hidden xl:block" : "block"}`}>
          {/* Studio Navigation Tabs - Full Width Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 rounded-2xl border border-border/80 bg-card p-1.5 shadow-xs w-full">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  title={tab.description}
                  aria-label={`${tab.label}: ${tab.description}`}
                  className={`flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-2.5 sm:px-3 py-2 text-xs font-semibold transition-all ${
                    active
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Tab 1: Chủ đề & Phong cách */}
          {activeTab === "presets" && (
            <div className="space-y-6 rounded-3xl border border-border/80 bg-card p-5 shadow-xs sm:p-6">
              <header className="border-b border-border/80 pb-4">
                <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
                  <Palette className="size-5 text-primary" />
                  1. Mẫu trải nghiệm (Theme)
                </h2>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Chọn phong cách chủ đạo để thiết lập tông màu và hiệu ứng trực quan cho trang sự kiện.
                </p>
              </header>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {presets.map((item) => {
                  const selected = experiencePreset === item.key
                  return (
                    <label
                      key={item.key}
                      className={`relative flex min-w-0 cursor-pointer gap-3 rounded-2xl border p-3.5 transition-all focus-within:ring-3 focus-within:ring-focus/40 ${
                        selected
                          ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/20"
                          : "border-border/80 hover:border-primary/35 hover:bg-muted/30"
                      }`}
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
                      <span className={`mt-0.5 flex size-11 shrink-0 items-end justify-end rounded-xl p-1.5 ${item.sample}`}>
                        <span className={`size-3.5 rounded-full ${item.accent} ring-2 ring-white/80`} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5 text-sm font-semibold">
                          {item.label}
                          {selected ? <Check aria-hidden="true" className="size-4 text-primary ml-auto" /> : null}
                        </span>
                        <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{item.description}</span>
                        <span className="mt-1 block text-[11px] font-medium text-primary/80">{item.hint}</span>
                      </span>
                    </label>
                  )
                })}
              </div>

              <div className="border-t border-border/80 pt-5 space-y-4">
                <h3 className="text-sm font-semibold">Cấu hình Đồ họa & Hiệu ứng</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="grid gap-2 min-w-0">
                    <Label htmlFor="effect_intensity">Cường độ hiệu ứng chung</Label>
                    <select
                      id="effect_intensity"
                      value={intensity}
                      onChange={(event) => {
                        const next = event.target.value as EffectIntensity
                        setIntensity(next)
                        updateWelcomeEffects({ intensity: next })
                      }}
                      className="w-full min-h-11 rounded-xl border border-border/80 bg-background px-3 text-sm outline-hidden focus-visible:ring-3 focus-visible:ring-focus/40"
                    >
                      <option value="off">Tắt hoàn toàn</option>
                      <option value="low">Thấp (Nhẹ nhàng)</option>
                      <option value="medium">Trung bình</option>
                      <option value="high">Cao (Sống động)</option>
                    </select>
                  </div>
                  <div className="grid gap-2 min-w-0">
                    <Label htmlFor="effect_quality">Chất lượng đồ họa</Label>
                    <select
                      id="effect_quality"
                      value={quality}
                      onChange={(event) => setQuality(event.target.value as EffectQuality)}
                      className="w-full min-h-11 rounded-xl border border-border/80 bg-background px-3 text-sm outline-hidden focus-visible:ring-3 focus-visible:ring-focus/40"
                    >
                      <option value="auto">Tự động (Khuyên dùng)</option>
                      <option value="low">Thấp (Tối ưu thiết bị yếu)</option>
                      <option value="medium">Trung bình</option>
                      <option value="high">Cao (Hình ảnh sắc nét)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Trang Chào mừng (Welcome Hero) */}
          {activeTab === "welcome" && (
            <div className="space-y-6 rounded-3xl border border-border/80 bg-card p-5 shadow-xs sm:p-6">
              <header className="flex flex-col gap-3 border-b border-border/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="size-5 text-primary" />
                    2. Màn hình Chào mừng (Welcome Hero)
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Màn hình splash chào đón khách mời lần đầu truy cập trang sự kiện.
                  </p>
                </div>
                <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium transition-colors hover:bg-primary/10">
                  <input
                    type="checkbox"
                    checked={welcomeConfig.enabled}
                    onChange={(event) => updateWelcomeConfig({ enabled: event.target.checked })}
                    className="size-4 rounded border-border accent-primary"
                  />
                  Kích hoạt màn hình chào
                </label>
              </header>

              <div className={`space-y-5 ${!welcomeConfig.enabled ? "pointer-events-none opacity-50 grayscale transition-all" : "transition-all"}`}>
                <div className="grid gap-4 grid-cols-1">
                  <div className="grid gap-2 min-w-0">
                    <Label htmlFor="welcome_layout">Bố cục trang chào mừng</Label>
                    <select
                      id="welcome_layout"
                      value={welcomeConfig.layout}
                      onChange={(event) => updateWelcomeConfig({ layout: event.target.value as WelcomeHeroConfig["layout"] })}
                      className="w-full min-h-11 rounded-xl border border-border/80 bg-background px-3 text-sm outline-hidden focus-visible:ring-3 focus-visible:ring-focus/40"
                    >
                      <option value="poster-focus">Poster Focus (Tập trung Poster nghệ thuật)</option>
                      <option value="split">Cinematic Split (Chia đôi điện ảnh)</option>
                      <option value="full-bleed">Full Bleed (Tràn viền hiện đại)</option>
                      <option value="minimal">Minimal (Tối giản tinh tế)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="grid gap-2 min-w-0">
                      <Label htmlFor="welcome_primary_label">Nút kêu gọi chính (Primary CTA)</Label>
                      <input
                        id="welcome_primary_label"
                        value={welcomeConfig.primaryLabel}
                        onChange={(event) => updateWelcomeConfig({ primaryLabel: event.target.value })}
                        maxLength={80}
                        className="w-full min-h-11 rounded-xl border border-border/80 bg-background px-3 text-sm outline-hidden focus-visible:ring-3 focus-visible:ring-focus/40"
                      />
                    </div>
                    <div className="grid gap-2 min-w-0">
                      <Label htmlFor="welcome_secondary_label">Nút kêu gọi phụ (Secondary CTA)</Label>
                      <input
                        id="welcome_secondary_label"
                        value={welcomeConfig.secondaryLabel}
                        onChange={(event) => updateWelcomeConfig({ secondaryLabel: event.target.value })}
                        maxLength={80}
                        className="w-full min-h-11 rounded-xl border border-border/80 bg-background px-3 text-sm outline-hidden focus-visible:ring-3 focus-visible:ring-focus/40"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2 min-w-0">
                    <Label htmlFor="welcome_message">Lời chào mừng tùy chỉnh</Label>
                    <textarea
                      id="welcome_message"
                      value={welcomeConfig.message ?? ""}
                      onChange={(event) => updateWelcomeConfig({ message: event.target.value || null })}
                      maxLength={500}
                      rows={3}
                      className="w-full min-h-24 resize-y rounded-xl border border-border/80 bg-background px-3 py-2 text-sm leading-6 outline-hidden focus-visible:ring-3 focus-visible:ring-focus/40"
                      placeholder="Nhập lời chào riêng cho sự kiện. Để trống để tự động lấy mô tả sự kiện."
                    />
                  </div>
                </div>

                <div className="space-y-2 border-t border-border/80 pt-4">
                  <Label>Thẻ thông tin hiển thị trên màn hình chào</Label>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    {([
                      ["showDate", "Hiển thị ngày tổ chức"],
                      ["showLocation", "Hiển thị địa điểm"],
                      ["showHost", "Hiển thị người chủ trì"],
                    ] as const).map(([key, label]) => (
                      <label key={key} className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-border/70 bg-background px-3 text-sm hover:bg-muted/40 transition-colors">
                        <input
                          type="checkbox"
                          checked={welcomeConfig[key]}
                          onChange={(event) => updateWelcomeConfig({ [key]: event.target.checked })}
                          className="size-4 rounded border-border accent-primary"
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Poster & Ảnh bìa */}
          {activeTab === "poster" && (
            <div className="space-y-6 rounded-3xl border border-border/80 bg-card p-5 shadow-xs sm:p-6">
              <header className="border-b border-border/80 pb-4">
                <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
                  <ImageIcon className="size-5 text-primary" />
                  3. Ảnh bìa sự kiện & Poster
                </h2>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Tải lên ảnh bìa sắc nét từ Cloudinary và căn chỉnh các tùy chọn hiển thị.
                </p>
              </header>

              <div className="space-y-4">
                <CloudinaryCoverUpload
                  value={cover}
                  onChange={(value) => {
                    setCover(value)
                    setIsDirty(true)
                  }}
                />
                <div className="grid gap-2 min-w-0">
                  <Label htmlFor="cover_path" className="truncate">Hoặc dán đường dẫn ảnh bìa (URL Cloudinary)</Label>
                  <input
                    id="cover_path"
                    value={cover}
                    onChange={(event) => {
                      setCover(event.target.value)
                      setIsDirty(true)
                    }}
                    placeholder="https://res.cloudinary.com/..."
                    className="w-full min-w-0 min-h-11 rounded-xl border border-border/80 bg-background px-3 text-sm outline-hidden focus-visible:ring-3 focus-visible:ring-focus/40"
                  />
                  {cover && !coverIsCloudinary ? (
                    <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                      Đường dẫn chưa hợp lệ; vui lòng sử dụng URL hợp lệ từ Cloudinary.
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-4 border-t border-border/80 pt-5">
                <h3 className="text-sm font-semibold">Căn chỉnh & Hiệu ứng Poster</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="grid gap-2 min-w-0">
                    <Label htmlFor="welcome_poster_fit">Cách căn chỉnh poster</Label>
                    <select
                      id="welcome_poster_fit"
                      value={welcomeConfig.poster.fit}
                      onChange={(event) => updateWelcomePoster({ fit: event.target.value as WelcomeHeroConfig["poster"]["fit"] })}
                      className="w-full min-h-11 rounded-xl border border-border/80 bg-background px-3 text-sm outline-hidden focus-visible:ring-3 focus-visible:ring-focus/40"
                    >
                      <option value="contain">Giữ đủ toàn bộ poster (Contain)</option>
                      <option value="cover">Phủ kín khung (Cover)</option>
                    </select>
                  </div>
                  <div className="grid gap-2 min-w-0">
                    <Label htmlFor="welcome_poster_position">Vị trí trọng tâm poster</Label>
                    <select
                      id="welcome_poster_position"
                      value={welcomeConfig.poster.position}
                      onChange={(event) => updateWelcomePoster({ position: event.target.value as WelcomeHeroConfig["poster"]["position"] })}
                      className="w-full min-h-11 rounded-xl border border-border/80 bg-background px-3 text-sm outline-hidden focus-visible:ring-3 focus-visible:ring-focus/40"
                    >
                      <option value="center">Ở giữa (Center)</option>
                      <option value="top">Phía trên (Top)</option>
                      <option value="bottom">Phía dưới (Bottom)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  {([
                    ["border", "Viền mỏng nghệ thuật"],
                    ["shadow", "Đổ bóng mờ nổi bật"],
                    ["backgroundBlur", "Hình nền mờ mờ ảo"],
                  ] as const).map(([key, label]) => (
                    <label key={key} className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-border/70 bg-background px-3 text-sm hover:bg-muted/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={welcomeConfig.poster[key]}
                        onChange={(event) => updateWelcomePoster({ [key]: event.target.checked })}
                        className="size-4 rounded border-border accent-primary"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Bức tường & Mã QR */}
          {activeTab === "features" && (
            <div className="space-y-6 rounded-3xl border border-border/80 bg-card p-5 shadow-xs sm:p-6">
              <header className="border-b border-border/80 pb-4">
                <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
                  <Sliders className="size-5 text-primary" />
                  4. Cấu hình Bức tường thông điệp & Mã QR
                </h2>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Thiết lập cách hiển thị các lời chúc và trải nghiệm quét mã QR của khách tham dự.
                </p>
              </header>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="grid gap-2 min-w-0">
                  <Label htmlFor="wall_layout">Bố cục tường thông điệp</Label>
                  <select
                    id="wall_layout"
                    value={layout}
                    onChange={(event) => {
                      setLayout(event.target.value as WallLayout)
                      setIsDirty(true)
                    }}
                    className="w-full min-h-11 rounded-xl border border-border/80 bg-background px-3 text-sm outline-hidden focus-visible:ring-3 focus-visible:ring-focus/40"
                  >
                    <option value="spotlight">Spotlight (Tập trung lời chúc nổi bật)</option>
                    <option value="grid">Grid (Dạng lưới truyền thống)</option>
                    <option value="photo-focus">Photo Focus (Ưu tiên hiển thị hình ảnh)</option>
                  </select>
                </div>
                <div className="grid gap-2 min-w-0">
                  <Label htmlFor="animation_speed">Tốc độ cuộn thông điệp</Label>
                  <select
                    id="animation_speed"
                    value={animationSpeed}
                    onChange={(event) => {
                      setAnimationSpeed(event.target.value as AnimationSpeed)
                      setIsDirty(true)
                    }}
                    className="w-full min-h-11 rounded-xl border border-border/80 bg-background px-3 text-sm outline-hidden focus-visible:ring-3 focus-visible:ring-focus/40"
                  >
                    <option value="slow">Chậm rãi</option>
                    <option value="normal">Tiêu chuẩn</option>
                    <option value="fast">Nhanh</option>
                  </select>
                </div>
              </div>

              <div className="rounded-2xl border border-border/80 p-4 bg-muted/20 space-y-4">
                <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={qrVisible}
                    onChange={(event) => {
                      setQrVisible(event.target.checked)
                      setIsDirty(true)
                    }}
                    className="size-4 rounded border-border accent-primary"
                  />
                  Hiển thị mã QR trực tiếp trên giao diện
                </label>

                <div className={`grid gap-2 min-w-0 transition-opacity ${!qrVisible ? "opacity-50 pointer-events-none" : ""}`}>
                  <Label htmlFor="qr_cta">Khẩu hiệu kêu gọi quét mã (QR CTA)</Label>
                  <input
                    id="qr_cta"
                    value={qrCta}
                    onChange={(event) => {
                      setQrCta(event.target.value)
                      setIsDirty(true)
                    }}
                    maxLength={80}
                    className="w-full min-h-11 rounded-xl border border-border/80 bg-background px-3 text-sm outline-hidden focus-visible:ring-3 focus-visible:ring-focus/40"
                    placeholder="Ví dụ: Quét mã QR để gửi lời chúc ngay!"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Sticky Live Preview Studio Panel */}
        <div className={`xl:sticky xl:top-24 ${mobileView === "editor" ? "hidden xl:block" : "block"}`}>
          <section
            className="flex flex-col space-y-4 rounded-3xl border border-border/80 bg-card p-4 shadow-sm sm:p-5"
            aria-labelledby="theme-preview-heading"
          >
            {/* Preview Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3">
              <div>
                <h2 id="theme-preview-heading" className="text-sm font-bold flex items-center gap-1.5">
                  <Eye className="size-4 text-primary" />
                  Xem trước Trực tiếp
                </h2>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Phản hồi tức thì khi thay đổi cấu hình.</p>
              </div>

              {/* Viewport Switcher Controls */}
              <div className="flex flex-wrap items-center gap-1 rounded-xl border bg-muted/40 p-1">
                {([
                  ["desktop", Monitor, "Máy tính"],
                  ["tv", Tv, "TV 16:9"],
                  ["mobile", Smartphone, "Điện thoại"],
                ] as const).map(([value, Icon, label]) => (
                  <Button
                    key={value}
                    type="button"
                    size="sm"
                    variant={viewport === value ? "default" : "ghost"}
                    onClick={() => setViewport(value)}
                    className="h-7 px-2 text-xs"
                    aria-pressed={viewport === value}
                  >
                    <Icon className="size-3.5" />
                    <span className="hidden sm:inline">{label}</span>
                  </Button>
                ))}

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsFullscreenPreviewOpen(true)}
                  className="h-7 px-2 text-xs text-primary hover:bg-primary/10"
                  title="Mở xem trước toàn màn hình"
                >
                  <Maximize2 className="size-3.5" />
                  <span className="hidden sm:inline">Toàn màn hình</span>
                </Button>
              </div>
            </div>

            {/* Live Canvas Viewport Box */}
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-surface-sunken p-2 sm:p-3">
              <div
                className="mx-auto min-w-0 transition-[max-width] duration-300 ease-in-out"
                style={{ maxWidth: viewportWidths[viewport] }}
              >
                <WelcomeHeroPreview
                  eventTitle={eventTitle}
                  eventDescription={eventDescription}
                  eventDate={eventDate}
                  cover={cover}
                  coverIsCloudinary={coverIsCloudinary}
                  previewTheme={previewTheme}
                  experienceLabel={
                    experiencePreset === "minimal"
                      ? "Tối giản"
                      : experiencePreset === "elegant"
                      ? "Thanh lịch"
                      : experiencePreset === "romantic"
                      ? "Lãng mạn"
                      : experiencePreset === "celebration"
                      ? "Chúc mừng"
                      : experiencePreset === "graduation"
                      ? "Tốt nghiệp"
                      : "Ngân hà"
                  }
                  qualityLabel={quality === "auto" ? "Tự động" : quality === "low" ? "Thấp" : quality === "medium" ? "Trung bình" : "Cao"}
                  viewport={viewport}
                  qrVisible={qrVisible}
                  qrCta={qrCta}
                  reducedMotion={reducedMotionPreview}
                  config={welcomeConfig}
                />
              </div>
            </div>

            {/* Motion Preview Toggle Footer */}
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={reducedMotionPreview}
                  onChange={(event) => setReducedMotionPreview(event.target.checked)}
                  className="size-3.5 rounded border-border accent-primary"
                />
                Thử nghiệm chế độ Giảm hiệu ứng (Reduced Motion)
              </label>
            </div>
          </section>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
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

      {/* Fullscreen Modal Preview Overlay */}
      {isFullscreenPreviewOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md p-4 sm:p-8 overflow-y-auto">
          <div className="flex items-center justify-between border-b pb-4 mb-4">
            <div>
              <h2 className="text-lg font-bold">Xem trước Toàn màn hình</h2>
              <p className="text-xs text-muted-foreground">Mô phỏng trải nghiệm thực tế của khách mời công khai.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setIsFullscreenPreviewOpen(false)}
              className="rounded-full"
            >
              <X className="size-5" />
              <span className="sr-only">Đóng xem trước</span>
            </Button>
          </div>
          <div className="flex-1 max-w-5xl mx-auto w-full my-auto">
            <WelcomeHeroPreview
              eventTitle={eventTitle}
              eventDescription={eventDescription}
              eventDate={eventDate}
              cover={cover}
              coverIsCloudinary={coverIsCloudinary}
              previewTheme={previewTheme}
              experienceLabel={
                experiencePreset === "minimal"
                  ? "Tối giản"
                  : experiencePreset === "elegant"
                  ? "Thanh lịch"
                  : experiencePreset === "romantic"
                  ? "Lãng mạn"
                  : experiencePreset === "celebration"
                  ? "Chúc mừng"
                  : experiencePreset === "graduation"
                  ? "Tốt nghiệp"
                  : "Ngân hà"
              }
              qualityLabel={quality === "auto" ? "Tự động" : quality === "low" ? "Thấp" : quality === "medium" ? "Trung bình" : "Cao"}
              viewport="fullscreen"
              qrVisible={qrVisible}
              qrCta={qrCta}
              reducedMotion={reducedMotionPreview}
              config={welcomeConfig}
            />
          </div>
        </div>
      )}
    </form>
  )
}

// --- Hybrid Responsive Summary ---
// mobile  (default / sm): Segmented top bar switcher ("Cấu hình" vs "Xem trước"), full width inputs with touch targets >= 44px.
// tablet  (md / lg): Horizontal studio tabs bar, sticky header action bar with reset & submit button.
// desktop (xl / 2xl): Studio split workspace (45/55 grid), sticky live preview panel pinned to the right viewport top-24, full device viewport selector & fullscreen modal.
// Interaction: Live feedback state, auto-syncing form action inputs, responsive viewport container, focus ring accessibility.
