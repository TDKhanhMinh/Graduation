import { createClient } from "@/lib/supabase/client";

export async function uploadMedia(
  file: File,
  onProgress?: (percent: number) => void,
  xhrRef?: { current: XMLHttpRequest | null }
): Promise<string> {
  // 1. Get Cloudinary signature
  const signRes = await fetch('/api/upload/cloudinary-sign', {
    method: 'POST',
  });
  
  if (!signRes.ok) {
    throw new Error('Failed to get upload signature');
  }

  const { signature, timestamp, cloudName, apiKey, folder } = await signRes.json();

  // 2. Upload to Cloudinary
  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    if (xhrRef) xhrRef.current = xhr;
    
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
    xhr.open('POST', url, true);

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
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } catch (err) {
          reject(new Error('Invalid response from Cloudinary'));
        }
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.onabort = () => reject(new Error('Upload cancelled'));
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('folder', folder);
    
    xhr.send(formData);
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
