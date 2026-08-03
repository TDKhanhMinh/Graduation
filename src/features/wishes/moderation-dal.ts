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
>

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
    .select('id,event_id,sender_name,sender_avatar_path,content,moderation_status,is_pinned,created_at,updated_at', { count: 'exact' })
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
    query = query.lte('created_at', filters.dateTo)
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

  return { data: data as ModerationWish[], count: count || 0 }
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
