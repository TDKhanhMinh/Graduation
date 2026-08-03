import { createClient } from "@/lib/supabase/client";

export async function requestUploadSession(params: {
  eventId: string;
  clientRequestId: string;
  ext: string;
  isAvatar?: boolean;
}) {
  const supabase = createClient();
  
  const { data, error } = await supabase.functions.invoke('create-upload-session', {
    body: {
      event_id: params.eventId,
      client_request_id: params.clientRequestId,
      ext: params.ext,
      is_avatar: params.isAvatar,
    }
  });

  if (error) {
    throw new Error(error.message || 'Failed to request upload session');
  }

  return data as { path: string; token: string; signedUrl: string };
}

export async function uploadToSignedUrl(
  signedUrl: string,
  file: File,
  onProgress?: (percent: number) => void,
  xhrRef?: { current: XMLHttpRequest | null }
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    if (xhrRef) xhrRef.current = xhr;
    
    xhr.open('PUT', signedUrl, true);
    // Supabase storage signed URL PUT doesn't require auth headers, it uses the token in the URL.
    xhr.setRequestHeader('Content-Type', file.type);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.onabort = () => reject(new Error('Upload cancelled'));
    
    xhr.send(file);
  });
}

export async function prepareImage(file: File, maxSize: number = 1920): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let width = img.width;
      let height = img.height;
      let scale = 1;

      if (width > maxSize || height > maxSize) {
        scale = width > height ? maxSize / width : maxSize / height;
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas not supported'));

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Canvas toBlob failed'));
        // WebP for efficiency if supported by browser, fallback to jpeg.
        // For simplicity, let's just use WebP.
        resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
          type: 'image/webp',
          lastModified: Date.now(),
        }));
      }, 'image/webp', 0.85);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

