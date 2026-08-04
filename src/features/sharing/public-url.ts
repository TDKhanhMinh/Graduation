const PUBLIC_SLUG_PATTERN = /^[a-z0-9-]+$/

export type PublicEventUrlResult =
  | { ok: true; url: string }
  | { ok: false; error: string }

const INVALID_URL_MESSAGE = "Không thể tạo liên kết công khai cho sự kiện này."

export function buildPublicEventUrl(baseUrl: string, slug: string): string {
  const normalizedBaseUrl = baseUrl.trim()
  const normalizedSlug = slug.trim()

  if (!normalizedBaseUrl || !normalizedSlug || !PUBLIC_SLUG_PATTERN.test(normalizedSlug)) {
    throw new Error(INVALID_URL_MESSAGE)
  }

  let parsedBaseUrl: URL

  try {
    parsedBaseUrl = new URL(normalizedBaseUrl)
  } catch {
    throw new Error(INVALID_URL_MESSAGE)
  }

  if (
    !["http:", "https:"].includes(parsedBaseUrl.protocol) ||
    parsedBaseUrl.username ||
    parsedBaseUrl.password ||
    parsedBaseUrl.search ||
    parsedBaseUrl.hash
  ) {
    throw new Error(INVALID_URL_MESSAGE)
  }

  const basePath = parsedBaseUrl.pathname.replace(/\/+$/, "")

  return parsedBaseUrl.origin + basePath + "/e/" + encodeURIComponent(normalizedSlug)
}

export function resolvePublicEventUrl(baseUrl: string, slug: string): PublicEventUrlResult {
  try {
    return { ok: true, url: buildPublicEventUrl(baseUrl, slug) }
  } catch {
    return { ok: false, error: INVALID_URL_MESSAGE }
  }
}