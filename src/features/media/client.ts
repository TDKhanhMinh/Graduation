import { createClient } from "@/lib/supabase/client";

export type UploadedMedia = {
  path: string;
  type: "image" | "audio";
  mimeType: string;
  sizeBytes: number;
  durationMs?: number;
  width?: number;
  height?: number;
};

export async function requestUploadSession(params: {
  eventId: string;
  clientRequestId: string;
  ext: string;
  mediaType: "image" | "audio";
  mimeType: string;
  isAvatar?: boolean;
}) {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke("create-upload-session", {
    body: {
      event_id: params.eventId,
      client_request_id: params.clientRequestId,
      ext: params.ext,
      media_type: params.mediaType,
      mime_type: params.mimeType,
      is_avatar: params.isAvatar,
    },
  });

  if (error || !data?.signedUrl || !data?.path) {
    throw new Error(error?.message || "Không thể yêu cầu phiên tải lên");
  }

  return data as { path: string; token: string; signedUrl: string };
}

export async function uploadToSignedUrl(
  signedUrl: string,
  file: File,
  onProgress?: (percent: number) => void,
  xhrRef?: { current: XMLHttpRequest | null },
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    if (xhrRef) xhrRef.current = xhr;
    xhr.open("PUT", signedUrl, true);
    xhr.setRequestHeader("Content-Type", file.type);

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error("Tải lên thất bại với mã trạng thái " + xhr.status));
      }
    };
    xhr.onerror = () => reject(new Error("Lỗi mạng trong khi tải lên"));
    xhr.onabort = () => reject(new Error("Đã hủy tải lên"));
    xhr.send(file);
  });
}

export async function uploadPreparedMedia(params: {
  file: File;
  eventId: string;
  clientRequestId: string;
  mediaType: "image" | "audio";
  isAvatar?: boolean;
  durationMs?: number;
  width?: number;
  height?: number;
  onProgress?: (percent: number) => void;
  xhrRef?: { current: XMLHttpRequest | null };
}): Promise<UploadedMedia> {
  const ext = params.file.name.split(".").pop()?.toLowerCase() || "bin";
  const session = await requestUploadSession({
    eventId: params.eventId,
    clientRequestId: params.clientRequestId,
    ext,
    mediaType: params.mediaType,
    mimeType: params.file.type,
    isAvatar: params.isAvatar,
  });

  await uploadToSignedUrl(session.signedUrl, params.file, params.onProgress, params.xhrRef);

  return {
    path: session.path,
    type: params.mediaType,
    mimeType: params.file.type,
    sizeBytes: params.file.size,
    durationMs: params.durationMs,
    width: params.width,
    height: params.height,
  };
}

export async function prepareImage(file: File, maxSize: number = 1920): Promise<File> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(url);
      let width = image.width;
      let height = image.height;
      let scale = 1;

      if (width > maxSize || height > maxSize) {
        scale = width > height ? maxSize / width : maxSize / height;
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) return reject(new Error("Trình duyệt không hỗ trợ canvas"));
      context.drawImage(image, 0, 0, width, height);

      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error("Không thể tạo tệp từ canvas"));
        resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
          type: "image/webp",
          lastModified: Date.now(),
        }));
      }, "image/webp", 0.85);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Không thể tải hình ảnh"));
    };
    image.src = url;
  });
}
