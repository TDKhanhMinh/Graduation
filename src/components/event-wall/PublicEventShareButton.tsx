"use client"

import { Check, Copy, QrCode as QrCodeIcon, Share2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { QrCode } from "@/components/sharing/QrCode"
import { Button } from "@/components/ui/button"

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

type ShareEventButtonProps = {
  title: string
  url: string
}

export function ShareEventButton({ title, url }: ShareEventButtonProps) {
  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, url })
        toast.success("Đã mở tùy chọn chia sẻ.")
      } else {
        await copyToClipboard(url)
        toast.success("Trình duyệt chưa hỗ trợ chia sẻ trực tiếp; đã sao chép liên kết.")
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return
      }
      toast.error("Không thể chia sẻ lúc này. Vui lòng thử lại.")
    }
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={share}
        aria-label="Chia sẻ sự kiện"
        className="min-h-(--control-min-size)"
      >
        <Share2 aria-hidden="true" />
        <span className="hidden sm:inline">Chia sẻ</span>
      </Button>
    </div>
  )
}

export function PublicQrButton({ url }: { url: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative shrink-0">
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? "Đóng mã QR sự kiện" : "Mở mã QR sự kiện"}
        aria-expanded={open}
        aria-controls="public-event-qr-panel"
        className="min-h-(--control-min-size)"
      >
        <QrCodeIcon aria-hidden="true" />
        <span className="hidden sm:inline">Mã QR</span>
      </Button>
      {open ? (
        <div
          id="public-event-qr-panel"
          role="region"
          aria-label="Mã QR mở trang sự kiện"
          className="absolute right-0 top-full z-20 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-xl border bg-background p-4 shadow-lg"
        >
          <p className="text-sm font-medium">Quét để mở trang sự kiện</p>
          <QrCode value={url} size={192} className="mt-3" />
          <p className="mt-3 break-all text-xs leading-5 text-muted-foreground">{url}</p>
        </div>
      ) : null}
    </div>
  )
}

export function CopyEventLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await copyToClipboard(url)
      setCopied(true)
      toast.success("Đã sao chép liên kết sự kiện.")
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
      toast.error("Không thể sao chép liên kết lúc này. Vui lòng thử lại.")
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        onClick={() => void copy()}
        aria-label={copied ? "Đã sao chép liên kết" : "Sao chép liên kết sự kiện"}
        className="min-h-(--control-min-size)"
      >
        {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        <span className="hidden sm:inline">{copied ? "Đã sao chép" : "Sao chép link"}</span>
      </Button>
    </>
  )
}