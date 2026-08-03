"use client";

import { useState, useRef, useEffect } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prepareImage, requestUploadSession, uploadToSignedUrl } from "@/features/media/client";

interface Props {
  eventId: string;
  clientRequestId: string;
  onUploadSuccess: (path: string) => void;
  onRemove: () => void;
  isAvatar?: boolean;
  disabled?: boolean;
}

export function ImageUploadField({ eventId, clientRequestId, onUploadSuccess, onRemove, isAvatar, disabled }: Props) {
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
      if (xhrRef.current) xhrRef.current.abort();
    };
  }, [preview]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      setError("Please select an image file.");
      return;
    }

    try {
      setError(null);
      setUploading(true);
      setProgress(0);

      // 1. Prepare image
      const preparedFile = await prepareImage(selectedFile, 1920);
      if (!mountedRef.current) return;
      
      const url = URL.createObjectURL(preparedFile);
      setPreview(url);

      // 2. Request session
      const ext = preparedFile.name.split('.').pop() || 'webp';
      const session = await requestUploadSession({
        eventId,
        clientRequestId,
        ext,
        isAvatar,
      });

      // 3. Upload
      await uploadToSignedUrl(session.signedUrl, preparedFile, (p) => {
        if (mountedRef.current) setProgress(p);
      }, xhrRef);

      if (mountedRef.current) {
        setUploading(false);
        onUploadSuccess(session.path);
        xhrRef.current = null;
      }
    } catch (err: unknown) {
      if (mountedRef.current && err instanceof Error && err.message !== 'Upload cancelled') {
        setUploading(false);
        setError(err.message || "Failed to upload image.");
        setPreview(null);
        xhrRef.current = null;
      }
    }
  };

  const handleRemove = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    setPreview(null);
    setProgress(0);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onRemove();
  };

  if (preview) {
    return (
      <div className="relative inline-block w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt="Preview" className="rounded-md object-cover max-h-64 w-full border" />
        <Button
          type="button"
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2 rounded-full h-8 w-8"
          onClick={handleRemove}
          disabled={uploading}
        >
          <X className="h-4 w-4" />
        </Button>
        {uploading && (
          <div className="absolute inset-0 bg-background/50 flex flex-col items-center justify-center rounded-md">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
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
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        className="w-full h-24 border-dashed flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || uploading}
      >
        <ImagePlus className="h-6 w-6" />
        <span>Select an image</span>
      </Button>
      {error && <p className="text-destructive text-sm mt-1">{error}</p>}
    </div>
  );
}
