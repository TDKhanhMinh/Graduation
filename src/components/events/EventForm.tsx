"use client"

import { ImageIcon, LoaderCircle } from "lucide-react"
import { useActionState, useEffect, useState } from "react"
import { useFormStatus } from "react-dom"
import { toast } from "sonner"

import { CloudinaryCoverUpload } from "@/components/events/cloudinary-cover-upload"
import { formatDateTimeLocal } from "@/features/events/schedule"
import { POSTER_DRAFT_HANDOFF_KEY, parsePosterDraft } from "@/features/posters/handoff"
import type { WelcomeHeroConfig } from "@/features/events/welcome-config"
import { getDefaultWelcomeHeroConfig } from "@/features/events/welcome-config"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { EventActionState } from "@/features/events/actions"

interface EventFormProps {
  action: (state: EventActionState, payload: FormData) => Promise<EventActionState>
  initialData?: {
    title?: string
    slug?: string
    description?: string
    event_date?: string | null
    starts_at?: string | null
    ends_at?: string | null
    timezone?: string | null
    location_name?: string | null
    location_address?: string | null
    host_name?: string | null
    host_title?: string | null
    visibility?: string
    submission_mode?: string
  }
  submitLabel?: string
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending} className="min-h-(--control-min-size) w-full sm:w-auto" variant="event" data-tour-target="event-submit">
      {pending ? <><LoaderCircle aria-hidden="true" className="animate-spin" />Đang xử lý…</> : label}
    </Button>
  )
}

function FormStatus({ isDirty }: { isDirty: boolean }) {
  const { pending } = useFormStatus()
  if (!pending && !isDirty) return null

  return <p className="text-sm text-muted-foreground" role="status" aria-live="polite">{pending ? "Đang lưu thay đổi…" : "Bạn có thay đổi chưa được lưu."}</p>
}

function FieldError({ id, messages }: { id: string; messages?: string[] }) {
  if (!messages?.length) return null
  return <p id={id} className="text-sm text-status-danger" role="alert">{messages[0]}</p>
}

export function EventForm({ action, initialData, submitLabel = "Lưu sự kiện" }: EventFormProps) {
  const [isDirty, setIsDirty] = useState(false)
  const [cover, setCover] = useState<string>("")
  const [welcomeConfig, setWelcomeConfig] = useState<WelcomeHeroConfig>(getDefaultWelcomeHeroConfig())
  
  const updateWelcomePoster = (updates: Partial<WelcomeHeroConfig["poster"]>) => {
    setWelcomeConfig((prev) => ({
      ...prev,
      poster: { ...prev.poster, ...updates },
    }))
    setIsDirty(true)
  }

  useEffect(() => {
    if (initialData?.title) return
    try {
      const raw = window.localStorage.getItem(POSTER_DRAFT_HANDOFF_KEY)
      const draft = parsePosterDraft(raw)
      const titleInput = document.getElementById('title')
      if (draft && titleInput instanceof HTMLInputElement && !titleInput.value) {
        titleInput.value = draft.title
        titleInput.dispatchEvent(new Event('input', { bubbles: true }))
      }
      window.localStorage.removeItem(POSTER_DRAFT_HANDOFF_KEY)
    } catch {
      // Ignore unavailable or malformed browser storage.
    }
  }, [initialData?.title])

  const [state, formAction] = useActionState(async (prevState: EventActionState, formData: FormData) => {
    const nextState = await action(prevState, formData)
    if (nextState.message) setIsDirty(false)
    return nextState
  }, {})

  useEffect(() => {
    if (state.error) toast.error(state.error)
    if (state.message) toast.success(state.message)
  }, [state.error, state.message])

  return (
    <form
      action={formAction}
      onChange={() => setIsDirty(true)}
      data-dirty={isDirty ? "true" : "false"}
      aria-labelledby="event-form-heading"
      className="max-w-3xl space-y-8"
    >
      <div className="space-y-4 rounded-2xl border border-primary/15 bg-primary/5 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p id="event-form-heading" className="text-sm font-semibold">Thiết lập không gian</p>
            <p className="mt-1 text-xs text-muted-foreground">Bước 1/2 · Thông tin nền tảng</p>
          </div>
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">Bắt đầu</span>
        </div>
        <div className="flex gap-2" aria-label="Tiến độ tạo sự kiện">
          <span className="h-1.5 flex-1 rounded-full bg-primary" />
          <span className="h-1.5 flex-1 rounded-full bg-primary/15" />
        </div>
      </div>


      <fieldset className="space-y-5">
        <legend className="text-base font-semibold">Thông tin cơ bản</legend>
        <div className="grid gap-2" data-tour-target="event-title">
          <Label htmlFor="title">Tên sự kiện <span className="text-status-danger">*</span></Label>
          <Input id="title" name="title" defaultValue={initialData?.title} placeholder="Ví dụ: Kỷ niệm 10 năm ra trường" required className="h-11 rounded-xl border-border/80 bg-background/70" aria-invalid={Boolean(state.fieldErrors?.title)} aria-describedby={state.fieldErrors?.title ? "title-help title-error" : "title-help"} />
          <p id="title-help" className="text-xs leading-5 text-muted-foreground">Tên này sẽ xuất hiện trên trang sự kiện và trong dashboard của bạn.</p>
          <FieldError id="title-error" messages={state.fieldErrors?.title} />
        </div>
        <div className="grid gap-2" data-tour-target="event-slug">
          <Label htmlFor="slug">Đường dẫn (slug) <span className="text-status-danger">*</span></Label>
          <div className="flex min-w-0">
            <span className="inline-flex min-h-11 items-center rounded-l-xl border border-r-0 bg-muted px-3 text-sm text-muted-foreground">/</span>
            <Input id="slug" name="slug" className="h-11 min-w-0 rounded-r-xl rounded-l-none border-border/80 bg-background/70" defaultValue={initialData?.slug} placeholder="le-truong-thanh" required aria-invalid={Boolean(state.fieldErrors?.slug)} aria-describedby={state.fieldErrors?.slug ? "slug-help slug-error" : "slug-help"} />
          </div>
          <p id="slug-help" className="text-xs leading-5 text-muted-foreground">Chỉ gồm chữ thường không dấu, số và dấu gạch ngang (-).</p>
          <FieldError id="slug-error" messages={state.fieldErrors?.slug} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description">Mô tả ngắn</Label>
          <Input id="description" name="description" defaultValue={initialData?.description} placeholder="Lời chào ngắn gửi đến khách mời" className="h-11 rounded-xl border-border/80 bg-background/70" aria-invalid={Boolean(state.fieldErrors?.description)} aria-describedby={state.fieldErrors?.description ? "description-help description-error" : "description-help"} />
          <p id="description-help" className="text-xs leading-5 text-muted-foreground">Một câu ngắn giúp khách mời hiểu đây là trang sự kiện nào.</p>
          <FieldError id="description-error" messages={state.fieldErrors?.description} />
        </div>
      </fieldset>

      <fieldset className="space-y-5 border-t pt-6">
        <legend className="text-base font-semibold">Cấu hình sự kiện</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2" data-tour-target="event-visibility">
            <Label htmlFor="visibility">Chế độ hiển thị</Label>
            <Select key={`visibility-${initialData?.visibility || "unlisted"}`} name="visibility" defaultValue={initialData?.visibility || "unlisted"}>
              <SelectTrigger id="visibility" className="h-11 w-full rounded-xl border-border/80 bg-background/70" aria-invalid={Boolean(state.fieldErrors?.visibility)} aria-describedby={state.fieldErrors?.visibility ? "visibility-help visibility-error" : "visibility-help"}><SelectValue placeholder="Chọn chế độ hiển thị" /></SelectTrigger>
              <SelectContent><SelectItem value="private">Riêng tư</SelectItem><SelectItem value="unlisted">Không liệt kê, cần link</SelectItem><SelectItem value="public">Công khai</SelectItem></SelectContent>
            </Select>
            <p id="visibility-help" className="text-xs leading-5 text-muted-foreground">Quyết định ai có thể truy cập trang sự kiện.</p>
            <FieldError id="visibility-error" messages={state.fieldErrors?.visibility} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="submission_mode">Nhận lời chúc</Label>
            <Select key={`submission_mode-${initialData?.submission_mode || "open"}`} name="submission_mode" defaultValue={initialData?.submission_mode || "open"}>
              <SelectTrigger id="submission_mode" className="h-11 w-full rounded-xl border-border/80 bg-background/70" aria-invalid={Boolean(state.fieldErrors?.submission_mode)} aria-describedby={state.fieldErrors?.submission_mode ? "submission-mode-help submission-mode-error" : "submission-mode-help"}><SelectValue placeholder="Chọn chế độ nhận lời chúc" /></SelectTrigger>
              <SelectContent><SelectItem value="open">Mở, tự động đăng</SelectItem><SelectItem value="approval_required">Cần duyệt trước</SelectItem><SelectItem value="closed">Đóng nhận lời chúc</SelectItem></SelectContent>
            </Select>
            <p id="submission-mode-help" className="text-xs leading-5 text-muted-foreground">Chọn cách lời chúc được tiếp nhận và hiển thị trên trang.</p>
            <FieldError id="submission-mode-error" messages={state.fieldErrors?.submission_mode} />
          </div>
        </div>
      </fieldset>

      <fieldset className='space-y-5 border-t pt-6'>
        <legend className='text-base font-semibold'>Lịch, địa điểm và host</legend>
        <p className='text-sm text-muted-foreground'>
          Lưu thời điểm theo múi giờ đã chọn; các mục để trống là tùy chọn.
        </p>
        <div className='grid gap-5 sm:grid-cols-2'>
          <div className='grid gap-2'>
            <Label htmlFor='starts_at'>Bắt đầu</Label>
            <Input
              id='starts_at'
              name='starts_at'
              type='datetime-local'
              defaultValue={formatDateTimeLocal(initialData?.starts_at ?? initialData?.event_date, initialData?.timezone ?? 'UTC')}
              className='h-11 rounded-xl border-border/80 bg-background/70'
              aria-describedby='schedule-help'
            />
            <FieldError id='starts_at-error' messages={state.fieldErrors?.starts_at} />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='ends_at'>Kết thúc (tùy chọn)</Label>
            <Input
              id='ends_at'
              name='ends_at'
              type='datetime-local'
              defaultValue={formatDateTimeLocal(initialData?.ends_at, initialData?.timezone ?? 'UTC')}
              className='h-11 rounded-xl border-border/80 bg-background/70'
            />
            <FieldError id='ends_at-error' messages={state.fieldErrors?.ends_at} />
          </div>
          <div className='grid gap-2 sm:col-span-2'>
            <Label htmlFor='timezone'>Múi giờ</Label>
            <select
              id='timezone'
              name='timezone'
              defaultValue={initialData?.timezone ?? 'UTC'}
              className='min-h-11 w-full rounded-xl border border-border/80 bg-background/70 px-3 text-sm outline-hidden focus-visible:ring-3 focus-visible:ring-focus/40'
            >
              <option value='UTC'>UTC</option>
              <option value='Asia/Ho_Chi_Minh'>Asia/Ho_Chi_Minh (Việt Nam)</option>
              <option value='Asia/Tokyo'>Asia/Tokyo</option>
              <option value='Europe/London'>Europe/London</option>
              <option value='Europe/Paris'>Europe/Paris</option>
              <option value='America/New_York'>America/New_York</option>
              <option value='America/Los_Angeles'>America/Los_Angeles</option>
            </select>
            <p id='schedule-help' className='text-xs leading-5 text-muted-foreground'>
              Thời gian sẽ được đổi sang UTC khi lưu và hiển thị lại theo múi giờ này.
            </p>
            <FieldError id='timezone-error' messages={state.fieldErrors?.timezone} />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='location_name'>Địa điểm</Label>
            <Input id='location_name' name='location_name' defaultValue={initialData?.location_name ?? ''} maxLength={160} className='h-11 rounded-xl border-border/80 bg-background/70' />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='location_address'>Địa chỉ (tùy chọn)</Label>
            <Input id='location_address' name='location_address' defaultValue={initialData?.location_address ?? ''} maxLength={500} className='h-11 rounded-xl border-border/80 bg-background/70' />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='host_name'>Host</Label>
            <Input id='host_name' name='host_name' defaultValue={initialData?.host_name ?? ''} maxLength={160} className='h-11 rounded-xl border-border/80 bg-background/70' />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='host_title'>Vai trò host (tùy chọn)</Label>
            <Input id='host_title' name='host_title' defaultValue={initialData?.host_title ?? ''} maxLength={160} className='h-11 rounded-xl border-border/80 bg-background/70' />
          </div>
        </div>
        <label className='flex items-start gap-3 rounded-xl border border-status-warning/30 bg-status-warning/5 p-3 text-sm'>
          <input type='checkbox' name='clear_schedule' value='true' className='mt-1 size-4 accent-primary' />
          <span>
            <span className='font-medium'>Xóa toàn bộ thông tin lịch</span>
            <span className='mt-1 block text-xs text-muted-foreground'>Chỉ chọn khi muốn xóa rõ ràng ngày, địa điểm và host.</span>
          </span>
        </label>
      </fieldset>

      <fieldset className="space-y-5 border-t pt-6" data-tour-target="event-cover-poster">
        <legend className="text-base font-semibold flex items-center gap-2">
          <ImageIcon className="size-5 text-primary" />
          Ảnh bìa sự kiện & Poster (Tuỳ chọn)
        </legend>
        <p className="text-sm text-muted-foreground">Tải lên ảnh bìa sắc nét từ Cloudinary và căn chỉnh các tùy chọn hiển thị.</p>
        
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
              name="cover_path"
              value={cover}
              onChange={(event) => {
                setCover(event.target.value)
                setIsDirty(true)
              }}
              placeholder="https://res.cloudinary.com/..."
              className="w-full min-w-0 min-h-11 rounded-xl border border-border/80 bg-background/70 px-3 text-sm outline-hidden focus-visible:ring-3 focus-visible:ring-focus/40"
            />
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <h3 className="text-sm font-semibold">Căn chỉnh & Hiệu ứng Poster</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="grid gap-2 min-w-0">
              <Label htmlFor="welcome_poster_aspect">Tỉ lệ khung hình</Label>
              <select
                id="welcome_poster_aspect"
                value={welcomeConfig.poster.aspectRatio}
                onChange={(event) => updateWelcomePoster({ aspectRatio: event.target.value as WelcomeHeroConfig["poster"]["aspectRatio"] })}
                className="w-full min-h-11 rounded-xl border border-border/80 bg-background/70 px-3 text-sm outline-hidden focus-visible:ring-3 focus-visible:ring-focus/40"
              >
                <option value="portrait">Dọc (3:4) - Poster</option>
                <option value="square">Vuông (1:1)</option>
                <option value="landscape">Ngang (16:9)</option>
                <option value="auto">Tự do (Tùy ảnh)</option>
              </select>
            </div>
            <div className="grid gap-2 min-w-0">
              <Label htmlFor="welcome_poster_fit">Cách hiển thị</Label>
              <select
                id="welcome_poster_fit"
                value={welcomeConfig.poster.fit}
                onChange={(event) => updateWelcomePoster({ fit: event.target.value as WelcomeHeroConfig["poster"]["fit"] })}
                className="w-full min-h-11 rounded-xl border border-border/80 bg-background/70 px-3 text-sm outline-hidden focus-visible:ring-3 focus-visible:ring-focus/40"
              >
                <option value="contain">Giữ đủ toàn ảnh</option>
                <option value="cover">Phủ kín (Cover)</option>
              </select>
            </div>
            <div className="grid gap-2 min-w-0">
              <Label htmlFor="welcome_poster_position">Trọng tâm ảnh</Label>
              <select
                id="welcome_poster_position"
                value={welcomeConfig.poster.position}
                onChange={(event) => updateWelcomePoster({ position: event.target.value as WelcomeHeroConfig["poster"]["position"] })}
                className="w-full min-h-11 rounded-xl border border-border/80 bg-background/70 px-3 text-sm outline-hidden focus-visible:ring-3 focus-visible:ring-focus/40"
              >
                <option value="center">Giữa (Trung tâm)</option>
                <option value="top">Trên (Ưu tiên khuôn mặt)</option>
                <option value="bottom">Dưới</option>
              </select>
            </div>
          </div>
        </div>
      </fieldset>

      <input type="hidden" name="welcome_hero" value={JSON.stringify(welcomeConfig)} />

      <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-end">
        <FormStatus isDirty={isDirty} />
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  )
}
