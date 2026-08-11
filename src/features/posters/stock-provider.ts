import "server-only"

import type { PosterStockAsset, PosterStockSearchResult } from "./stock-contract"

const PAGE_SIZE = 12

const localStock: PosterStockAsset[] = [
  {
    id: "local-graduation-01",
    title: "Ánh sáng lễ tốt nghiệp",
    previewUrl: "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=900&q=80",
    sourceUrl: "https://unsplash.com/photos/1523580846011-d3a5bc25702b",
    photographerName: "Unsplash community",
    provider: "local",
    attributionRequired: true,
  },
  {
    id: "local-graduation-02",
    title: "Khoảnh khắc vinh danh",
    previewUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=80",
    sourceUrl: "https://unsplash.com/photos/1523050854058-8df90110c9f1",
    photographerName: "Unsplash community",
    provider: "local",
    attributionRequired: true,
  },
  {
    id: "local-paper-01",
    title: "Nền giấy màu ấm",
    previewUrl: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=80",
    sourceUrl: "https://unsplash.com/photos/1513364776144-60967b0f800f",
    photographerName: "Unsplash community",
    provider: "local",
    attributionRequired: true,
  },
  {
    id: "local-celebration-01",
    title: "Bong bóng lễ hội",
    previewUrl: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=900&q=80",
    sourceUrl: "https://unsplash.com/photos/1530103862676-de8c9debad1d",
    photographerName: "Unsplash community",
    provider: "local",
    attributionRequired: true,
  },
]

function localFallback(query: string, page: number, notice?: string): PosterStockSearchResult {
  const normalized = query.trim().toLowerCase()
  const filtered = normalized
    ? localStock.filter((asset) => asset.title.toLowerCase().includes(normalized))
    : localStock
  const start = (page - 1) * PAGE_SIZE
  return {
    items: filtered.slice(start, start + PAGE_SIZE),
    page,
    hasMore: start + PAGE_SIZE < filtered.length,
    source: "local",
    notice: notice ?? "Đang dùng thư viện local vì provider chưa được cấu hình.",
  }
}

export async function searchPosterStock(query: string, page = 1): Promise<PosterStockSearchResult> {
  const safePage = Number.isInteger(page) && page > 0 ? page : 1
  const apiKey = process.env.PEXELS_API_KEY?.trim()
  if (!apiKey) return localFallback(query, safePage)

  try {
    const response = await fetch(
      "https://api.pexels.com/v1/search?query=" + encodeURIComponent(query.trim() || "graduation") + "&per_page=" + PAGE_SIZE + "&page=" + safePage,
      {
        headers: { Authorization: apiKey },
        next: { revalidate: 300 },
      },
    )
    if (!response.ok) return localFallback(query, safePage, "Provider tạm thời không khả dụng; đã chuyển sang local fallback.")

    const payload = (await response.json()) as {
      photos?: Array<{
        id: number
        alt?: string
        url: string
        photographer?: string
        photographer_url?: string
        src?: { medium?: string; large?: string }
      }>
      next_page?: string
    }
    const items = (payload.photos ?? []).flatMap((photo) => {
      const previewUrl = photo.src?.large ?? photo.src?.medium
      if (!previewUrl || !photo.url) return []
      return [{
        id: "pexels-" + photo.id,
        title: photo.alt?.trim() || "Pexels stock image",
        previewUrl,
        sourceUrl: photo.url,
        photographerName: photo.photographer,
        photographerUrl: photo.photographer_url,
        provider: "pexels" as const,
        attributionRequired: true,
      }]
    })
    return { items, page: safePage, hasMore: Boolean(payload.next_page), source: "provider" }
  } catch {
    return localFallback(query, safePage, "Không thể kết nối provider; đã chuyển sang local fallback.")
  }
}
