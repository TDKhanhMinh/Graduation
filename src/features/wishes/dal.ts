import "server-only"
import { connection } from "next/server"
import { cache } from "react"
import { createAdminClient } from "@/lib/supabase/admin"
import { Database } from "@/types/database"

export type Wish = Database['public']['Tables']['wishes']['Row']
export type PublicWish = Pick<
  Wish,
  | 'id'
  | 'event_id'
  | 'sender_name'
  | 'sender_avatar_path'
  | 'content'
  | 'is_pinned'
  | 'created_at'
> & {
  media?: {
    path: string;
    type: 'image' | 'audio';
    mime_type: string;
    width?: number;
    height?: number;
    duration_ms?: number;
  } | null
  reactions?: import('@/features/reactions/dal').ReactionCount[]
}

type PublicWishCursor = {
  created_at: string
  id: string
  is_pinned: boolean
}

export const getApprovedWishesPage = cache(async (
  eventId: string, 
  limit: number = 20, 
  cursor?: PublicWishCursor
) => {
  // Server data may be requested from a public link or a Server Action. Keep
  // it at request time so unlisted projections never enter a shared prerender.
  await connection()
  const supabase = createAdminClient()
  
  let query = supabase
    .from('public_wishes_view')
    .select('id,event_id,sender_name,sender_avatar_path,content,is_pinned,created_at,media')
    .eq('event_id', eventId)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit)

  if (cursor) {
    query = query.or(
      [
        `is_pinned.lt.${cursor.is_pinned}`,
        `and(is_pinned.eq.${cursor.is_pinned},created_at.lt.${cursor.created_at})`,
        `and(is_pinned.eq.${cursor.is_pinned},created_at.eq.${cursor.created_at},id.lt.${cursor.id})`,
      ].join(',')
    )
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching wishes:', error)
    return []
  }

  const validWishes = data.flatMap((wish) => {
    if (
      !wish.id ||
      !wish.event_id ||
      !wish.sender_name ||
      !wish.created_at ||
      wish.is_pinned === null
    ) {
      return []
    }

    return [wish as PublicWish]
  })
  
  const wishIds = validWishes.map(w => w.id)
  const reactionsBatch = await import("@/features/reactions/batch").then(m => m.getReactionCountsBatch(wishIds))
  
  return validWishes.map(wish => ({
    ...wish,
    reactions: reactionsBatch[wish.id] || []
  }))
})
