"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Trash2, Loader2, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requestUploadSession, uploadToSignedUrl } from "@/features/media/client";

interface Props {
  eventId: string;
  clientRequestId: string;
  onUploadSuccess: (path: string) => void;
  onRemove: () => void;
  disabled?: boolean;
}

type Status = "idle" | "recording" | "preview" | "uploading" | "error" | "unsupported";

export function AudioRecorderField({ eventId, clientRequestId, onUploadSuccess, onRemove, disabled }: Props) {
  const [status, setStatus] = useState<Status>(() => {
    if (typeof window !== "undefined") {
      if (!navigator.mediaDevices || !window.MediaRecorder) {
        return "unsupported";
      }
    }
    return "idle";
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const mountedRef = useRef(true);
  
  const MAX_DURATION = 90; // 90 seconds max

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      stopStream();
      if (timerRef.current) clearInterval(timerRef.current);
      if (xhrRef.current) xhrRef.current.abort();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const startRecording = async () => {
    try {
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const options = getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(stream, options ? { mimeType: options } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (!mountedRef.current) return;
        stopStream();
        if (status === "recording") {
          setStatus("preview");
          if (audioChunksRef.current.length) {
            setPreviewUrl(URL.createObjectURL(new Blob(audioChunksRef.current)));
          }
        }
      };

      mediaRecorder.start(1000);
      setStatus("recording");
      setRecordingTime(0);
      
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= MAX_DURATION - 1) {
            stopRecording();
            return MAX_DURATION;
          }
          return prev + 1;
        });
      }, 1000);
      
    } catch (err: unknown) {
      if (err instanceof Error && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
        setStatus("unsupported");
        setErrorMsg("Vui lòng cấp quyền micro để ghi âm (hoặc sử dụng text thay thế).");
      } else if (err instanceof Error) {
        setStatus("error");
        setErrorMsg("Không thể ghi âm: " + err.message);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleCancel = () => {
    stopRecording();
    stopStream();
    if (xhrRef.current) xhrRef.current.abort();
    setStatus("idle");
    setRecordingTime(0);
    setErrorMsg(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    onRemove();
  };

  const getSupportedMimeType = () => {
    const types = [
      "audio/webm",
      "audio/mp4",
      "audio/ogg",
      "audio/aac"
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return "";
  };

  const handleUpload = async () => {
    if (audioChunksRef.current.length === 0) return;
    
    try {
      setStatus("uploading");
      setProgress(0);
      setErrorMsg(null);
      
      const mimeType = mediaRecorderRef.current?.mimeType || "audio/webm";
      const blob = new Blob(audioChunksRef.current, { type: mimeType });
      // Get extension from mimeType e.g., "audio/webm;codecs=opus" -> "webm"
      const ext = mimeType.split(';')[0].split('/')[1] || "webm";
      const file = new File([blob], `audio_${Date.now()}.${ext}`, { type: mimeType });
      
      const session = await requestUploadSession({
        eventId,
        clientRequestId,
        ext
      });

      await uploadToSignedUrl(session.signedUrl, file, (p) => {
        if (mountedRef.current) setProgress(p);
      }, xhrRef);

      if (mountedRef.current) {
        setStatus("idle"); // or uploaded state
        onUploadSuccess(session.path);
        xhrRef.current = null;
      }
    } catch (err: unknown) {
      if (mountedRef.current && err instanceof Error && err.message !== 'Upload cancelled') {
        setStatus("error");
        setErrorMsg("Lỗi tải lên: " + err.message);
        xhrRef.current = null;
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (status === "unsupported") {
    return (
      <div className="rounded-md border p-4 bg-muted/50 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground text-center">
        <MicOff className="h-6 w-6" />
        <span>Trình duyệt của bạn không hỗ trợ ghi âm hoặc quyền bị từ chối.</span>
        {errorMsg && <span className="text-destructive">{errorMsg}</span>}
      </div>
    );
  }

  return (
    <div className="rounded-md border p-4 bg-card w-full">
      <div className="flex flex-col gap-3">
        {status === "idle" && (
          <Button type="button" variant="outline" className="w-full flex gap-2" onClick={startRecording} disabled={disabled}>
            <Mic className="h-4 w-4" /> Bắt đầu ghi âm lời chúc (Tối đa {MAX_DURATION}s)
          </Button>
        )}

        {status === "recording" && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-destructive animate-pulse">
              <div className="h-3 w-3 rounded-full bg-destructive" />
              <span className="font-medium text-sm font-mono">{formatTime(recordingTime)}</span>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="destructive" size="sm" onClick={handleCancel}>
                Hủy
              </Button>
              <Button type="button" size="sm" onClick={stopRecording}>
                <Square className="h-4 w-4 mr-1" /> Dừng
              </Button>
            </div>
          </div>
        )}

        {status === "preview" && (
          <div className="flex flex-col gap-3">
            <audio 
              ref={audioElRef} 
              src={previewUrl || ""} 
              controls 
              className="w-full h-10"
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
                <Trash2 className="h-4 w-4 mr-1" /> Thu lại
              </Button>
              <Button type="button" size="sm" onClick={handleUpload}>
                Xác nhận
              </Button>
            </div>
          </div>
        )}

        {status === "uploading" && (
          <div className="flex flex-col items-center justify-center py-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
            <span className="text-sm">Đang tải lên... {progress}%</span>
            <Button type="button" variant="ghost" size="sm" className="mt-2 text-destructive" onClick={handleCancel}>
              Hủy tải lên
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-2 text-sm">
            <span className="text-destructive text-center">{errorMsg}</span>
            <Button type="button" variant="outline" size="sm" onClick={() => setStatus("idle")}>
              Thử lại
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
