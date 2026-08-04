"use client"

import { useCallback, useRef, useState } from "react"
import { CheckCircle2, ChevronLeft, Loader2, Send, X } from "lucide-react"

import { submitWish, SubmitWishError } from "@/features/wishes/client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  MAX_SENDER_NAME_LENGTH,
  validateSenderName,
  validateWishContent,
} from "./draft"
import { TurnstileWidget } from "./TurnstileWidget"
import { useWishDraft } from "./useWishDraft"
import { ImageUploadField } from "./image-upload"
import { AudioRecorderField } from "./audio-recorder"
import { AiWishAssistant } from "./ai-assistant"

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
  | { type: "error"; message: string; retryAfterSeconds?: number }
  | null

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
  const { draft, hydrated, setContent, setSenderName, setMedia, setSenderAvatarPath, beginNewDraft } =
    useWishDraft(eventId)

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
        className="rounded-lg border bg-muted px-4 py-3 text-center text-sm text-muted-foreground"
        data-testid="composer-closed"
      >
        Sự kiện này đã đóng nhận lời chúc.
      </p>
    )
  }

  const openDialog = () => {
    setResult(null)
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
    if (!error) setStep(2)
  }

  const handleSubmit = async () => {
    if (inFlightRef.current) return

    const nextContentError = validateWishContent(draft.content, maxLength)
    const nextSenderError = validateSenderName(draft.senderName)
    setContentError(nextContentError)
    setSenderError(nextSenderError)

    if (
      nextContentError ||
      nextSenderError ||
      !captchaToken ||
      !draft.clientRequestId ||
      !draft.deviceKey
    ) {
      if (!captchaToken) {
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
      beginNewDraft()
    } catch (error) {
      const submitError =
        error instanceof SubmitWishError
          ? error
          : new SubmitWishError("Không thể gửi lời chúc lúc này.", {
              code: "UNKNOWN_ERROR",
              status: 0,
              retryable: true,
            })
      toast.error(submitError.message, {
        description: submitError.retryAfterSeconds 
          ? `Có thể thử lại sau khoảng ${submitError.retryAfterSeconds} giây.` 
          : undefined
      })
    } finally {
      setCaptchaToken(null)
      setCaptchaResetKey((value) => value + 1)
      setPending(false)
      inFlightRef.current = false
    }
  }

  const startAnotherWish = () => {
    setResult(null)
    setStep(1)
    window.requestAnimationFrame(() => contentRef.current?.focus())
  }

  const counterInvalid = draft.content.length > maxLength
  const successfulResult =
    result?.type === "approved" || result?.type === "pending"

  return (
    <>
      <Button
        ref={openButtonRef}
        size="lg"
        onClick={openDialog}
        disabled={!hydrated}
        data-testid="open-composer"
      >
        <Send />
        Gửi lời chúc
      </Button>

      <dialog
        ref={dialogRef}
        className="m-auto max-h-[95dvh] w-[calc(100%-1rem)] max-w-xl rounded-2xl border bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/50 sm:w-full"
        aria-labelledby="wish-composer-title"
        onClose={restoreOpenButtonFocus}
        onCancel={(event) => {
          if (pending) event.preventDefault()
        }}
        data-testid="wish-composer-dialog"
      >
        <div className="flex max-h-[95dvh] flex-col">
          <header className="flex items-start justify-between gap-4 border-b px-5 py-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Bước {step} / 2
              </p>
              <h2 id="wish-composer-title" className="mt-1 text-xl font-semibold">
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
            >
              <X />
            </Button>
          </header>

          <div className="overflow-y-auto px-5 py-5">
            {successfulResult ? (
              <div className="py-8 text-center" aria-live="polite">
                <CheckCircle2 className="mx-auto size-12 text-green-600" />
                <h3 className="mt-4 text-xl font-semibold">
                  {result.type === "approved"
                    ? "Lời chúc đã hiển thị"
                    : "Lời chúc đang chờ duyệt"}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {result.message}
                </p>
                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    Đóng
                  </Button>
                  <Button type="button" onClick={startAnotherWish}>
                    Gửi lời chúc khác
                  </Button>
                </div>
              </div>
            ) : step === 1 ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  goToConfirmation()
                }}
              >
                <Label htmlFor="wish-content" className="mb-2 block">Nội dung lời chúc</Label>
                {allowAi && (
                  <AiWishAssistant 
                    eventId={eventId}
                    draftSenderName={draft.senderName}
                    onSuggestionSelect={(suggestion) => {
                      setContent(suggestion)
                      setContentError(null)
                      contentRef.current?.focus()
                    }}
                  />
                )}
                <textarea
                  ref={contentRef}
                  id="wish-content"
                  name="content"
                  rows={8}
                  value={draft.content}
                  maxLength={maxLength + 1}
                  onChange={(event) => {
                    setContent(event.target.value)
                    setContentError(null)
                  }}
                  onKeyDown={(event) => {
                    if (
                      (event.ctrlKey || event.metaKey) &&
                      event.key === "Enter"
                    ) {
                      event.currentTarget.form?.requestSubmit()
                    }
                  }}
                  aria-describedby="wish-content-help wish-content-counter"
                  aria-invalid={Boolean(contentError) || counterInvalid}
                  className="mt-2 min-h-40 w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20"
                  placeholder="Viết lời chúc chân thành của bạn..."
                  required
                />
                <div className="mt-2 flex items-start justify-between gap-4 text-sm">
                  <p id="wish-content-help" className="text-muted-foreground">
                    Bản nháp được lưu trên thiết bị này.
                  </p>
                  <p
                    id="wish-content-counter"
                    className={
                      counterInvalid ? "font-medium text-destructive" : "text-muted-foreground"
                    }
                    aria-live="polite"
                  >
                    {draft.content.length}/{maxLength}
                  </p>
                </div>
                {contentError ? (
                  <p className="mt-2 text-sm text-destructive" role="alert">
                    {contentError}
                  </p>
                ) : null}
                <div className="mt-4">
                  <Label className="mb-2 block">Đính kèm ảnh hoặc ghi âm (Tùy chọn)</Label>
                  <div className="flex flex-col gap-4">
                    {!draft.media && (
                      <ImageUploadField
                        eventId={eventId}
                        clientRequestId={draft.clientRequestId}
                        onUploadSuccess={(media) => setMedia(media)}
                        onRemove={() => setMedia(undefined)}
                      />
                    )}
                    {!draft.media && (
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">Hoặc</span>
                        </div>
                      </div>
                    )}
                    {(!draft.media || draft.media.type === "audio") && (
                      <AudioRecorderField
                        eventId={eventId}
                        clientRequestId={draft.clientRequestId}
                        onUploadSuccess={(media) => setMedia(media)}
                        onRemove={() => setMedia(undefined)}
                      />
                    )}
                  </div>
                  {draft.media && (
                    <p className="mt-2 text-xs font-medium text-green-600">Đã đính kèm file thành công.</p>
                  )}
                </div>
                <div className="mt-6 flex justify-end">
                  <Button type="submit" size="lg">
                    Tiếp tục
                  </Button>
                </div>
              </form>
            ) : (
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  void handleSubmit()
                }}
              >
                <div>
                  <Label htmlFor="wish-sender-name">Tên hiển thị</Label>
                  <Input
                    id="wish-sender-name"
                    name="senderName"
                    className="mt-2 h-10"
                    value={draft.senderName}
                    maxLength={MAX_SENDER_NAME_LENGTH}
                    onChange={(event) => {
                      setSenderName(event.target.value)
                      setSenderError(null)
                    }}
                    aria-invalid={Boolean(senderError)}
                    required
                    autoFocus
                  />
                  {senderError ? (
                    <p className="mt-2 text-sm text-destructive" role="alert">
                      {senderError}
                    </p>
                  ) : null}
                </div>

                <div className="mt-4">
                  <Label className="mb-2 block">Ảnh đại diện (Tùy chọn)</Label>
                  <ImageUploadField
                    eventId={eventId}
                    clientRequestId={draft.clientRequestId}
                    onUploadSuccess={(media) => setSenderAvatarPath(media.path)}
                    onRemove={() => setSenderAvatarPath(undefined)}
                    isAvatar
                  />
                  {draft.senderAvatarPath && (
                    <p className="mt-1 text-xs text-green-600">Đã tải ảnh đại diện thành công.</p>
                  )}
                </div>

                <div className="mt-5 rounded-xl border bg-muted/40 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Xem trước
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm">
                    {draft.content.trim()}
                  </p>
                  <p className="mt-3 text-sm font-medium">
                    — {draft.senderName.trim() || "Tên của bạn"}
                  </p>
                </div>

                <div className="mt-5">
                  <TurnstileWidget
                    siteKey={turnstileSiteKey}
                    resetKey={captchaResetKey}
                    onTokenChange={handleCaptchaToken}
                  />
                </div>

                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    disabled={pending}
                  >
                    <ChevronLeft />
                    Quay lại
                  </Button>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={pending || !captchaToken}
                    data-testid="submit-wish"
                  >
                    {pending ? (
                      <>
                        <Loader2 className="animate-spin" />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <Send />
                        Gửi lời chúc
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </dialog>
    </>
  )
}
