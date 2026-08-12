"use client"

import { CheckCircle2, ChevronLeft, LoaderCircle, Send, X } from "lucide-react"
import { useCallback, useRef, useState } from "react"
import { toast } from "sonner"

import { CelebrationConfetti } from "@/components/effects/celebration-confetti"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SubmitWishError, submitWish } from "@/features/wishes/client"

import { AiWishAssistant } from "./ai-assistant"
import { AudioRecorderField } from "./audio-recorder"
import {
  MAX_SENDER_NAME_LENGTH,
  validateSenderName,
  validateWishContent,
} from "./draft"
import { ImageUploadField } from "./image-upload"
import { TurnstileWidget } from "./TurnstileWidget"
import { useWishDraft } from "./useWishDraft"

type Props = {
  eventId: string
  eventTitle: string
  maxLength: number
  submissionMode: "open" | "approval_required" | "closed"
  turnstileSiteKey: string
  allowAi?: boolean
}

type ResultState =
  | { type: "approved" | "pending"; message: string }
  | null

function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <ol className="grid grid-cols-2 gap-2" aria-label="Tiến trình gửi lời chúc">
      {["Viết lời chúc", "Xác nhận & gửi"].map((label, index) => {
        const itemStep = (index + 1) as 1 | 2
        const active = itemStep === step
        const complete = itemStep < step
        return (
          <li
            key={label}
            aria-current={active ? "step" : undefined}
            className={
              "flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-sm " +
              (active
                ? "border-primary bg-primary/10 font-medium text-foreground"
                : complete
                  ? "border-status-success/30 bg-status-success/10 text-status-success"
                  : "bg-muted/30 text-muted-foreground")
            }
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold">
              {complete ? <CheckCircle2 aria-hidden="true" className="size-4" /> : itemStep}
            </span>
            <span>{label}</span>
          </li>
        )
      })}
    </ol>
  )
}

export function WishComposer({
  eventId,
  eventTitle,
  maxLength,
  submissionMode,
  turnstileSiteKey,
  allowAi,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const openButtonRef = useRef<HTMLButtonElement>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const inFlightRef = useRef(false)
  const {
    draft,
    hydrated,
    setContent,
    setSenderName,
    setMedia,
    setSenderAvatarPath,
    beginNewDraft,
  } = useWishDraft(eventId)
  const [step, setStep] = useState<1 | 2>(1)
  const [pending, setPending] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaResetKey, setCaptchaResetKey] = useState(0)
  const [contentError, setContentError] = useState<string | null>(null)
  const [senderError, setSenderError] = useState<string | null>(null)
  const [result, setResult] = useState<ResultState>(null)

  const handleCaptchaToken = useCallback((token: string | null) => {
    setCaptchaToken(token)
  }, [])

  if (submissionMode === "closed") {
    return (
      <p
        className="w-full rounded-lg border bg-muted px-4 py-3 text-center text-sm text-muted-foreground"
        data-testid="composer-closed"
        role="status"
      >
        Sự kiện này đã đóng nhận lời chúc.
      </p>
    )
  }

  const openDialog = () => {
    setResult(null)
    setSubmitError(null)
    setStep(1)
    dialogRef.current?.showModal()
    window.requestAnimationFrame(() => contentRef.current?.focus())
  }

  const closeDialog = () => {
    if (pending) return
    dialogRef.current?.close()
  }

  const restoreOpenButtonFocus = () => {
    openButtonRef.current?.focus()
  }

  const goToConfirmation = () => {
    const error = validateWishContent(draft.content, maxLength)
    setContentError(error)
    setSubmitError(null)
    if (!error) setStep(2)
  }

  const handleSubmit = async () => {
    if (inFlightRef.current) return

    const nextContentError = validateWishContent(draft.content, maxLength)
    const nextSenderError = validateSenderName(draft.senderName)
    setContentError(nextContentError)
    setSenderError(nextSenderError)
    setSubmitError(null)

    if (nextContentError || nextSenderError || !captchaToken || !draft.clientRequestId || !draft.deviceKey) {
      if (!captchaToken) {
        setSubmitError("Hãy hoàn tất CAPTCHA trước khi gửi.")
        toast.error("Hãy hoàn tất CAPTCHA trước khi gửi.")
      }
      return
    }

    inFlightRef.current = true
    setPending(true)
    setResult(null)

    try {
      const response = await submitWish({
        eventId,
        clientRequestId: draft.clientRequestId,
        senderName: draft.senderName.trim(),
        content: draft.content.trim(),
        captchaToken,
        deviceKey: draft.deviceKey,
        media: draft.media,
        senderAvatarPath: draft.senderAvatarPath,
      })
      setResult({ type: response.status, message: response.message })
      toast.success(response.message)
      beginNewDraft()
    } catch (caught: unknown) {
      const submitErrorValue =
        caught instanceof SubmitWishError
          ? caught
          : new SubmitWishError("Không thể gửi lời chúc lúc này.", {
              code: "UNKNOWN_ERROR",
              status: 0,
              retryable: true,
            })
      const message = submitErrorValue.retryAfterSeconds
        ? `${submitErrorValue.message} Có thể thử lại sau khoảng ${submitErrorValue.retryAfterSeconds} giây.`
        : `${submitErrorValue.message} Bản nháp vẫn được giữ để bạn thử lại.`
      setSubmitError(message)
      toast.error(submitErrorValue.message)
    } finally {
      setCaptchaToken(null)
      setCaptchaResetKey((value) => value + 1)
      setPending(false)
      inFlightRef.current = false
    }
  }

  const startAnotherWish = () => {
    setResult(null)
    setSubmitError(null)
    setStep(1)
    window.requestAnimationFrame(() => contentRef.current?.focus())
  }

  const counterInvalid = draft.content.length > maxLength
  const successfulResult = result?.type === "approved" || result?.type === "pending"

  return (
    <>
      <Button
        ref={openButtonRef}
        size="lg"
        onClick={openDialog}
        disabled={!hydrated}
        data-testid="open-composer"
        className="min-h-(--control-min-size)"
      >
        <Send aria-hidden="true" />
        Gửi lời chúc
      </Button>

      <dialog
        ref={dialogRef}
        className="m-0 min-h-dvh max-h-dvh w-full max-w-[68.75rem] rounded-none border-0 bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/50 sm:m-auto sm:min-h-0 sm:max-h-[85dvh] sm:w-[calc(100%-1rem)] sm:rounded-3xl sm:border relative"
        aria-labelledby="wish-composer-title"
        aria-describedby="wish-composer-description"
        onClose={restoreOpenButtonFocus}
        onCancel={(event) => {
          if (pending) event.preventDefault()
        }}
        data-testid="wish-composer-dialog"
      >
        <CelebrationConfetti active={successfulResult} />
        <div className="flex max-h-dvh flex-col sm:max-h-[85dvh]">
          <header className="space-y-4 border-b border-[var(--event-border)] bg-[var(--event-surface)] px-5 py-4 sm:px-7">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p id="wish-composer-description" className="text-xs text-muted-foreground">
                  Bước {step} / 2 · Nội dung được lưu nháp trên thiết bị này
                </p>
                <h2 id="wish-composer-title" className="mt-1 truncate text-xl font-semibold">
                  Gửi lời chúc đến {eventTitle}
                </h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={closeDialog}
                disabled={pending}
                aria-label="Đóng trình soạn lời chúc"
                className="min-h-(--control-min-size) min-w-(--control-min-size)"
              >
                <X aria-hidden="true" />
              </Button>
            </div>
            <StepIndicator step={step} />
          </header>

          <div className="min-h-0 overflow-x-hidden overflow-y-auto px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5 sm:px-7 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)] lg:gap-8 lg:px-8 lg:py-7">
            <div className="min-w-0">
            {pending ? (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary" role="status" aria-live="polite">
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                Đang gửi lời chúc, vui lòng chờ…
              </div>
            ) : null}

            {successfulResult ? (
              <div className="py-8 text-center" role="status" aria-live="polite">
                <CheckCircle2 aria-hidden="true" className="mx-auto size-12 text-status-success" />
                <h3 className="mt-4 text-xl font-semibold">
                  {result.type === "approved" ? "Lời chúc đã hiển thị" : "Lời chúc đang chờ duyệt"}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{result.message}</p>
                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
                  <Button type="button" variant="outline" onClick={closeDialog} className="min-h-(--control-min-size)">
                    Đóng
                  </Button>
                  <Button type="button" onClick={startAnotherWish} className="min-h-(--control-min-size)">
                    Gửi lời chúc khác
                  </Button>
                </div>
              </div>
            ) : step === 1 ? (
              <form onSubmit={(event) => { event.preventDefault(); goToConfirmation() }}>
                <div className="space-y-2">
                  <Label htmlFor="wish-content">Nội dung lời chúc</Label>
                  {allowAi ? (
                    <AiWishAssistant
                      eventId={eventId}
                      draftSenderName={draft.senderName}
                      onSuggestionSelect={(suggestion) => {
                        setContent(suggestion)
                        setContentError(null)
                        contentRef.current?.focus()
                      }}
                    />
                  ) : null}
                  <textarea
                    ref={contentRef}
                    id="wish-content"
                    name="content"
                    rows={7}
                    value={draft.content}
                    maxLength={maxLength + 1}
                    onChange={(event) => {
                      setContent(event.target.value)
                      setContentError(null)
                    }}
                    onKeyDown={(event) => {
                      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") event.currentTarget.form?.requestSubmit()
                    }}
                    aria-describedby="wish-content-help wish-content-counter"
                    aria-invalid={Boolean(contentError) || counterInvalid}
                    className="min-h-40 w-full resize-y rounded-2xl border border-input bg-background/60 px-3 py-2 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-focus/50 aria-invalid:border-destructive"
                    placeholder="Viết lời chúc chân thành của bạn…"
                    required
                  />
                  <div className="flex items-start justify-between gap-4 text-sm">
                    <p id="wish-content-help" className="text-muted-foreground">Bản nháp được lưu trên thiết bị này.</p>
                    <p id="wish-content-counter" className={counterInvalid ? "font-medium text-status-danger" : "text-muted-foreground"} aria-live="polite">
                      {draft.content.length}/{maxLength}
                    </p>
                  </div>
                  {contentError ? <p className="text-sm text-status-danger" role="alert">{contentError}</p> : null}
                </div>

                <fieldset className="mt-6 space-y-3">
                  <legend className="text-sm font-medium">Đính kèm ảnh hoặc ghi âm (tùy chọn)</legend>
                  {draft.media ? (
                    <div className="flex flex-col gap-3 rounded-lg border border-status-success/30 bg-status-success/10 p-3 sm:flex-row sm:items-center sm:justify-between" role="status">
                      <p className="text-sm text-status-success">Đã đính kèm {draft.media.type === "image" ? "hình ảnh" : "bản ghi âm"}.</p>
                      <Button type="button" variant="outline" onClick={() => setMedia(undefined)} disabled={pending} className="min-h-(--control-min-size)">
                        Xóa tệp đính kèm
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <ImageUploadField
                        eventId={eventId}
                        clientRequestId={draft.clientRequestId}
                        onUploadSuccess={(media) => setMedia(media)}
                        onRemove={() => setMedia(undefined)}
                        disabled={pending}
                      />
                      <div className="relative" aria-hidden="true">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Hoặc</span></div>
                      </div>
                      <AudioRecorderField
                        eventId={eventId}
                        clientRequestId={draft.clientRequestId}
                        onUploadSuccess={(media) => setMedia(media)}
                        onRemove={() => setMedia(undefined)}
                        disabled={pending}
                      />
                    </div>
                  )}
                </fieldset>

                <div className="mt-6 flex justify-end">
                  <Button type="submit" size="lg" className="min-h-(--control-min-size)">Tiếp tục</Button>
                </div>
              </form>
            ) : (
              <form onSubmit={(event) => { event.preventDefault(); void handleSubmit() }}>
                <div className="space-y-2">
                  <Label htmlFor="wish-sender-name">Tên hiển thị</Label>
                  <Input
                    id="wish-sender-name"
                    name="senderName"
                    className="min-h-(--control-min-size)"
                    value={draft.senderName}
                    maxLength={MAX_SENDER_NAME_LENGTH}
                    onChange={(event) => {
                      setSenderName(event.target.value)
                      setSenderError(null)
                    }}
                    aria-invalid={Boolean(senderError)}
                    aria-describedby={senderError ? "sender-name-error" : undefined}
                    required
                    autoFocus
                  />
                  {senderError ? <p id="sender-name-error" className="text-sm text-status-danger" role="alert">{senderError}</p> : null}
                </div>

                <fieldset className="mt-5 space-y-3">
                  <legend className="text-sm font-medium">Ảnh đại diện (tùy chọn)</legend>
                  {draft.senderAvatarPath ? (
                    <div className="flex flex-col gap-3 rounded-lg border border-status-success/30 bg-status-success/10 p-3 sm:flex-row sm:items-center sm:justify-between" role="status">
                      <p className="text-sm text-status-success">Đã tải ảnh đại diện.</p>
                      <Button type="button" variant="outline" onClick={() => setSenderAvatarPath(undefined)} disabled={pending} className="min-h-(--control-min-size)">
                        Xóa ảnh đại diện
                      </Button>
                    </div>
                  ) : (
                    <ImageUploadField
                      eventId={eventId}
                      clientRequestId={draft.clientRequestId}
                      onUploadSuccess={(media) => setSenderAvatarPath(media.path)}
                      onRemove={() => setSenderAvatarPath(undefined)}
                      isAvatar
                      disabled={pending}
                    />
                  )}
                </fieldset>

                <div className="mt-5 rounded-xl border bg-surface-sunken p-4" aria-label="Xem trước lời chúc">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Xem trước</p>
                  <textarea readOnly value={draft.content.trim()} aria-label="Xem trước bản nháp" rows={4} className="mt-2 w-full resize-none bg-transparent text-sm leading-6 outline-none" placeholder="Bản nháp của bạn đã sẵn sàng để gửi." />
                  <p className="mt-3 text-sm font-medium">— {draft.senderName.trim() || "Tên của bạn"}</p>
                </div>

                <div className="mt-5">
                  <TurnstileWidget
                    siteKey={turnstileSiteKey}
                    resetKey={captchaResetKey}
                    onTokenChange={handleCaptchaToken}
                  />
                </div>

                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={pending} className="min-h-(--control-min-size)">
                    <ChevronLeft aria-hidden="true" />
                    Quay lại
                  </Button>
                  <Button type="submit" size="lg" disabled={pending || !captchaToken} data-testid="submit-wish" className="min-h-(--control-min-size)">
                    {pending ? <><LoaderCircle aria-hidden="true" className="animate-spin" /> Đang gửi…</> : <><Send aria-hidden="true" /> Gửi lời chúc</>}
                  </Button>
                </div>
              </form>
            )}
            </div>

            <aside className="mt-8 hidden min-w-0 lg:mt-0 lg:block" aria-label="Xem trước lời chúc">
              <div className="sticky top-0 rounded-2xl border bg-surface-sunken p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Xem trước trực tiếp</p>
                <div className="mt-4 rounded-xl border bg-background p-5 shadow-sm">
                  <input readOnly value={draft.content.trim()} aria-label="Xem trước lời chúc trực tiếp" className="w-full bg-transparent text-base leading-7 outline-none" placeholder="Lời chúc của bạn sẽ xuất hiện ở đây khi bạn nhập." />
                  <p className="mt-5 text-sm font-medium">
                    - {draft.senderName.trim() || "Tên của bạn"}
                  </p>
                  {draft.media ? (
                    <p className="mt-4 rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary">
                      {draft.media.type === "image" ? "Đã đính kèm ảnh" : "Đã đính kèm âm thanh"}
                    </p>
                  ) : null}
                </div>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  Bản xem trước sẽ luôn hiển thị trên máy tính khi bạn soạn thảo.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </dialog>
    </>
  )
}