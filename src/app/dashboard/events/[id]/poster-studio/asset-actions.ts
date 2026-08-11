"use server"

import { revalidatePath } from "next/cache"

import { getOwnedEventById } from "@/features/events/dal"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import {
  getOwnedPosterAssetLibrary,
  getOwnedPosterAssets,
  getOwnedPosterDocument,
} from "@/features/posters/dal"
import { searchPosterStock } from "@/features/posters/stock-provider"
import { posterAssetPath, POSTER_ASSET_BUCKET, validatePosterAssetUpload } from "@/features/posters/storage"
import { posterDocumentSchema, type PosterAsset } from "@/features/posters/schema"

function failure(error: string) {
  return { success: false as const, error }
}

export async function searchPosterStockAction(eventId: string, query: string, page = 1) {
  const event = await getOwnedEventById(eventId)
  if (!event) return { success: false as const, error: "Không tìm thấy sự kiện." }
  return { success: true as const, result: await searchPosterStock(query, page) }
}

export async function uploadPosterAsset(
  eventId: string,
  file: File,
  kind: PosterAsset["kind"] = "photo",
) {
  const event = await getOwnedEventById(eventId)
  if (!event) return failure("Bạn không có quyền tải asset cho sự kiện này.")

  const document = await getOwnedPosterDocument(eventId)
  if (!document) return failure("Hãy tạo bản nháp poster trước khi tải asset.")

  const bytes = new Uint8Array(await file.arrayBuffer())
  const validation = validatePosterAssetUpload({
    bytes,
    declaredMimeType: file.type,
  })
  if (!validation.success || !validation.mimeType) {
    return failure(validation.issues.join(" "))
  }

  const assetId = crypto.randomUUID()
  const storagePath = posterAssetPath({
    eventId,
    documentId: document.id,
    assetId,
    mimeType: validation.mimeType,
  })
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()
  const userClient = await createClient()
  const { data: sessionId, error: sessionError } = await userClient.rpc("create_poster_asset_upload_session", {
    p_event_id: eventId,
    p_document_id: document.id,
    p_asset_id: assetId,
    p_storage_path: storagePath,
    p_mime_type: validation.mimeType,
    p_max_size_bytes: bytes.byteLength,
    p_expires_at: expiresAt,
  })
  if (sessionError || !sessionId) return failure(sessionError?.message || "Không thể tạo phiên tải asset.")

  const admin = createAdminClient()
  const upload = await admin.storage.from(POSTER_ASSET_BUCKET).upload(storagePath, bytes, {
    contentType: validation.mimeType,
    upsert: false,
  })
  if (upload.error) {
    await admin.from("poster_asset_upload_sessions").delete().eq("id", sessionId)
    return failure("Tải asset lên storage thất bại.")
  }

  const { error: insertError } = await admin.from("poster_assets").insert({
    document_id: document.id,
    event_id: eventId,
    asset_id: assetId,
    asset_role: "upload",
    storage_bucket: POSTER_ASSET_BUCKET,
    storage_path: storagePath,
    mime_type: validation.mimeType,
    size_bytes: bytes.byteLength,
    metadata: {
      kind,
      originalName: file.name.slice(0, 180),
      external: {
        provider: "local",
        providerAssetId: assetId,
        attributionRequired: false,
      },
    },
    processing_status: "ready",
  })
  if (insertError) {
    await admin.storage.from(POSTER_ASSET_BUCKET).remove([storagePath])
    await admin.from("poster_asset_upload_sessions").delete().eq("id", sessionId)
    return failure("Không thể ghi metadata asset.")
  }

  await admin
    .from("poster_asset_upload_sessions")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", sessionId)

  revalidatePath("/dashboard/events/" + eventId + "/poster-studio")
  const assets = await getOwnedPosterAssetLibrary(eventId)
  const asset = assets.find((item) => item.asset.id === assetId)
  return asset ? { success: true as const, asset } : failure("Asset đã tải nhưng chưa thể đọc lại metadata.")
}

function referencesAsset(documentJson: unknown, assetId: string) {
  const parsed = posterDocumentSchema.safeParse(documentJson)
  if (!parsed.success) return false
  return parsed.data.assets.some((asset) => asset.id === assetId) ||
    parsed.data.elements.some((element) => "assetId" in element && element.assetId === assetId)
}

export async function deletePosterAsset(eventId: string, rowId: string) {
  const event = await getOwnedEventById(eventId)
  if (!event) return failure("Bạn không có quyền xóa asset này.")

  const rows = await getOwnedPosterAssets(eventId)
  const row = rows.find((candidate) => candidate.id === rowId)
  if (!row) return failure("Asset không tồn tại hoặc bạn không có quyền truy cập.")

  const document = await getOwnedPosterDocument(eventId)
  if (document && referencesAsset(document.document_json, row.asset_id)) {
    return failure("Asset đang được dùng trong poster; hãy thay thế nó trước khi xóa.")
  }

  const admin = createAdminClient()
  const { error: storageError } = await admin.storage.from(POSTER_ASSET_BUCKET).remove([row.storage_path])
  if (storageError) return failure("Không thể xóa file asset khỏi storage.")

  const { error } = await admin.from("poster_assets").delete().eq("id", row.id).eq("event_id", eventId)
  if (error) return failure("Không thể xóa metadata asset.")

  revalidatePath("/dashboard/events/" + eventId + "/poster-studio")
  return { success: true as const }
}

export async function togglePosterAssetFavorite(eventId: string, rowId: string, favorite: boolean) {
  const event = await getOwnedEventById(eventId)
  if (!event) return failure("Bạn không có quyền cập nhật asset này.")

  const rows = await getOwnedPosterAssets(eventId)
  const row = rows.find((candidate) => candidate.id === rowId)
  if (!row) return failure("Asset không tồn tại hoặc bạn không có quyền truy cập.")

  const metadata = row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
    ? row.metadata as Record<string, unknown>
    : {}
  const admin = createAdminClient()
  const { error } = await admin
    .from("poster_assets")
    .update({ metadata: { ...metadata, favorite } })
    .eq("id", row.id)
    .eq("event_id", eventId)
  if (error) return failure("Không thể cập nhật trạng thái yêu thích.")

  revalidatePath("/dashboard/events/" + eventId + "/poster-studio")
  return { success: true as const, favorite }
}
