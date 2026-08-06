import { posterAssetSchema, type PosterAsset } from "./schema"
import { POSTER_ASSET_MAX_BYTES, validatePosterAssetUpload } from "./storage"

export const POSTER_IMAGE_MAX_DIMENSION = 1920
export const POSTER_IMAGE_QUALITY = 0.86

export type PosterCropPreset = "center" | "top" | "bottom" | "left" | "right"

export type PosterCrop = {
  fit: "cover" | "contain"
  focalX: number
  focalY: number
  scale: number
}

export const POSTER_CROP_PRESETS: Record<PosterCropPreset, PosterCrop> = {
  center: { fit: "cover", focalX: 0.5, focalY: 0.5, scale: 1 },
  top: { fit: "cover", focalX: 0.5, focalY: 0.2, scale: 1 },
  bottom: { fit: "cover", focalX: 0.5, focalY: 0.8, scale: 1 },
  left: { fit: "cover", focalX: 0.2, focalY: 0.5, scale: 1 },
  right: { fit: "cover", focalX: 0.8, focalY: 0.5, scale: 1 },
}

export type PosterCropRect = {
  x: number
  y: number
  width: number
  height: number
}

function clamp(value: number) {
  return Math.min(1, Math.max(0, value))
}

export function resolvePosterCropRect(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  crop: PosterCrop,
): PosterCropRect {
  if (crop.fit === "contain") return { x: 0, y: 0, width: sourceWidth, height: sourceHeight }

  const targetRatio = targetWidth / targetHeight
  const sourceRatio = sourceWidth / sourceHeight
  const safeScale = Math.max(1, crop.scale)
  let width = sourceWidth
  let height = sourceHeight

  if (sourceRatio > targetRatio) {
    width = sourceHeight * targetRatio
  } else {
    height = sourceWidth / targetRatio
  }

  width = Math.min(sourceWidth, width / safeScale)
  height = Math.min(sourceHeight, height / safeScale)
  const x = (sourceWidth - width) * clamp(crop.focalX)
  const y = (sourceHeight - height) * clamp(crop.focalY)

  return { x, y, width, height }
}

export function getPosterSvgImageAlignment(crop: PosterCrop) {
  const horizontal = crop.focalX <= 0.33 ? "xMin" : crop.focalX >= 0.67 ? "xMax" : "xMid"
  const vertical = crop.focalY <= 0.33 ? "YMin" : crop.focalY >= 0.67 ? "YMax" : "YMid"
  return `${horizontal}${vertical} ${crop.fit}`
}

export function createLocalPosterAsset(input: {
  id: string
  kind: PosterAsset["kind"]
  mimeType: "image/jpeg" | "image/png" | "image/webp"
  width: number
  height: number
}) {
  return posterAssetSchema.parse({
    id: input.id,
    kind: input.kind,
    mimeType: input.mimeType,
    width: input.width,
    height: input.height,
    path: `local://poster-assets/${input.id}`,
    external: {
      provider: "local",
      providerAssetId: input.id,
      attributionRequired: false,
    },
  })
}

export type PreparedPosterImage = {
  dataUrl: string
  mimeType: "image/jpeg" | "image/png" | "image/webp"
  width: number
  height: number
  sizeBytes: number
  asset: PosterAsset
}

async function decodeImage(file: File): Promise<{ image: CanvasImageSource; width: number; height: number }> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file)
    return { image: bitmap, width: bitmap.width, height: bitmap.height }
  }

  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    return { image, width: image.naturalWidth, height: image.naturalHeight }
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function preparePosterImage(file: File, options?: {
  maxBytes?: number
  maxDimension?: number
  quality?: number
  assetId?: string
  kind?: PosterAsset["kind"]
}): Promise<PreparedPosterImage> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const validation = validatePosterAssetUpload({
    bytes,
    declaredMimeType: file.type,
    maxBytes: options?.maxBytes ?? POSTER_ASSET_MAX_BYTES,
  })
  if (!validation.success || !validation.mimeType) {
    throw new Error(validation.issues.join(" "))
  }

  const decoded = await decodeImage(file)
  if (!decoded.width || !decoded.height) throw new Error("Kích thước hình ảnh không hợp lệ")

  const maxDimension = options?.maxDimension ?? POSTER_IMAGE_MAX_DIMENSION
  const scale = Math.min(1, maxDimension / Math.max(decoded.width, decoded.height))
  const width = Math.max(1, Math.round(decoded.width * scale))
  const height = Math.max(1, Math.round(decoded.height * scale))
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Canvas không khả dụng")
  context.drawImage(decoded.image, 0, 0, width, height)

  const outputMimeType = "image/webp" as const
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, outputMimeType, options?.quality ?? POSTER_IMAGE_QUALITY)
  })
  if (!blob) throw new Error("Nén hình ảnh thất bại")
  if (blob.size > (options?.maxBytes ?? POSTER_ASSET_MAX_BYTES)) throw new Error("Hình ảnh sau khi nén vẫn vượt quá giới hạn kích thước")

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Mã hóa hình ảnh thất bại"))
    reader.onerror = () => reject(new Error("Mã hóa hình ảnh thất bại"))
    reader.readAsDataURL(blob)
  })

  const id = options?.assetId ?? crypto.randomUUID()
  return {
    dataUrl,
    mimeType: outputMimeType,
    width,
    height,
    sizeBytes: blob.size,
    asset: createLocalPosterAsset({ id, kind: options?.kind ?? "background", mimeType: outputMimeType, width, height }),
  }
}
