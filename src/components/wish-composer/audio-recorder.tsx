"use client"

import { LoaderCircle, Mic, MicOff, RefreshCcw, Square, Trash2, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { uploadPreparedMedia, type UploadedMedia } from "@/features/media/client"

type Props = {
  eventId: string
  clientRequestId: string
  onUploadSuccess: (media: UploadedMedia) => void
  onRemove: () => void
  disabled?: boolean
}

type Status = "idle" | "recording" | "preview" | "uploading" | "uploaded" | "unsupported"

const MAX_DURATION = 90

export function AudioRecorderField({ eventId, clientRequestId, onUploadSuccess, onRemove, disabled }: Props) {
  const [status, setStatus] = useState<Status>(() => {
    if (typeof window !== "undefined" && (!navigator.mediaDevices || !window.MediaRecorder)) {
      return "unsupported"
    }
    return "idle"
  })
  const [recordingTime, setRecordingTime] = useState(0)
  const [progress, setProgress] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<number | null>(null)
  const xhrRef = useRef<XMLHttpRequest | null>(null)
  const mountedRef = useRef(true)
  const cancelledRef = useRef(false)

  useEffect(() => {
    return () => {
      mountedRef.current = false
      streamRef.current?.getTracks().forEach((track) => track.stop())
      if (timerRef.current) window.clearInterval(timerRef.current)
      xhrRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const startRecording = async () => {
    try {
      setError(null)
      cancelledRef.current = false
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const supportedType = ["audio/webm", "audio/mp4", "audio/ogg", "audio/aac"].find((type) =>
        MediaRecorder.isTypeSupported(type)
      )
      const recorder = new MediaRecorder(stream, supportedType ? { mimeType: supportedType } : undefined)
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        stopStream()
        if (!mountedRef.current || cancelledRef.current) return
        if (audioChunksRef.current.length > 0) {
          if (previewUrl) URL.revokeObjectURL(previewUrl)
          setPreviewUrl(URL.createObjectURL(new Blob(audioChunksRef.current)))
          setStatus("preview")
        }
      }

      recorder.start(1000)
      setStatus("recording")
      setRecordingTime(0)
      timerRef.current = window.setInterval(() => {
        setRecordingTime((value) => {
          if (value >= MAX_DURATION - 1) {
            stopRecording()
            return MAX_DURATION
          }
          return value + 1
        })
      }, 1000)
    } catch (caught: unknown) {
      stopStream()
      setStatus("idle")
      const message = caught instanceof Error ? caught.message : "Không thể truy cập micro."
      setError(message)
      toast.error(message)
    }
  }

  const removeRecording = () => {
    cancelledRef.current = true
    stopRecording()
    stopStream()
    xhrRef.current?.abort()
    xhrRef.current = null
    audioChunksRef.current = []
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setRecordingTime(0)
    setProgress(0)
    setError(null)
    setStatus("idle")
    onRemove()
  }

  const cancelUpload = () => {
    xhrRef.current?.abort()
    xhrRef.current = null
  }

  const uploadRecording = async () => {
    if (!audioChunksRef.current.length) return

    try {
      setError(null)
      setStatus("uploading")
      setProgress(0)
      const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm"
      const blob = new Blob(audioChunksRef.current, { type: mimeType })
      const extension = mimeType.split(";")[0].split("/")[1] || "webm"
      const file = new File([blob], `audio_${Date.now()}.${extension}`, { type: mimeType })
      const uploaded = await uploadPreparedMedia({
        file,
        eventId,
        clientRequestId,
        mediaType: "audio",
        durationMs: recordingTime * 1000,
        onProgress: setProgress,
        xhrRef,
      })

      if (!mountedRef.current) return
      xhrRef.current = null
      setStatus("uploaded")
      setError(null)
      onUploadSuccess(uploaded)
      toast.success("Đã đính kèm bản ghi âm.")
    } catch (caught: unknown) {
      if (!mountedRef.current) return
      xhrRef.current = null
      setStatus("preview")
      const message =
        caught instanceof Error && caught.message === "Upload cancelled"
          ? "Đã hủy tải lên. Bạn có thể thử lại."
          : caught instanceof Error
            ? caught.message
            : "Không thể tải bản ghi âm lên."
      setError(message)
      toast.error(message)
    }
  }

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`

  if (status === "unsupported") {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border bg-surface-sunken p-4 text-center text-sm text-muted-foreground" role="status">
        <MicOff aria-hidden="true" className="size-6" />
        <span>Trình duyệt không hỗ trợ ghi âm hoặc quyền micro đã bị từ chối.</span>
        <span className="text-status-danger">Bạn có thể đính kèm ảnh thay thế.</span>
      </div>
    )
  }

  return (
    <div className="w-full rounded-lg border bg-card p-4">
      {status === "idle" ? (
        <Button
          type="button"
          variant="outline"
          className="min-h-(--control-min-size) w-full"
          onClick={() => void startRecording()}
          disabled={disabled}
        >
          <Mic aria-hidden="true" />
          Bắt đầu ghi âm (tối đa {MAX_DURATION}s)
        </Button>
      ) : null}

      {status === "recording" ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" role="status" aria-live="polite">
          <div className="flex items-center gap-2 text-status-danger">
            <span className="size-3 rounded-full bg-status-danger" aria-hidden="true" />
            <span className="font-mono text-sm font-medium">Đang ghi {formatTime(recordingTime)}</span>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="destructive" onClick={removeRecording} className="min-h-(--control-min-size)">
              <X aria-hidden="true" />
              Hủy
            </Button>
            <Button type="button" onClick={stopRecording} className="min-h-(--control-min-size)">
              <Square aria-hidden="true" />
              Dừng
            </Button>
          </div>
        </div>
      ) : null}

      {status === "preview" ? (
        <div className="flex flex-col gap-3">
          <audio src={previewUrl || ""} controls className="h-10 w-full" aria-label="Nghe thử bản ghi âm" />
          {error ? <p className="text-sm text-status-danger" role="alert">{error}</p> : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={removeRecording} className="min-h-(--control-min-size)">
              <Trash2 aria-hidden="true" />
              Xóa bản ghi
            </Button>
            <Button type="button" onClick={() => void uploadRecording()} className="min-h-(--control-min-size)">
              <RefreshCcw aria-hidden="true" />
              {error ? "Thử tải lại" : "Đính kèm bản ghi"}
            </Button>
          </div>
        </div>
      ) : null}

      {status === "uploading" ? (
        <div className="flex flex-col items-center justify-center gap-2 py-2" role="status" aria-live="polite">
          <LoaderCircle aria-hidden="true" className="size-6 animate-spin text-primary" />
          <progress className="h-2 w-40" value={progress} max={100} aria-label={`Đang tải bản ghi lên ${progress}%`} />
          <span className="text-sm">Đang tải bản ghi lên… {progress}%</span>
          <Button type="button" variant="outline" onClick={cancelUpload} className="min-h-(--control-min-size) text-status-danger">
            Hủy tải lên
          </Button>
        </div>
      ) : null}

      {status === "uploaded" ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" role="status">
          <p className="text-sm font-medium text-status-success">Đã đính kèm bản ghi âm.</p>
          <Button type="button" variant="outline" onClick={removeRecording} className="min-h-(--control-min-size)">
            <Trash2 aria-hidden="true" />
            Xóa bản ghi
          </Button>
        </div>
      ) : null}

      {status === "idle" && error ? <p className="mt-2 text-sm text-status-danger" role="alert">{error}</p> : null}
    </div>
  )
}