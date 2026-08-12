"use server"

import { revalidatePath } from "next/cache"
import { requireEventCapability } from "@/features/collaboration/access"
import { bulkModerateWishes } from "@/features/wishes/moderation"
import { type BulkModerationInput } from "@/features/wishes/moderation-schema"

export async function submitBulkModeration(eventId: string, input: BulkModerationInput) {
  try {
    if (!await requireEventCapability(eventId, 'moderation')) {
      return { success: false, error: "Bạn không có quyền kiểm duyệt sự kiện này." }
    }
    const result = await bulkModerateWishes(input)
    
    // Revalidate the moderation page
    revalidatePath(`/dashboard/events/${eventId}/moderation`)
    
    // Also revalidate the public event page if it exists
    revalidatePath(`/events/${eventId}`)
    
    return { success: true, count: result.length }
  } catch (error: unknown) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to moderate wishes." 
    }
  }
}
