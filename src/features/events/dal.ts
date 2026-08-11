import "server-only"
import { connection } from "next/server"
import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { verifySession } from "@/lib/auth/dal"
import { createError } from "@/lib/observability/error"
import { logger } from "@/lib/observability/logger"
import { Database } from "@/types/database"
import { normalizeWelcomeHeroConfig, type WelcomeHeroConfig } from "./welcome-config"

type Event = Database['public']['Tables']['events']['Row']
export type PublicEvent = Pick<
  Event,
  | 'id'
  | 'slug'
  | 'title'
  | 'description'
  | 'event_date'
  | 'starts_at'
  | 'ends_at'
  | 'timezone'
  | 'location_name'
  | 'location_address'
  | 'host_name'
  | 'host_title'
  | 'cover_path'
  | 'theme_key'
  | 'experience_preset'
  | 'effect_intensity'
  | 'effect_quality'
  | 'wall_layout'
  | 'qr_visible'
  | 'qr_cta'
  | 'animation_speed'
  | 'visibility'
  | 'submission_mode'
  | 'max_wish_length'
  | 'archived_at'
  | 'allow_ai'
> & { welcome_hero: WelcomeHeroConfig }

const PUBLIC_EVENT_SELECT =
  'id,slug,title,description,event_date,starts_at,ends_at,timezone,location_name,location_address,host_name,host_title,cover_path,theme_key,experience_preset,effect_intensity,effect_quality,wall_layout,qr_visible,qr_cta,animation_speed,welcome_hero,visibility,submission_mode,max_wish_length,archived_at,allow_ai'

export const getOwnedEvents = cache(async (): Promise<Event[]> => {
  const session = await verifySession()
  if (!session) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('owner_id', session.userId)
    .is('deleted_at', null)
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
    .is('deleted_at', null)
    .single()

  if (error) return null

  return data
})

export const getPublicEventBySlug = cache(async (slug: string): Promise<PublicEvent | null> => {
  // Link-only event pages must not be prerendered or shared from a route cache.
  await connection()
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('events')
    .select(PUBLIC_EVENT_SELECT)
    .eq('slug', slug)
    .in('visibility', ['public', 'unlisted'])
    .is('deleted_at', null)
    .is('archived_at', null)
    .single()

  if (error?.code === "PGRST116") return null
  if (error) {
    logger.error("Public event query failed", error, {
      surface: "action",
      resource: "public-event",
      route: "/e/[slug]",
    })
    throw createError("INTERNAL_SERVER_ERROR", "Không thể tải sự kiện lúc này.")
  }
  if (!data) return null

  return {
    ...data,
    welcome_hero: normalizeWelcomeHeroConfig(data.welcome_hero, data),
  }
})
