import "server-only"

import { posterAssetSchema, type ExternalAssetReference, type PosterAsset } from "./schema"

export type StockImageResult = {
  id: string
  previewUrl: string
  downloadUrl: string
  width: number
  height: number
  attribution: ExternalAssetReference
}

export type StockImageSearchResult = {
  images: StockImageResult[]
  fallback: boolean
  error?: "not_configured" | "rate_limited" | "provider_error"
}

export type StockImageProvider = {
  name: "local" | "pexels"
  search(query: string, options?: { page?: number; perPage?: number }): Promise<StockImageSearchResult>
}

export function toPosterAsset(result: StockImageResult, kind: PosterAsset["kind"] = "photo") {
  return posterAssetSchema.parse({
    id: `${result.attribution.provider}-${result.id}`,
    kind,
    mimeType: "image/jpeg",
    width: result.width,
    height: result.height,
    path: result.downloadUrl,
    external: result.attribution,
  })
}

const localProvider: StockImageProvider = {
  name: "local",
  async search() {
    return { images: [], fallback: true, error: "not_configured" }
  },
}

export function createLocalStockProvider() {
  return localProvider
}

type PexelsResponse = {
  photos?: Array<{
    id: number
    width: number
    height: number
    photographer: string
    photographer_url: string
    src: { medium?: string; original?: string }
  }>
}

export function createPexelsStockProvider(config?: {
  apiKey?: string
  fetchImpl?: typeof fetch
  minIntervalMs?: number
  now?: () => number
}): StockImageProvider {
  const apiKey = config?.apiKey ?? process.env.PEXELS_API_KEY
  const fetchImpl = config?.fetchImpl ?? fetch
  const minIntervalMs = config?.minIntervalMs ?? 1000
  const now = config?.now ?? Date.now
  const cache = new Map<string, { expiresAt: number; result: StockImageSearchResult }>()
  let lastRequestAt = 0

  return {
    name: "pexels",
    async search(query, options = {}) {
      if (!apiKey) return { images: [], fallback: true, error: "not_configured" }
      const page = options.page ?? 1
      const perPage = Math.min(80, Math.max(1, options.perPage ?? 12))
      const cacheKey = `${query.trim().toLowerCase()}|${page}|${perPage}`
      const cached = cache.get(cacheKey)
      if (cached && cached.expiresAt > now()) return cached.result
      if (now() - lastRequestAt < minIntervalMs) return { images: [], fallback: true, error: "rate_limited" }

      lastRequestAt = now()
      try {
        const response = await fetchImpl(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`, {
          headers: { Authorization: apiKey },
        })
        if (response.status === 429) return { images: [], fallback: true, error: "rate_limited" }
        if (!response.ok) return { images: [], fallback: true, error: "provider_error" }

        const payload = await response.json() as PexelsResponse
        const images = (payload.photos ?? []).flatMap((photo) => {
          if (!photo.src.medium || !photo.src.original) return []
          return [{
            id: String(photo.id),
            previewUrl: photo.src.medium,
            downloadUrl: photo.src.original,
            width: photo.width,
            height: photo.height,
            attribution: {
              provider: "pexels" as const,
              providerAssetId: String(photo.id),
              sourceUrl: photo.src.original,
              photographerName: photo.photographer,
              photographerUrl: photo.photographer_url,
              attributionRequired: true,
            },
          }]
        })
        const result = { images, fallback: false } satisfies StockImageSearchResult
        cache.set(cacheKey, { expiresAt: now() + 60_000, result })
        return result
      } catch {
        return { images: [], fallback: true, error: "provider_error" }
      }
    },
  }
}

