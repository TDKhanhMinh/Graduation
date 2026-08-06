export const CLOUDINARY_COVER_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const

export const CLOUDINARY_COVER_MAX_BYTES = 5 * 1024 * 1024

export type CloudinaryCoverMimeType = (typeof CLOUDINARY_COVER_MIME_TYPES)[number]

export type CloudinaryCoverUploadResponse = {
  secure_url?: unknown
  public_id?: unknown
  asset_id?: unknown
  version?: unknown
  format?: unknown
  bytes?: unknown
  width?: unknown
  height?: unknown
}

export type CloudinaryCoverAsset = {
  secureUrl: string
  publicId: string | null
  assetId: string | null
  version: number | null
  format: string | null
  bytes: number | null
  width: number | null
  height: number | null
}

export function getCloudinaryCoverUploadConfig() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim()
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim()

  if (!cloudName || !uploadPreset) {
    throw new Error("Missing Cloudinary cover upload configuration.")
  }

  return {
    cloudName,
    uploadPreset,
    uploadUrl: `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
  }
}

export function isCloudinaryDeliveryUrl(value: string | null | undefined) {
  if (!value) return false

  try {
    const url = new URL(value)
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com" && url.pathname.length > 1
  } catch {
    return false
  }
}

export function validateCloudinaryCoverFile(file: Pick<File, "type" | "size">) {
  if (!CLOUDINARY_COVER_MIME_TYPES.includes(file.type as CloudinaryCoverMimeType)) {
    return "Cover must be a JPEG, PNG, or WebP image."
  }

  if (file.size > CLOUDINARY_COVER_MAX_BYTES) {
    return "Cover must be 5 MB or smaller."
  }

  return null
}

function nullableString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null
}

function nullableNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

export function parseCloudinaryCoverUploadResponse(
  response: CloudinaryCoverUploadResponse,
): CloudinaryCoverAsset {
  if (typeof response.secure_url !== "string" || !isCloudinaryDeliveryUrl(response.secure_url)) {
    throw new Error("Cloudinary did not return a valid secure URL.")
  }

  return {
    secureUrl: response.secure_url,
    publicId: nullableString(response.public_id),
    assetId: nullableString(response.asset_id),
    version: nullableNumber(response.version),
    format: nullableString(response.format),
    bytes: nullableNumber(response.bytes),
    width: nullableNumber(response.width),
    height: nullableNumber(response.height),
  }
}
