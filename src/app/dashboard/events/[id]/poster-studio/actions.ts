"use server"

import { revalidatePath } from "next/cache"

import { PosterDocumentConflictError, saveOwnedPosterDocument } from "@/features/posters/dal"

export async function savePosterDocument(
  eventId: string,
  document: unknown,
  expectedRevision: number,
) {
  try {
    const saved = await saveOwnedPosterDocument({ eventId, document, expectedRevision })
    revalidatePath("/dashboard/events/" + eventId + "/poster-studio")
    return { success: true as const, revision: saved?.revision ?? expectedRevision + 1 }
  } catch (error) {
    if (error instanceof PosterDocumentConflictError) {
      return { success: false as const, conflict: true as const, error: error.message }
    }
    return {
      success: false as const,
      conflict: false as const,
      error: error instanceof Error ? error.message : "Could not save the poster document.",
    }
  }
}