"use client"

import { ImagePlus, LoaderCircle, RefreshCcw, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { prepareImage, uploadPreparedMedia, type UploadedMedia } from "@/features/media/client"

interface Props {
  eventId: string
  clientRequestId: string
  onUploadSuccess: (media: UploadedMedia) => void
  onRemove: () => void
  isAvatar?: boolean
  disabled?: boolean
}

export function ImageUploadField({
  eventId,
  clientRequestId,
  onUploadSuccess,
  onRemove,
  isAvatar,
  disabled,
}: Props) {
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<File | null>(null)
  const xhrRef = useRef<XMLHttpRequest | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      xhrRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const uploadFile = async (file: File) => {
    try {
      setError(null)
      setUploading(true)
      setProgress(0)
      const uploaded = await uploadPreparedMedia({
        file,
        eventId,
        clientRequestId,
        mediaType: "image",
        isAvatar,
        onProgress: setProgress,
        xhrRef,
      })

      if (!mountedRef.current) return
      setUploading(false)
      xhrRef.current = null
      onUploadSuccess(uploaded)
      toast.success(isAvatar ? "Đã tải ảnh đại diện." : "Đã tải ảnh lên.")
    } catch (caught: unknown) {
      if (!mountedRef.current) return
      setUploading(false)
      xhrRef.current = null
      if (caught instanceof Error && caught.message === "Đã hủy tải lên") {
        setError("Đã hủy tải lên. Bạn có thể thử lại hoặc xóa ảnh.")
        toast.error("Đã hủy tải lên. Bạn có thể thử lại hoặc xóa ảnh.")
      } else {
        const message = caught instanceof Error ? caught.message : "Không thể tải ảnh lên."
        setError(message)
        toast.error(message)
      }
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.type.startsWith("image/")) {
      setError("Vui lòng chọn tệp hình ảnh.")
      toast.error("Vui lòng chọn tệp hình ảnh.")
      return
    }

    try {
      setError(null)
      const preparedFile = await prepareImage(selectedFile, 1920)
      if (!mountedRef.current) return

      if (preview) URL.revokeObjectURL(preview)
      fileRef.current = preparedFile
      setPreview(URL.createObjectURL(preparedFile))
      await uploadFile(preparedFile)
    } catch (caught: unknown) {
      if (mountedRef.current) {
        const message = caught instanceof Error ? caught.message : "Không thể đọc ảnh."
        setError(message)
        toast.error(message)
        setUploading(false)
      }
    }
  }

  const handleRemove = () => {
    xhrRef.current?.abort()
    xhrRef.current = null
    fileRef.current = null
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setProgress(0)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    onRemove()
  }

  const handleCancelUpload = () => {
    xhrRef.current?.abort()
    xhrRef.current = null
  }

  if (preview) {
    return (
      <div className="relative w-full overflow-hidden rounded-lg border bg-surface-sunken">
        {/* eslint-disable-next-line @next/next/no-img-element -- preview uses a local object URL before upload */}
        <img src={preview} alt="Xem trước ảnh đính kèm" width={1920} height={1080} className="max-h-64 w-full object-contain" />
        <div className="absolute right-2 top-2 flex gap-2">
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="min-h-(--control-min-size) min-w-(--control-min-size) rounded-full"
            onClick={handleRemove}
            disabled={uploading}
            aria-label="Xóa ảnh đính kèm"
          >
            <X aria-hidden="true" />
          </Button>
        </div>
        {uploading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/75">
            <LoaderCircle aria-hidden="true" className="size-8 animate-spin text-primary" />
            <progress className="h-2 w-40" value={progress} max={100} aria-label={`Đang tải ảnh lên ${progress}%`} />
            <span className="text-sm font-medium" role="status" aria-live="polite">
              Đang tải ảnh lên… {progress}%
            </span>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelUpload}
              className="min-h-(--control-min-size)"
            >
              Hủy tải lên
            </Button>
          </div>
        ) : null}
        {error ? (
          <div className="flex items-center justify-between gap-3 border-t border-status-danger/30 bg-status-danger/10 px-3 py-2 text-sm text-status-danger" role="alert">
            <span>{error}</span>
            <Button
              type="button"
              variant="ghost"
              onClick={() => fileRef.current && void uploadFile(fileRef.current)}
              className="min-h-(--control-min-size) shrink-0 text-status-danger"
            >
              <RefreshCcw aria-hidden="true" />
              Thử lại
            </Button>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="w-full">
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
        aria-label={isAvatar ? "Chọn ảnh đại diện" : "Chọn ảnh đính kèm"}
      />
      <Button
        type="button"
        variant="outline"
        className="flex min-h-28 w-full flex-col items-center justify-center gap-2 border-dashed text-muted-foreground hover:text-foreground"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || uploading}
      >
        <ImagePlus aria-hidden="true" className="size-6" />
        <span>{isAvatar ? "Chọn ảnh đại diện" : "Thêm ảnh đính kèm"}</span>
      </Button>
      {error ? (
        <p className="mt-2 text-sm text-status-danger" role="alert">{error}</p>
      ) : null}
    </div>
  )
}