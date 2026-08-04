import QRCode from "qrcode"

export const QR_CODE_SIZE = 256
export const QR_CODE_ERROR_MESSAGE = "Không thể tạo mã QR lúc này."

export function createQrDataUrl(value: string, size = QR_CODE_SIZE): Promise<string> {
  const normalizedValue = value.trim()

  if (!normalizedValue) {
    return Promise.reject(new Error(QR_CODE_ERROR_MESSAGE))
  }

  return QRCode.toDataURL(normalizedValue, {
    width: size,
    margin: 2,
    errorCorrectionLevel: "M",
    color: {
      dark: "#111827",
      light: "#ffffff",
    },
  })
}

function sanitizeFilenamePart(value: string, fallback: string) {
  const sanitized = value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()

  return sanitized || fallback
}

export function buildQrFilename(title: string, slug: string) {
  return "memoria-" + sanitizeFilenamePart(title, sanitizeFilenamePart(slug, "event")) + "-qr.png"
}