"use client"

import { Check, Copy, Share2 } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"

type ShareEventButtonProps = {
  title: string
  url: string
}

export function ShareEventButton({ title, url }: ShareEventButtonProps) {
  const [message, setMessage] = useState<string | null>(null)

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title, url })
        setMessage("Đã mở tùy chọn chia sẻ.")
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url)
        setMessage("Đã sao chép liên kết sự kiện.")
      } else {
        throw new Error("Sharing is unavailable")
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return
      }
      setMessage("Không thể chia sẻ lúc này. Bạn có thể sao chép liên kết trên trình duyệt.")
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
        {message?.startsWith("Đã") ? <Check aria-hidden="true" /> : <Share2 aria-hidden="true" />}
        <span className="hidden sm:inline">Chia sẻ</span>
      </Button>
      <span className="sr-only" role="status" aria-live="polite">
        {message}
      </span>
    </div>
  )
}

export function CopyEventLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    if (!navigator.clipboard) return
    await navigator.clipboard.writeText(url)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={copy}
      aria-label={copied ? "Đã sao chép liên kết" : "Sao chép liên kết sự kiện"}
      className="min-h-(--control-min-size)"
    >
      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      <span className="hidden sm:inline">{copied ? "Đã sao chép" : "Sao chép link"}</span>
    </Button>
  )
}