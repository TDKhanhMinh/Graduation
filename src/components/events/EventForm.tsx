"use client"

import { LoaderCircle } from "lucide-react"
import { useActionState, useEffect, useState } from "react"
import { useFormStatus } from "react-dom"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { EventActionState } from "@/features/events/actions"

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
    <Button type="submit" disabled={pending} className="min-h-(--control-min-size)">
      {pending ? (
        <>
          <LoaderCircle aria-hidden="true" className="animate-spin" />
          Đang xử lý…
        </>
      ) : (
        label
      )}
    </Button>
  )
}

function FormStatus({ isDirty }: { isDirty: boolean }) {
  const { pending } = useFormStatus()

  if (!pending && !isDirty) {
    return null
  }

  return (
    <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
      {pending ? "Đang lưu thay đổi…" : "Bạn có thay đổi chưa được lưu."}
    </p>
  )
}

function FieldError({ id, messages }: { id: string; messages?: string[] }) {
  if (!messages?.length) {
    return null
  }

  return (
    <p id={id} className="text-sm text-status-danger" role="alert">
      {messages[0]}
    </p>
  )
}

export function EventForm({
  action,
  initialData,
  submitLabel = "Lưu sự kiện",
}: EventFormProps) {
  const [isDirty, setIsDirty] = useState(false)
  const handleAction = async (prevState: EventActionState, formData: FormData) => {
    const nextState = await action(prevState, formData)
    if (nextState.message) {
      setIsDirty(false)
    }
    return nextState
  }
  const [state, formAction] = useActionState(handleAction, {})

  useEffect(() => {
    if (state.error) {
      toast.error(state.error)
    }
    if (state.message) {
      toast.success(state.message)
    }
  }, [state.error, state.message])

  return (
    <form
      action={formAction}
      onChange={() => setIsDirty(true)}
      data-dirty={isDirty ? "true" : "false"}
      className="max-w-2xl space-y-8"
    >
      {state.error && !state.fieldErrors ? (
        <p
          className="rounded-lg border border-status-danger/30 bg-status-danger/10 px-3 py-2 text-sm text-status-danger"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p
          className="rounded-lg border border-status-success/30 bg-status-success/10 px-3 py-2 text-sm text-status-success"
          role="status"
        >
          {state.message}
        </p>
      ) : null}

      <fieldset className="space-y-5">
        <legend className="text-base font-semibold">Thông tin cơ bản</legend>

        <div className="grid gap-2">
          <Label htmlFor="title">
            Tên sự kiện <span className="text-status-danger">*</span>
          </Label>
          <Input
            id="title"
            name="title"
            defaultValue={initialData?.title}
            placeholder="Ví dụ: Đám cưới Minh và Lan"
            required
            aria-invalid={Boolean(state.fieldErrors?.title)}
            aria-describedby={state.fieldErrors?.title ? "title-help title-error" : "title-help"}
          />
          <p id="title-help" className="text-xs leading-5 text-muted-foreground">
            Tên này sẽ xuất hiện trên trang sự kiện và trong dashboard của bạn.
          </p>
          <FieldError id="title-error" messages={state.fieldErrors?.title} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="slug">
            Đường dẫn (slug) <span className="text-status-danger">*</span>
          </Label>
          <div className="flex min-w-0">
            <span className="inline-flex min-h-9 items-center rounded-l-md border border-r-0 bg-muted px-3 text-sm text-muted-foreground">
              /
            </span>
            <Input
              id="slug"
              name="slug"
              className="min-w-0 rounded-l-none"
              defaultValue={initialData?.slug}
              placeholder="le-truong-thanh"
              required
              aria-invalid={Boolean(state.fieldErrors?.slug)}
              aria-describedby={state.fieldErrors?.slug ? "slug-help slug-error" : "slug-help"}
            />
          </div>
          <p id="slug-help" className="text-xs leading-5 text-muted-foreground">
            Chỉ gồm chữ thường không dấu, số và dấu gạch ngang (-).
          </p>
          <FieldError id="slug-error" messages={state.fieldErrors?.slug} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">Mô tả ngắn</Label>
          <Input
            id="description"
            name="description"
            defaultValue={initialData?.description}
            placeholder="Lời chào ngắn gửi đến khách mời"
            aria-invalid={Boolean(state.fieldErrors?.description)}
            aria-describedby={
              state.fieldErrors?.description ? "description-help description-error" : "description-help"
            }
          />
          <p id="description-help" className="text-xs leading-5 text-muted-foreground">
            Một câu ngắn giúp khách mời hiểu đây là trang sự kiện nào.
          </p>
          <FieldError id="description-error" messages={state.fieldErrors?.description} />
        </div>
      </fieldset>

      <fieldset className="space-y-5 border-t pt-6">
        <legend className="text-base font-semibold">Cấu hình sự kiện</legend>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="visibility">Chế độ hiển thị</Label>
            <Select name="visibility" defaultValue={initialData?.visibility || "unlisted"}>
              <SelectTrigger
                id="visibility"
                aria-invalid={Boolean(state.fieldErrors?.visibility)}
                aria-describedby={
                  state.fieldErrors?.visibility ? "visibility-help visibility-error" : "visibility-help"
                }
              >
                <SelectValue placeholder="Chọn chế độ hiển thị" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Riêng tư</SelectItem>
                <SelectItem value="unlisted">Không liệt kê, cần link</SelectItem>
                <SelectItem value="public">Công khai</SelectItem>
              </SelectContent>
            </Select>
            <p id="visibility-help" className="text-xs leading-5 text-muted-foreground">
              Quyết định ai có thể truy cập trang sự kiện.
            </p>
            <FieldError id="visibility-error" messages={state.fieldErrors?.visibility} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="submission_mode">Nhận lời chúc</Label>
            <Select name="submission_mode" defaultValue={initialData?.submission_mode || "open"}>
              <SelectTrigger
                id="submission_mode"
                aria-invalid={Boolean(state.fieldErrors?.submission_mode)}
                aria-describedby={
                  state.fieldErrors?.submission_mode
                    ? "submission-mode-help submission-mode-error"
                    : "submission-mode-help"
                }
              >
                <SelectValue placeholder="Chọn chế độ nhận lời chúc" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Mở, tự động đăng</SelectItem>
                <SelectItem value="approval_required">Cần duyệt trước</SelectItem>
                <SelectItem value="closed">Đóng nhận lời chúc</SelectItem>
              </SelectContent>
            </Select>
            <p id="submission-mode-help" className="text-xs leading-5 text-muted-foreground">
              Chọn cách lời chúc được tiếp nhận và hiển thị trên trang.
            </p>
            <FieldError
              id="submission-mode-error"
              messages={state.fieldErrors?.submission_mode}
            />
          </div>
        </div>
      </fieldset>

      <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-end">
        <FormStatus isDirty={isDirty} />
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  )
}