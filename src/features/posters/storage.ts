import { z } from "zod"

export const POSTER_ASSET_BUCKET = "poster-assets-private" as const
export const POSTER_ASSET_MAX_BYTES = 10 * 1024 * 1024

export const posterAssetMimeSchema = z.enum(["image/jpeg", "image/png", "image/webp"])
export type PosterAssetMime = z.infer<typeof posterAssetMimeSchema>

const uuidSchema = z.string().uuid()

const extensionByMime: Record<PosterAssetMime, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

export function posterAssetPath(params: {
  eventId: string
  documentId: string
  assetId: string
  mimeType: PosterAssetMime
}) {
  uuidSchema.parse(params.eventId)
  uuidSchema.parse(params.documentId)
  uuidSchema.parse(params.assetId)
  return `${params.eventId}/${params.documentId}/${params.assetId}.${extensionByMime[params.mimeType]}`
}

export function detectPosterAssetMime(bytes: Uint8Array): PosterAssetMime | null {
  if (bytes.length >= 8 && bytes.slice(0, 8).every((value, index) => value === [137, 80, 78, 71, 13, 10, 26, 10][index])) {
    return "image/png"
  }

  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg"
  }

  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return "image/webp"
  }

  return null
}

export function validatePosterAssetUpload(input: {
  bytes: Uint8Array
  declaredMimeType: string
  maxBytes?: number
}) {
  const maxBytes = input.maxBytes ?? POSTER_ASSET_MAX_BYTES
  const declaredMimeResult = posterAssetMimeSchema.safeParse(input.declaredMimeType)
  const detectedMimeType = detectPosterAssetMime(input.bytes)
  const issues: string[] = []

  if (input.bytes.byteLength <= 0 || input.bytes.byteLength > maxBytes) {
    issues.push(`file must be between 1 and ${maxBytes} bytes`)
  }
  if (!declaredMimeResult.success) {
    issues.push("unsupported image MIME type")
  }
  if (!detectedMimeType) {
    issues.push("image magic bytes are not recognized")
  }
  if (declaredMimeResult.success && detectedMimeType && declaredMimeResult.data !== detectedMimeType) {
    issues.push("declared MIME type does not match image magic bytes")
  }

  return {
    success: issues.length === 0,
    issues,
    mimeType: issues.length === 0 ? detectedMimeType : null,
  } as const
}

