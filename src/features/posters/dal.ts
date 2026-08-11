import "server-only"

import { cache } from "react"

import { getOwnedEventById } from "@/features/events/dal"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import type { Json, Database } from "@/types/database"

import { posterAssetSchema, posterDocumentSchema } from "./schema"
import type { PosterAssetLibraryItem } from "./library-contract"
import { POSTER_ASSET_BUCKET } from "./storage"

type PosterDocumentRow = Database["public"]["Tables"]["poster_documents"]["Row"]
type PosterAssetRow = Database["public"]["Tables"]["poster_assets"]["Row"]

export class PosterDocumentConflictError extends Error {
  constructor() {
    super("Poster document was changed by another session")
    this.name = "PosterDocumentConflictError"
  }
}

export const getOwnedPosterDocument = cache(async (eventId: string): Promise<PosterDocumentRow | null> => {
  const event = await getOwnedEventById(eventId)
  if (!event) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("poster_documents")
    .select("*")
    .eq("event_id", event.id)
    .maybeSingle()

  if (error) {
    console.error("Error fetching owned poster document:", error.message, error.details, error.hint, error.code)
    return null
  }

  return data
})

export async function saveOwnedPosterDocument(input: {
  eventId: string
  document: unknown
  expectedRevision?: number
  thumbnailPath?: string | null
  exportPath?: string | null
}) {
  const document = posterDocumentSchema.parse(input.document)
  if (document.metadata.eventId !== input.eventId) {
    throw new Error("Poster document event metadata does not match the route event")
  }

  const event = await getOwnedEventById(input.eventId)
  if (!event) throw new Error("Event not found")

  const supabase = await createClient()
  const { data: existing, error: existingError } = await supabase
    .from("poster_documents")
    .select("id, revision")
    .eq("event_id", event.id)
    .maybeSingle()

  if (existingError) throw new Error(existingError.message)

  if (existing) {
    if (input.expectedRevision !== existing.revision) {
      throw new PosterDocumentConflictError()
    }

    const nextRevision = existing.revision + 1
    const { data, error } = await supabase
      .from("poster_documents")
      .update({
        document_version: document.version,
        template_id: document.templateId,
        template_version: document.templateVersion,
        ratio: document.ratio,
        document_json: document as unknown as Json,
        revision: nextRevision,
        thumbnail_path: input.thumbnailPath ?? null,
        export_path: input.exportPath ?? null,
      })
      .eq("id", existing.id)
      .eq("revision", existing.revision)
      .select("*")
      .maybeSingle()

    if (error) throw new Error(error.message)
    if (!data) throw new PosterDocumentConflictError()
    return data
  }

  if (input.expectedRevision !== undefined && input.expectedRevision !== 0) {
    throw new PosterDocumentConflictError()
  }

  const { data, error } = await supabase
    .from("poster_documents")
    .insert({
      event_id: event.id,
      document_version: document.version,
      template_id: document.templateId,
      template_version: document.templateVersion,
      ratio: document.ratio,
      document_json: document as unknown as Json,
      revision: 1,
      thumbnail_path: input.thumbnailPath ?? null,
      export_path: input.exportPath ?? null,
    })
    .select("*")
    .maybeSingle()

  if (error) {
    if (error.code === "23505") throw new PosterDocumentConflictError()
    throw new Error(error.message)
  }
  return data
}

export async function deleteOwnedPosterDocument(eventId: string) {
  const event = await getOwnedEventById(eventId)
  if (!event) return false

  const supabase = await createClient()
  const { error } = await supabase
    .from("poster_documents")
    .delete()
    .eq("event_id", event.id)

  if (error) throw new Error(error.message)
  return true
}

export const getOwnedPosterAssets = cache(async (eventId: string): Promise<PosterAssetRow[]> => {
  const event = await getOwnedEventById(eventId)
  if (!event) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("poster_assets")
    .select("*")
    .eq("event_id", event.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching owned poster assets:", error.message, error.details, error.hint, error.code)
    return []
  }

  return data
})




function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export async function getOwnedPosterAssetLibrary(eventId: string): Promise<PosterAssetLibraryItem[]> {
  const rows = await getOwnedPosterAssets(eventId)
  if (!rows.length) return []

  let signedUrls = new Map<string, string>()
  try {
    const admin = createAdminClient()
    const result = await admin.storage
      .from(POSTER_ASSET_BUCKET)
      .createSignedUrls(rows.map((row) => row.storage_path), 3600)
    signedUrls = new Map(
      (result.data ?? []).flatMap((item) => item.path && item.signedUrl ? [[item.path, item.signedUrl] as const] : []),
    )
  } catch {
    // The library remains usable with metadata when signed previews are unavailable.
  }

  return rows.flatMap((row) => {
    const metadata = isRecord(row.metadata) ? row.metadata : {}
    const parsed = posterAssetSchema.safeParse({
      id: row.asset_id,
      kind: metadata.kind ?? "photo",
      mimeType: row.mime_type,
      width: row.width ?? undefined,
      height: row.height ?? undefined,
      path: row.storage_path,
      external: metadata.external ?? {
        provider: "local",
        providerAssetId: row.asset_id,
        attributionRequired: false,
      },
    })
    if (!parsed.success) return []

    return [{
      id: row.id,
      asset: parsed.data,
      previewUrl: signedUrls.get(row.storage_path) ?? null,
      createdAt: row.created_at,
      isFavorite: metadata.favorite === true,
    }]
  })
}