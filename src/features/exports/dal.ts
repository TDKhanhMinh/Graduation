import 'server-only'

import { createClient } from '@/lib/supabase/server'

import {
  OWNER_EXPORT_MAX_WISHES,
  ownerExportSnapshotSchema,
  type OwnerExportSnapshot,
} from './contract'

type OwnerExportRow = {
  snapshot_at: string
  event_id: string
  event_slug: string
  event_title: string
  event_description: string | null
  event_date: string | null
  starts_at: string | null
  ends_at: string | null
  timezone: string
  location_name: string | null
  location_address: string | null
  host_name: string | null
  host_title: string | null
  visibility: string
  event_created_at: string
  wish_id: string | null
  sender_name: string | null
  wish_content: string | null
  is_pinned: boolean | null
  wish_created_at: string | null
}

type OwnerExportRpcClient = {
  rpc(
    name: 'get_owner_export_rows',
    args: { p_event_id: string; p_limit: number },
  ): Promise<{ data: OwnerExportRow[] | null; error: { code?: string } | null }>
}

export class OwnerExportTooLargeError extends Error {
  constructor() {
    super('OWNER_EXPORT_TOO_LARGE')
    this.name = 'OwnerExportTooLargeError'
  }
}

export class OwnerExportDataError extends Error {
  constructor() {
    super('OWNER_EXPORT_DATA_UNAVAILABLE')
    this.name = 'OwnerExportDataError'
  }
}

function buildSnapshot(rows: OwnerExportRow[]): OwnerExportSnapshot {
  const first = rows[0]
  if (!first || !first.event_id || !first.event_slug || !first.event_title || !first.event_created_at) {
    throw new OwnerExportDataError()
  }

  return ownerExportSnapshotSchema.parse({
    schema_version: 1,
    consistency_at: first.snapshot_at,
    event: {
      id: first.event_id,
      slug: first.event_slug,
      title: first.event_title,
      description: first.event_description,
      event_date: first.event_date,
      starts_at: first.starts_at,
      ends_at: first.ends_at,
      timezone: first.timezone,
      location_name: first.location_name,
      location_address: first.location_address,
      host_name: first.host_name,
      host_title: first.host_title,
      visibility: first.visibility,
      created_at: first.event_created_at,
    },
    wishes: rows.flatMap((row) => {
      if (!row.wish_id || !row.sender_name || !row.wish_created_at || row.is_pinned === null) return []

      return [{
        id: row.wish_id,
        sender_name: row.sender_name,
        content: row.wish_content,
        is_pinned: row.is_pinned,
        created_at: row.wish_created_at,
      }]
    }),
  })
}

export async function getOwnerExportSnapshot(eventId: string): Promise<OwnerExportSnapshot | null> {
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  if (!claims?.claims?.sub) return null

  const { data, error } = await (supabase as unknown as OwnerExportRpcClient).rpc('get_owner_export_rows', {
    p_event_id: eventId,
    p_limit: OWNER_EXPORT_MAX_WISHES + 1,
  })

  if (error) {
    console.error('Owner export snapshot query failed', { code: error.code })
    throw new OwnerExportDataError()
  }

  if (!data || data.length === 0) return null
  if (data.length > OWNER_EXPORT_MAX_WISHES) throw new OwnerExportTooLargeError()

  return buildSnapshot(data)
}
