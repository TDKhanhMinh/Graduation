"use client"

import { useActionState, useEffect } from "react"
import { EventActionState } from "@/features/events/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFormStatus } from "react-dom"
import { toast } from "sonner"

interface EventFormProps {
  action: (state: EventActionState, payload: FormData) => Promise<EventActionState>
  initialData?: {
    title?: string
    slug?: string
    description?: string
    visibility?: string
    submission_mode?: string
  }
  submitLabel?: string
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Đang xử lý..." : label}
    </Button>
  )
}

export function EventForm({ action, initialData, submitLabel = "Lưu sự kiện" }: EventFormProps) {
  const [state, formAction] = useActionState(action, {})

  useEffect(() => {
    if (state.error) {
      toast.error(state.error)
    }
    if (state.message) {
      toast.success(state.message)
    }
  }, [state])

  return (
    <form action={formAction} className="space-y-6 max-w-2xl">

      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="title">Tên sự kiện <span className="text-destructive">*</span></Label>
          <Input 
            id="title" 
            name="title" 
            defaultValue={initialData?.title} 
            placeholder="VD: Đám cưới Minh & Lan" 
            required
            aria-invalid={!!state.fieldErrors?.title}
          />
          {state.fieldErrors?.title && (
            <p className="text-sm text-destructive">{state.fieldErrors.title[0]}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="slug">Đường dẫn (slug) <span className="text-destructive">*</span></Label>
          <div className="flex items-center">
            <span className="bg-muted px-3 py-2 text-sm border border-r-0 rounded-l-md text-muted-foreground whitespace-nowrap">
              /
            </span>
            <Input 
              id="slug" 
              name="slug" 
              className="rounded-l-none"
              defaultValue={initialData?.slug} 
              placeholder="le-truong-thanh" 
              required
              aria-invalid={!!state.fieldErrors?.slug}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Chỉ gồm chữ thường không dấu, số và dấu gạch ngang (-).
          </p>
          {state.fieldErrors?.slug && (
            <p className="text-sm text-destructive">{state.fieldErrors.slug[0]}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">Mô tả ngắn</Label>
          <Input 
            id="description" 
            name="description" 
            defaultValue={initialData?.description} 
            placeholder="Lời chào ngắn gửi đến khách mời" 
          />
          {state.fieldErrors?.description && (
            <p className="text-sm text-destructive">{state.fieldErrors.description[0]}</p>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="visibility">Chế độ hiển thị</Label>
            <Select name="visibility" defaultValue={initialData?.visibility || "unlisted"}>
              <SelectTrigger id="visibility">
                <SelectValue placeholder="Chọn chế độ hiển thị" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private (Chỉ bạn thấy)</SelectItem>
                <SelectItem value="unlisted">Unlisted (Cần link)</SelectItem>
                <SelectItem value="public">Public (Tìm kiếm được)</SelectItem>
              </SelectContent>
            </Select>
            {state.fieldErrors?.visibility && (
              <p className="text-sm text-destructive">{state.fieldErrors.visibility[0]}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="submission_mode">Nhận lời chúc</Label>
            <Select name="submission_mode" defaultValue={initialData?.submission_mode || "open"}>
              <SelectTrigger id="submission_mode">
                <SelectValue placeholder="Chọn chế độ nhận lời chúc" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Mở (Tự động đăng)</SelectItem>
                <SelectItem value="approval_required">Cần duyệt (Kiểm duyệt trước)</SelectItem>
                <SelectItem value="closed">Đóng (Ngừng nhận)</SelectItem>
              </SelectContent>
            </Select>
            {state.fieldErrors?.submission_mode && (
              <p className="text-sm text-destructive">{state.fieldErrors.submission_mode[0]}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  )
}
