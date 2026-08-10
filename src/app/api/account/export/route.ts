import { NextResponse } from 'next/server'

import { verifySession } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import {
  ACCOUNT_EXPORT_VERSION,
  personalDataExportSchema,
  redactPersonalDataExport,
} from '@/features/account/lifecycle'

export async function GET() {
  const session = await verifySession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const [{ data: profile }, { data: events, error: eventError }] = await Promise.all([
    supabase.from('profiles').select('display_name,avatar_url').eq('id', session.userId).maybeSingle(),
    supabase
      .from('events')
      .select('id,slug,title,description,event_date,starts_at,ends_at,timezone,visibility,created_at')
      .eq('owner_id', session.userId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true }),
  ])

  if (eventError) {
    return NextResponse.json({ error: 'Export unavailable' }, { status: 503 })
  }

  const eventIds = (events ?? []).map((event) => event.id)
  const { data: wishes, error: wishError } = eventIds.length
    ? await supabase
      .from('wishes')
      .select('id,event_id,sender_name,content,moderation_status,created_at')
      .in('event_id', eventIds)
      .order('created_at', { ascending: true })
    : { data: [], error: null }

  if (wishError) {
    return NextResponse.json({ error: 'Export unavailable' }, { status: 503 })
  }

  const candidate = {
    schema_version: ACCOUNT_EXPORT_VERSION,
    generated_at: new Date().toISOString(),
    profile: {
      display_name: profile?.display_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
    },
    events: events ?? [],
    wishes: wishes ?? [],
  }
  const parsed = personalDataExportSchema.safeParse(candidate)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Export unavailable' }, { status: 503 })
  }

  return NextResponse.json(redactPersonalDataExport(parsed.data), {
    headers: {
      'Cache-Control': 'private, no-store',
      'Content-Disposition': 'attachment; filename=memoria-account-export.json',
    },
  })
}
