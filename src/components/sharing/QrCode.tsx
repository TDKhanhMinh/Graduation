"use client"

import { useEffect, useState } from "react"

import {
  createQrDataUrl,
  QR_CODE_ERROR_MESSAGE,
} from "@/features/sharing/qr"
import { cn } from "@/lib/utils"
import { QrScanHalo } from "@/components/effects/qr-scan-halo"

type GeneratedQrState = {
  value: string
  dataUrl: string | null
  error: string | null
}

type QrCodeProps = {
  value: string
  size?: number
  alt?: string
  className?: string
}

export function QrCode({
  value,
  size = 256,
  alt = "Mã QR mở trang sự kiện công khai",
  className,
}: QrCodeProps) {
  const normalizedValue = value.trim()
  const [generated, setGenerated] = useState<GeneratedQrState>({
    value: "",
    dataUrl: null,
    error: null,
  })

  useEffect(() => {
    if (!normalizedValue) return

    let active = true

    void createQrDataUrl(normalizedValue, size)
      .then((dataUrl) => {
        if (active) {
          setGenerated({ value: normalizedValue, dataUrl, error: null })
        }
      })
      .catch(() => {
        if (active) {
          setGenerated({
            value: normalizedValue,
            dataUrl: null,
            error: QR_CODE_ERROR_MESSAGE,
          })
        }
      })

    return () => {
      active = false
    }
  }, [normalizedValue, size])

  if (!normalizedValue) {
    return (
      <div
        className={cn("rounded-lg border border-status-danger/30 bg-status-danger/10 p-4 text-sm text-status-danger", className)}
        role="alert"
      >
        Không có liên kết hợp lệ để tạo mã QR.
      </div>
    )
  }

  if (generated.value !== normalizedValue) {
    return (
      <div
        className={cn("flex min-h-64 min-w-0 items-center justify-center rounded-lg border bg-background p-4 text-sm text-muted-foreground", className)}
        role="status"
        aria-live="polite"
      >
        Đang tạo mã QR…
      </div>
    )
  }

  if (generated.error || !generated.dataUrl) {
    return (
      <div
        className={cn("rounded-lg border border-status-danger/30 bg-status-danger/10 p-4 text-sm text-status-danger", className)}
        role="alert"
      >
        {generated.error ?? QR_CODE_ERROR_MESSAGE}
      </div>
    )
  }

  return (
    <div className={cn("relative min-w-0 rounded-lg border bg-white p-3", className)}>
      <QrScanHalo />
      {/* eslint-disable-next-line @next/next/no-img-element -- QR data URL is generated client-side and should not be optimized */}
      <img
        src={generated.dataUrl}
        alt={alt}
        width={size}
        height={size}
        className="mx-auto block max-w-full object-contain"
      />
    </div>
  )
}