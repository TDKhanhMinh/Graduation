"use client"

import {
  Check,
  Copy,
  Download,
  Printer,
  Share2,
} from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  buildQrFilename,
  createQrDataUrl,
  QR_CODE_ERROR_MESSAGE,
} from "@/features/sharing/qr"

type Feedback = {
  tone: "success" | "error"
  message: string
} | null

type EventSharingActionsProps = {
  title: string
  slug: string
  url: string
}

async function copyToClipboard(value: string) {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textarea = document.createElement("textarea")
  textarea.value = value
  textarea.setAttribute("readonly", "")
  textarea.style.position = "fixed"
  textarea.style.opacity = "0"
  document.body.appendChild(textarea)
  textarea.select()

  try {
    if (!document.execCommand("copy")) {
      throw new Error("Clipboard is unavailable")
    }
  } finally {
    document.body.removeChild(textarea)
  }
}

export function EventSharingActions({
  title,
  slug,
  url,
}: EventSharingActionsProps) {
  const [pending, setPending] = useState<"share" | "copy" | "download" | null>(null)
  const [feedback, setFeedback] = useState<Feedback>(null)

  const runAction = async (
    action: "share" | "copy" | "download",
    operation: () => Promise<string>,
  ) => {
    setPending(action)
    setFeedback(null)

    try {
      setFeedback({ tone: "success", message: await operation() })
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return
      }
      setFeedback({
        tone: "error",
        message: "Không thể hoàn tất thao tác. Vui lòng thử lại.",
      })
    } finally {
      setPending(null)
    }
  }

  const share = () =>
    runAction("share", async () => {
      if (navigator.share) {
        await navigator.share({ title, url })
        return "Đã mở tùy chọn chia sẻ."
      }

      await copyToClipboard(url)
      return "Trình duyệt chưa hỗ trợ chia sẻ trực tiếp; đã sao chép liên kết."
    })

  const copy = () =>
    runAction("copy", async () => {
      await copyToClipboard(url)
      return "Đã sao chép liên kết sự kiện."
    })

  const download = () =>
    runAction("download", async () => {
      const dataUrl = await createQrDataUrl(url, 512)
      const anchor = document.createElement("a")
      anchor.href = dataUrl
      anchor.download = buildQrFilename(title, slug)
      anchor.click()
      return "Đã tải mã QR xuống."
    })

  const print = () => {
    setFeedback(null)
    window.print()
    setFeedback({ tone: "success", message: "Đã mở hộp thoại in." })
  }

  const isPending = pending !== null

  return (
    <div className="space-y-3">
      <div className="flex min-w-0 flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="min-h-(--control-min-size)"
          onClick={() => void share()}
          disabled={isPending}
        >
          <Share2 aria-hidden="true" />
          Chia sẻ
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-(--control-min-size)"
          onClick={() => void copy()}
          disabled={isPending}
        >
          {feedback?.message.startsWith("Đã sao chép") ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          Sao chép liên kết
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="min-h-(--control-min-size)"
          onClick={() => void download()}
          disabled={isPending}
        >
          <Download aria-hidden="true" />
          Tải PNG
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="min-h-(--control-min-size)"
          onClick={print}
          disabled={isPending}
        >
          <Printer aria-hidden="true" />
          In mã QR
        </Button>
      </div>
      {pending ? (
        <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
          {pending === "download" ? "Đang chuẩn bị tệp QR…" : "Đang xử lý…"}
        </p>
      ) : null}
      {feedback ? (
        <p
          className={feedback.tone === "error" ? "text-sm text-status-danger" : "text-sm text-status-success"}
          role={feedback.tone === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {feedback.message || QR_CODE_ERROR_MESSAGE}
        </p>
      ) : null}
    </div>
  )
}