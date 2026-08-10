import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'

import { directorSnapshotSchema, type DirectorSnapshot } from './protocol'
import { hashDirectorSessionToken } from './session-token'

export type DirectorDisplaySession = {
  eventId: string
  version: number
  snapshot: DirectorSnapshot
  updatedAt: string
}

export async function getDirectorDisplaySession(
  sessionId: string,
  token: string,
): Promise<DirectorDisplaySession | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.rpc('get_director_display_session', {
    p_session_id: sessionId,
    p_display_token_hash: hashDirectorSessionToken(token),
  })

  if (error || !data?.[0]) return null
  const row = data[0]
  return {
    eventId: row.event_id,
    version: row.version,
    snapshot: directorSnapshotSchema.parse(row.snapshot),
    updatedAt: row.updated_at,
  }
}
