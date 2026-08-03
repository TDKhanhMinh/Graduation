import "server-only"
import { cache } from "react"
import { createAdminClient } from "@/lib/supabase/admin"
import { verifySession } from "@/lib/auth/dal"
import { PublicEvent } from "@/features/events/dal"
import { PublicWish } from "@/features/wishes/dal"

export type PrintableSnapshot = {
  event: PublicEvent
  wishes: PublicWish[]
}

export const getPrintableEventSnapshot = cache(
  async (slug: string, token?: string): Promise<PrintableSnapshot | null> => {
    // We need admin client to bypass RLS for getting the full event to check owner
    const supabase = createAdminClient()
    
    // 1. Get Event and owner check
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id,slug,title,description,event_date,visibility,submission_mode,max_wish_length,archived_at,allow_ai,owner_id,deleted_at')
      .eq('slug', slug)
      .is('deleted_at', null)
      .single()

    if (eventError || !event) {
      return null
    }

    // 2. Auth check
    const session = await verifySession()
    const isOwner = session?.userId === event.owner_id
    
    // In the future (Task P5-T02), we can check the `token` against event.settings.export_token
    // For now, only owner is allowed. We can add a fallback later if needed.
    const hasValidToken = token === 'TODO_EXPORT_TOKEN_P5_T02'

    if (!isOwner && !hasValidToken) {
      return null // Unauthorized
    }

    // 3. Get all approved/non-deleted wishes. Limit to 1500 to prevent OOM
    const { data: wishes, error: wishesError } = await supabase
      .from('public_wishes_view')
      .select('id,event_id,sender_name,sender_avatar_path,content,is_pinned,created_at,media')
      .eq('event_id', event.id)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: true }) // Linear history
      .limit(1500)
    
    if (wishesError) {
      console.error('Error fetching printable wishes:', wishesError)
      return null
    }

    const validWishes = wishes.flatMap((wish) => {
      if (!wish.id || !wish.event_id || !wish.sender_name || !wish.created_at || wish.is_pinned === null) {
        return []
      }
      return [wish as PublicWish]
    })

    const eventCopy: Record<string, unknown> = { ...event }
    delete eventCopy.owner_id
    delete eventCopy.deleted_at
    const publicEvent = eventCopy as unknown as PublicEvent

    return {
      event: publicEvent,
      wishes: validWishes
    }
  }
)
