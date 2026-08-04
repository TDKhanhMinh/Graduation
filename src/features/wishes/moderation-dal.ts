import "server-only"
import { cache } from "react"
import { createAdminClient } from "@/lib/supabase/admin"
import { type Wish } from "./dal"

export type ModerationWish = Pick<
  Wish,
  | 'id'
  | 'event_id'
  | 'sender_name'
  | 'sender_avatar_path'
  | 'content'
  | 'moderation_status'
  | 'is_pinned'
  | 'created_at'
  | 'updated_at'
> & {
  media?: {
    storage_path: string;
    media_type: 'image' | 'audio';
    mime_type: string;
    width?: number;
    height?: number;
    duration_ms?: number;
  } | null
}

export type AuditLog = {
  id: number
  event_id: string
  wish_id: string | null
  actor_id: string | null
  action: string
  old_value: unknown
  new_value: unknown
  created_at: string
}

export type ModerationFilters = {
  status?: string
  search?: string
  dateFrom?: string
  dateTo?: string
}

export const getModerationQueue = cache(async (
  eventId: string,
  filters: ModerationFilters,
  limit: number = 50,
  offset: number = 0
) => {
  const supabase = createAdminClient()
  
  let query = supabase
    .from('wishes')
    .select('id,event_id,sender_name,sender_avatar_path,content,moderation_status,is_pinned,created_at,updated_at,media:wish_media(storage_path,media_type,mime_type,width,height,duration_ms)', { count: 'exact' })
    .eq('event_id', eventId)
    .is('deleted_at', null)

  if (filters.status) {
    query = query.eq('moderation_status', filters.status)
  }
  
  if (filters.search) {
    query = query.or(`sender_name.ilike.%${filters.search}%,content.ilike.%${filters.search}%`)
  }

  if (filters.dateFrom) {
    query = query.gte('created_at', filters.dateFrom)
  }

  if (filters.dateTo) {
    const dateToExclusive = new Date(`${filters.dateTo}T00:00:00.000Z`)
    dateToExclusive.setUTCDate(dateToExclusive.getUTCDate() + 1)
    query = query.lt('created_at', dateToExclusive.toISOString())
  }

  // Use offset pagination for queue management as rows might shift
  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Error fetching moderation queue:', error)
    return { data: [], count: 0 }
  }

  const mappedData = data.map((wish: Record<string, unknown>) => ({
    ...wish,
    media: Array.isArray(wish.media) ? (wish.media as Record<string, unknown>[])[0] || null : null
  }))

  return { data: mappedData as unknown as ModerationWish[], count: count || 0 }
})

export const getAuditHistory = cache(async (
  eventId: string,
  limit: number = 20
) => {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('moderation_audit_logs')
    .select('id,event_id,wish_id,actor_id,action,old_value,new_value,created_at')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching audit history:', error)
    return []
  }

  return data as AuditLog[]
})
