import "server-only"
import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { verifySession } from "@/lib/auth/dal"
import { Database } from "@/types/database"

type Event = Database['public']['Tables']['events']['Row']
export type PublicEvent = Pick<
  Event,
  | 'id'
  | 'slug'
  | 'title'
  | 'description'
  | 'event_date'
  | 'visibility'
  | 'submission_mode'
  | 'max_wish_length'
  | 'archived_at'
>

const PUBLIC_EVENT_SELECT =
  'id,slug,title,description,event_date,visibility,submission_mode,max_wish_length,archived_at'

export const getOwnedEvents = cache(async (): Promise<Event[]> => {
  const session = await verifySession()
  if (!session) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('owner_id', session.userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching owned events:', error)
    return []
  }

  return data
})

export const getOwnedEventById = cache(async (id: string): Promise<Event | null> => {
  const session = await verifySession()
  if (!session) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .eq('owner_id', session.userId)
    .single()

  if (error) return null

  return data
})

export const getPublicEventBySlug = cache(async (slug: string): Promise<PublicEvent | null> => {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('events')
    .select(PUBLIC_EVENT_SELECT)
    .eq('slug', slug)
    .in('visibility', ['public', 'unlisted'])
    .is('deleted_at', null)
    .single()

  if (error) return null

  return data
})
