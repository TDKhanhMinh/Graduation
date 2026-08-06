"use client"

import { LoaderCircle, ImagePlus, RefreshCcw, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  getCloudinaryCoverUploadConfig,
  parseCloudinaryCoverUploadResponse,
  validateCloudinaryCoverFile,
} from "@/features/media/cloudinary-cover"
import { prepareImage } from "@/features/media/client"

type CloudinaryCoverUploadProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

type UploadState = "idle" | "uploading" | "ready" | "error"

export function CloudinaryCoverUpload({ value, onChange, disabled = false }: CloudinaryCoverUploadProps) {
  const [state, setState] = useState<UploadState>("idle")
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [canRetry, setCanRetry] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const retryFileRef = useRef<File | null>(null)
  const xhrRef = useRef<XMLHttpRequest | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    return () => {
      mountedRef.current = false
      xhrRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const uploadFile = async (file: File) => {
    const validationError = validateCloudinaryCoverFile(file)
    if (validationError) {
      setError(validationError)
      setState("error")
      toast.error(validationError)
      return
    }

    try {
      setError(null)
      setState("uploading")
      setProgress(0)
      retryFileRef.current = file
      setCanRetry(true)

      const { uploadPreset, uploadUrl } = getCloudinaryCoverUploadConfig()
      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", uploadPreset)

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhrRef.current = xhr
        xhr.open("POST", uploadUrl, true)

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && mountedRef.current) {
            setProgress(Math.round((event.loaded / event.total) * 100))
          }
        }

        xhr.onload = () => {
          if (xhr.status < 200 || xhr.status >= 300) {
            reject(new Error("Cloudinary upload failed."))
            return
          }

          try {
            const asset = parseCloudinaryCoverUploadResponse(JSON.parse(xhr.responseText) as Record<string, unknown>)
            onChange(asset.secureUrl)
            resolve()
          } catch (caught: unknown) {
            reject(caught instanceof Error ? caught : new Error("Cloudinary returned an invalid response."))
          }
        }
        xhr.onerror = () => reject(new Error("Network error during Cloudinary upload."))
        xhr.onabort = () => reject(new Error("Cloudinary upload cancelled."))
        xhr.send(formData)
      })

      if (mountedRef.current) {
        setState("ready")
        setProgress(100)
        toast.success("Ảnh cover đã tải lên Cloudinary. Hãy lưu thay đổi để áp dụng.")
      }
    } catch (caught: unknown) {
      if (!mountedRef.current) return
      setState("error")
      const errorMessage = caught instanceof Error ? caught.message : "Could not upload cover."
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      xhrRef.current = null
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    const validationError = validateCloudinaryCoverFile(selectedFile)
    if (validationError) {
      setError(validationError)
      setState("error")
      toast.error(validationError)
      return
    }

    try {
      const preparedFile = await prepareImage(selectedFile, 1920)
      if (!mountedRef.current) return
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(URL.createObjectURL(preparedFile))
      await uploadFile(preparedFile)
    } catch (caught: unknown) {
      if (!mountedRef.current) return
      setState("error")
      const errorMessage = caught instanceof Error ? caught.message : "Could not prepare cover."
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }

  const handleRemove = () => {
    xhrRef.current?.abort()
    xhrRef.current = null
    retryFileRef.current = null
    setCanRetry(false)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setProgress(0)
    setError(null)
    setState("idle")
    onChange("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleRetry = () => {
    if (retryFileRef.current) void uploadFile(retryFileRef.current)
  }

  const preview = previewUrl || value || null

  return (
    <div className="grid gap-3" aria-describedby="cover-help">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => void handleFileChange(event)}
        disabled={disabled || state === "uploading"}
        aria-label="Chọn ảnh cover sự kiện"
      />
      {preview ? (
        <div className="relative overflow-hidden rounded-2xl border bg-surface-sunken">
          {/* eslint-disable-next-line @next/next/no-img-element -- preview supports a local object URL before Cloudinary upload */}
          <img src={preview} alt="Xem trước ảnh cover sự kiện" className="max-h-64 w-full object-cover" />
          <div className="absolute right-3 top-3 flex gap-2">
            <Button type="button" variant="destructive" size="icon" onClick={handleRemove} disabled={state === "uploading"} aria-label="Xóa ảnh cover">
              <X aria-hidden="true" />
            </Button>
          </div>
          {state === "uploading" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80">
              <LoaderCircle aria-hidden="true" className="size-7 animate-spin text-primary" />
              <progress className="h-2 w-40" value={progress} max={100} aria-label={`Đang tải ảnh cover lên ${progress}%`} />
              <span className="text-sm font-medium" role="status" aria-live="polite">Đang tải ảnh cover lên… {progress}%</span>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" className="min-h-(--control-min-size)" onClick={() => fileInputRef.current?.click()} disabled={disabled || state === "uploading"}>
          <ImagePlus aria-hidden="true" />
          {preview ? "Thay ảnh cover" : "Tải ảnh cover lên"}
        </Button>
        {state === "error" && canRetry ? (
          <Button type="button" variant="ghost" className="min-h-(--control-min-size)" onClick={handleRetry} disabled={disabled}>
            <RefreshCcw aria-hidden="true" />
            Thử lại
          </Button>
        ) : null}
      </div>
      <p id="cover-help" className="text-xs leading-5 text-muted-foreground">JPEG, PNG hoặc WebP, tối đa 5 MB. Ảnh được lưu tại Cloudinary; Supabase chỉ lưu URL.</p>
    </div>
  )
}
