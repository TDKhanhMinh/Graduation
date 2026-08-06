import { getPosterDimensions, type PosterRatio } from "./spike"

export const POSTER_EXPORT_SCALE = 2
export const POSTER_QR_MIN_SIZE = 160

export type PosterSafeArea = {
  top: number
  right: number
  bottom: number
  left: number
}

export type PosterExportQualityInput = {
  ratio: PosterRatio
  publicUrl: string
  fontReady: boolean
  assetsReady: boolean
  safeArea: PosterSafeArea
  qr: { x: number; y: number; size: number }
}

export function validateCanonicalPosterUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.pathname.startsWith("/e/") && !url.search && !url.hash && !/owner[_-]?id|private|auth/i.test(url.href)
      : false
  } catch {
    return false
  }
}

export function getPosterQrFrame(ratio: PosterRatio) {
  const { width, height } = getPosterDimensions(ratio)
  const size = ratio === "4:5" ? 190 : 210
  return { x: width - size - 80, y: height - size - 80, size }
}
export function validatePosterExportQuality(input: PosterExportQualityInput) {
  const { width, height } = getPosterDimensions(input.ratio)
  const errors: string[] = []

  if (!validateCanonicalPosterUrl(input.publicUrl)) errors.push("URL mã QR phải là URL sự kiện công khai chuẩn")
  if (!input.fontReady) errors.push("Phông chữ chưa sẵn sàng")
  if (!input.assetsReady) errors.push("Một hoặc nhiều thành phần áp phích chưa sẵn sàng")
  if (input.qr.size < POSTER_QR_MIN_SIZE) errors.push(`QR must be at least ${POSTER_QR_MIN_SIZE}px`)
  if (
    input.qr.x < input.safeArea.left ||
    input.qr.y < input.safeArea.top ||
    input.qr.x + input.qr.size > width - input.safeArea.right ||
    input.qr.y + input.qr.size > height - input.safeArea.bottom
  ) {
    errors.push("Mã QR nằm ngoài vùng an toàn của áp phích")
  }

  return {
    success: errors.length === 0,
    errors,
    dimensions: { width, height },
    scale: POSTER_EXPORT_SCALE,
  } as const
}

export function posterExportFilename(title: string, ratio: PosterRatio) {
  const safeTitle = title
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "event"

  return `memoria-poster-${safeTitle}-${ratio.replace(":", "-")}.png`
}
