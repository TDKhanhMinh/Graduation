import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.44.0'

const MEDIA_BUCKET = 'event-media-private'
const POSTER_BUCKET = 'poster-assets-private'
const CLEANUP_SECRET_HEADER = 'x-cleanup-secret'
const BATCH_SIZE = 100

type MediaCleanupItem = {
  cleanup_type: 'orphan' | 'rejected' | 'event_deleted_media' | 'event_deleted_avatar'
  storage_path: string
  media_id: string | null
  size_bytes: number | null
}

type PosterCleanupItem = {
  storage_path: string
  size_bytes: number | null
}

type CleanupStats = {
  orphansDeletedCount: number
  orphansDeletedBytes: number
  rejectedDeletedCount: number
  rejectedDeletedBytes: number
  eventDeletedAssetsDeletedCount: number
  eventDeletedAssetsDeletedBytes: number
  posterAssetsDeletedCount: number
  posterAssetsDeletedBytes: number
}

function createStats(): CleanupStats {
  return {
    orphansDeletedCount: 0,
    orphansDeletedBytes: 0,
    rejectedDeletedCount: 0,
    rejectedDeletedBytes: 0,
    eventDeletedAssetsDeletedCount: 0,
    eventDeletedAssetsDeletedBytes: 0,
    posterAssetsDeletedCount: 0,
    posterAssetsDeletedBytes: 0,
  }
}

function sizeOf(item: { size_bytes: number | null }) {
  return Number(item.size_bytes ?? 0)
}

function response(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function removeStorageBatch(
  supabase: SupabaseClient,
  bucket: string,
  paths: string[],
) {
  if (paths.length === 0) return

  const { error } = await supabase.storage.from(bucket).remove(paths)
  if (error) {
    throw new Error('Storage delete failed: ' + error.message)
  }
}

async function cleanupMedia(
  supabase: SupabaseClient,
  items: MediaCleanupItem[],
  stats: CleanupStats,
) {
  for (let offset = 0; offset < items.length; offset += BATCH_SIZE) {
    const batch = items.slice(offset, offset + BATCH_SIZE)
    await removeStorageBatch(
      supabase,
      MEDIA_BUCKET,
      batch.map((item) => item.storage_path),
    )

    for (const item of batch) {
      const bytes = sizeOf(item)
      if (item.cleanup_type === 'orphan') {
        stats.orphansDeletedCount += 1
        stats.orphansDeletedBytes += bytes
        continue
      }

      if (item.cleanup_type === 'event_deleted_avatar') {
        const { error } = await supabase
          .from('wishes')
          .update({ sender_avatar_path: null })
          .eq('sender_avatar_path', item.storage_path)
        if (error) {
          throw new Error('Avatar reference cleanup failed: ' + error.message)
        }
        stats.eventDeletedAssetsDeletedCount += 1
        stats.eventDeletedAssetsDeletedBytes += bytes
        continue
      }

      if (!item.media_id) {
        throw new Error('Cleanup item is missing media_id: ' + item.storage_path)
      }

      const { error } = await supabase
        .from('wish_media')
        .delete()
        .eq('id', item.media_id)
      if (error) {
        throw new Error('Media row cleanup failed: ' + error.message)
      }

      if (item.cleanup_type === 'event_deleted_media') {
        stats.eventDeletedAssetsDeletedCount += 1
        stats.eventDeletedAssetsDeletedBytes += bytes
      } else {
        stats.rejectedDeletedCount += 1
        stats.rejectedDeletedBytes += bytes
      }
    }
  }
}

async function cleanupPosterAssets(
  supabase: SupabaseClient,
  items: PosterCleanupItem[],
  stats: CleanupStats,
) {
  for (let offset = 0; offset < items.length; offset += BATCH_SIZE) {
    const batch = items.slice(offset, offset + BATCH_SIZE)
    await removeStorageBatch(
      supabase,
      POSTER_BUCKET,
      batch.map((item) => item.storage_path),
    )

    for (const item of batch) {
      const { error } = await supabase
        .from('poster_assets')
        .delete()
        .eq('storage_path', item.storage_path)
      if (error) {
        throw new Error('Poster asset row cleanup failed: ' + error.message)
      }
      stats.posterAssetsDeletedCount += 1
      stats.posterAssetsDeletedBytes += sizeOf(item)
    }
  }
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const expectedSecret = Deno.env.get('CLEANUP_MEDIA_CRON_SECRET') ?? ''
  const providedSecret = req.headers.get(CLEANUP_SECRET_HEADER) ?? ''
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (!supabaseUrl || !supabaseServiceKey) {
    return response({ error: 'Cleanup service is not configured' }, 500)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const { data: runLog, error: runLogError } = await supabase
    .from('cleanup_run_logs')
    .insert({ status: 'running' })
    .select('id')
    .single()

  if (runLogError || !runLog) {
    console.error('Failed to create run log', runLogError)
    return response({ error: 'Failed to initialize' }, 500)
  }

  const stats = createStats()

  try {
    const { data: mediaToCleanup, error: mediaRpcError } = await supabase
      .rpc('get_media_to_cleanup')
    if (mediaRpcError) {
      throw new Error('Media cleanup RPC failed: ' + mediaRpcError.message)
    }

    const { data: posterAssetsToCleanup, error: posterRpcError } = await supabase
      .rpc('get_poster_assets_to_cleanup')
    if (posterRpcError) {
      throw new Error('Poster cleanup RPC failed: ' + posterRpcError.message)
    }

    await cleanupMedia(supabase, (mediaToCleanup ?? []) as MediaCleanupItem[], stats)
    await cleanupPosterAssets(
      supabase,
      (posterAssetsToCleanup ?? []) as PosterCleanupItem[],
      stats,
    )

    const { error: logError } = await supabase
      .from('cleanup_run_logs')
      .update({
        status: 'success',
        run_ended_at: new Date().toISOString(),
        orphans_deleted_count: stats.orphansDeletedCount,
        orphans_deleted_bytes: stats.orphansDeletedBytes,
        rejected_deleted_count: stats.rejectedDeletedCount,
        rejected_deleted_bytes: stats.rejectedDeletedBytes,
        event_deleted_assets_deleted_count: stats.eventDeletedAssetsDeletedCount,
        event_deleted_assets_deleted_bytes: stats.eventDeletedAssetsDeletedBytes,
        poster_assets_deleted_count: stats.posterAssetsDeletedCount,
        poster_assets_deleted_bytes: stats.posterAssetsDeletedBytes,
      })
      .eq('id', runLog.id)
    if (logError) {
      throw new Error('Cleanup success log failed: ' + logError.message)
    }

    return response({
      message: 'Cleanup completed',
      ...stats,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('Cleanup failed:', error)

    await supabase
      .from('cleanup_run_logs')
      .update({
        status: 'failed',
        run_ended_at: new Date().toISOString(),
        error_details: errorMessage,
      })
      .eq('id', runLog.id)

    return response({ error: errorMessage }, 500)
  }
})
