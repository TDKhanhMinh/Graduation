export type PosterStockAsset = {
  id: string
  title: string
  previewUrl: string
  sourceUrl: string
  photographerName?: string
  photographerUrl?: string
  provider: "pexels" | "unsplash" | "local"
  attributionRequired: boolean
}

export type PosterStockSearchResult = {
  items: PosterStockAsset[]
  page: number
  hasMore: boolean
  source: "provider" | "local"
  notice?: string
}
