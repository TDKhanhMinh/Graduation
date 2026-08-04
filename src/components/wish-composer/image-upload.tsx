"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prepareImage, uploadPreparedMedia, type UploadedMedia } from "@/features/media/client";

interface Props {
  eventId: string;
  clientRequestId: string;
  onUploadSuccess: (media: UploadedMedia) => void;
  onRemove: () => void;
  isAvatar?: boolean;
  disabled?: boolean;
}

export function ImageUploadField({
  eventId,
  clientRequestId,
  onUploadSuccess,
  onRemove,
  isAvatar,
  disabled,
}: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (preview) URL.revokeObjectURL(preview);
      xhrRef.current?.abort();
    };
  }, [preview]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    try {
      setError(null);
      setUploading(true);
      setProgress(0);
      const preparedFile = await prepareImage(selectedFile, 1920);
      if (!mountedRef.current) return;

      const previewUrl = URL.createObjectURL(preparedFile);
      setPreview(previewUrl);
      const uploaded = await uploadPreparedMedia({
        file: preparedFile,
        eventId,
        clientRequestId,
        mediaType: "image",
        isAvatar,
        onProgress: setProgress,
        xhrRef,
      });

      if (mountedRef.current) {
        setUploading(false);
        xhrRef.current = null;
        onUploadSuccess(uploaded);
      }
    } catch (caught: unknown) {
      if (mountedRef.current && caught instanceof Error && caught.message !== "Upload cancelled") {
        setUploading(false);
        setError(caught.message || "Failed to upload image.");
        setPreview(null);
        xhrRef.current = null;
      }
    }
  };

  const handleRemove = () => {
    xhrRef.current?.abort();
    xhrRef.current = null;
    setPreview(null);
    setProgress(0);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onRemove();
  };

  if (preview) {
    return (
      <div className="relative inline-block w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt="Preview" className="max-h-64 w-full rounded-md border object-cover" />
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute right-2 top-2 h-8 w-8 rounded-full"
          onClick={handleRemove}
          disabled={uploading}
        >
          <X className="h-4 w-4" />
        </Button>
        {uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-md bg-background/50">
            <Loader2 className="mb-2 h-8 w-8 animate-spin text-primary" />
            <span className="text-sm font-medium">{progress}%</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        className="flex h-24 w-full flex-col items-center justify-center gap-2 border-dashed text-muted-foreground hover:text-foreground"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || uploading}
      >
        <ImagePlus className="h-6 w-6" />
        <span>Select an image</span>
      </Button>
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}
