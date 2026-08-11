import type { PosterAsset } from "./schema"

export type PosterAssetLibraryItem = {
  id: string
  asset: PosterAsset
  previewUrl: string | null
  createdAt: string
  isFavorite: boolean
}
