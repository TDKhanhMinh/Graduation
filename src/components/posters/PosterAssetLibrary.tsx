"use client"

import { ExternalLink, Heart, Search, Trash2, Upload } from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "sonner"

import {
  deletePosterAsset,
  searchPosterStockAction,
  togglePosterAssetFavorite,
  uploadPosterAsset,
} from "@/app/dashboard/events/[id]/poster-studio/asset-actions"
import type { PosterAssetLibraryItem } from "@/features/posters/library-contract"
import { posterAssetSchema, type PosterAsset } from "@/features/posters/schema"
import type { PosterStockAsset } from "@/features/posters/stock-contract"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type PosterAssetLibraryProps = {
  eventId: string
  initialAssets: PosterAssetLibraryItem[]
  onSelectAsset: (asset: PosterAsset) => void
}

function stockToPosterAsset(asset: PosterStockAsset): PosterAsset {
  return posterAssetSchema.parse({
    id: asset.id,
    kind: "photo",
    mimeType: "image/jpeg",
    path: "stock://" + asset.provider + "/" + asset.id,
    external: {
      provider: asset.provider,
      providerAssetId: asset.id,
      sourceUrl: asset.sourceUrl,
      photographerName: asset.photographerName,
      photographerUrl: asset.photographerUrl,
      attributionRequired: asset.attributionRequired,
    },
  })
}

function AssetPreview({
  src,
  alt,
}: {
  src: string | null
  alt: string
}) {
  if (!src) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center bg-muted px-3 text-center text-xs text-muted-foreground">
        Preview riêng tư chưa sẵn sàng
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- signed private preview and external stock URL are runtime-selected.
    <img src={src} alt={alt} className="aspect-[4/3] w-full object-cover" loading="lazy" />
  )
}

export function PosterAssetLibrary({
  eventId,
  initialAssets,
  onSelectAsset,
}: PosterAssetLibraryProps) {
  const [assets, setAssets] = useState(initialAssets)
  const [stockAssets, setStockAssets] = useState<PosterStockAsset[]>([])
  const [stockNotice, setStockNotice] = useState("")
  const [query, setQuery] = useState("")
  const [kind, setKind] = useState<PosterAsset["kind"]>("photo")
  const [busyId, setBusyId] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(file: File | undefined) {
    if (!file) return
    setIsUploading(true)
    try {
      const result = await uploadPosterAsset(eventId, file, kind)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setAssets((current) => [result.asset, ...current])
      onSelectAsset(result.asset.asset)
      toast.success("Đã tải asset và thêm vào PosterDocument.")
    } catch {
      toast.error("Không thể tải asset. Hãy thử lại.")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  async function handleSearch() {
    setIsSearching(true)
    try {
      const result = await searchPosterStockAction(eventId, query, 1)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setStockAssets(result.result.items)
      setStockNotice(result.result.notice ?? "")
    } catch {
      toast.error("Không thể tìm stock provider.")
    } finally {
      setIsSearching(false)
    }
  }

  async function handleFavorite(item: PosterAssetLibraryItem) {
    setBusyId(item.id)
    try {
      const result = await togglePosterAssetFavorite(eventId, item.id, !item.isFavorite)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setAssets((current) => current.map((candidate) => (
        candidate.id === item.id ? { ...candidate, isFavorite: result.favorite } : candidate
      )))
    } finally {
      setBusyId("")
    }
  }

  async function handleDelete(item: PosterAssetLibraryItem) {
    if (!window.confirm("Xóa asset này khỏi thư viện?")) return
    setBusyId(item.id)
    try {
      const result = await deletePosterAsset(eventId, item.id)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setAssets((current) => current.filter((candidate) => candidate.id !== item.id))
      toast.success("Đã xóa asset.")
    } finally {
      setBusyId("")
    }
  }

  return (
    <Card aria-labelledby="poster-asset-library">
      <CardHeader>
        <CardTitle id="poster-asset-library">Asset Library</CardTitle>
        <CardDescription>
          Asset private theo event/document. Chọn một asset để thêm reference versioned vào PosterDocument.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-3 rounded-xl border border-dashed border-border p-4 sm:flex-row sm:items-end">
          <div className="grid flex-1 gap-1.5">
            <label htmlFor="poster-asset-kind" className="text-xs font-medium text-muted-foreground">
              Vai trò asset
            </label>
            <select
              id="poster-asset-kind"
              value={kind}
              onChange={(event) => setKind(event.target.value as PosterAsset["kind"])}
              className="min-h-(--control-min-size) rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="photo">Ảnh</option>
              <option value="background">Nền</option>
              <option value="logo">Logo</option>
              <option value="decoration">Trang trí</option>
            </select>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => void handleUpload(event.target.files?.[0])}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload aria-hidden="true" />
            {isUploading ? "Đang tải..." : "Tải ảnh lên"}
          </Button>
          <p className="text-xs leading-5 text-muted-foreground sm:max-w-xs">
            JPG, PNG hoặc WebP · tối đa 10 MB · kiểm tra magic byte ở server.
          </p>
        </div>

        <section aria-labelledby="poster-local-assets-heading">
          <div className="flex items-baseline justify-between gap-3">
            <h3 id="poster-local-assets-heading" className="font-medium">Asset của sự kiện</h3>
            <span className="text-xs text-muted-foreground">{assets.length} asset</span>
          </div>
          {assets.length === 0 ? (
            <p className="mt-3 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              Chưa có asset upload. Bạn vẫn có thể tìm ảnh local fallback bên dưới.
            </p>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {assets.map((item) => (
                <div key={item.id} className="overflow-hidden rounded-xl border border-border bg-background">
                  <button
                    type="button"
                    className="block w-full text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    onClick={() => onSelectAsset(item.asset)}
                    aria-label={"Chọn asset " + item.asset.id}
                  >
                    <AssetPreview src={item.previewUrl} alt={"Asset " + item.asset.id} />
                    <span className="block truncate px-3 pt-2 text-sm font-medium">{item.asset.kind}</span>
                  </button>
                  <div className="flex items-center justify-between gap-2 px-3 pb-3 pt-2">
                    <span className="truncate text-[11px] text-muted-foreground">{item.asset.mimeType}</span>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                        onClick={() => void handleFavorite(item)}
                        disabled={busyId === item.id}
                        aria-label={item.isFavorite ? "Bỏ yêu thích" : "Yêu thích"}
                        aria-pressed={item.isFavorite}
                      >
                        <Heart aria-hidden="true" className={"size-4 " + (item.isFavorite ? "fill-current text-primary" : "")} />
                      </button>
                      <button
                        type="button"
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                        onClick={() => void handleDelete(item)}
                        disabled={busyId === item.id}
                        aria-label="Xóa asset"
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="poster-stock-heading" className="space-y-3">
          <div>
            <h3 id="poster-stock-heading" className="font-medium">Stock provider</h3>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              Provider key chỉ chạy ở server; mỗi kết quả giữ source và attribution để draft không mất license context.
            </p>
          </div>
          <div className="flex gap-2">
            <label htmlFor="poster-stock-query" className="sr-only">Tìm stock image</label>
            <input
              id="poster-stock-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  void handleSearch()
                }
              }}
              placeholder="Ví dụ: graduation, paper, celebration"
              className="min-h-(--control-min-size) min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <Button type="button" variant="outline" onClick={() => void handleSearch()} disabled={isSearching}>
              <Search aria-hidden="true" />
              {isSearching ? "Đang tìm..." : "Tìm"}
            </Button>
          </div>
          {stockNotice ? <p role="status" className="text-xs leading-5 text-muted-foreground">{stockNotice}</p> : null}
          {stockAssets.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {stockAssets.map((asset) => (
                <div key={asset.id} className="overflow-hidden rounded-xl border border-border bg-background">
                  <button
                    type="button"
                    className="block w-full text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    onClick={() => onSelectAsset(stockToPosterAsset(asset))}
                    aria-label={"Chọn stock asset " + asset.title}
                  >
                    <AssetPreview src={asset.previewUrl} alt={asset.title} />
                    <span className="block truncate px-3 pt-2 text-sm font-medium">{asset.title}</span>
                  </button>
                  <div className="flex items-center justify-between gap-2 px-3 pb-3 pt-2">
                    <span className="truncate text-[11px] text-muted-foreground">
                      {asset.photographerName ?? asset.provider}
                    </span>
                    <a
                      href={asset.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      aria-label="Mở nguồn attribution"
                    >
                      <ExternalLink aria-hidden="true" className="size-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      </CardContent>
    </Card>
  )
}
