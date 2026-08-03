import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.0";

const BUCKET = 'event-media-private';

serve(async (req) => {
  // We expect this to be triggered via pg_cron or HTTP POST
  if (req.method !== 'POST') {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // 1. Create run log
  const { data: runLog, error: runLogError } = await supabase
    .from('cleanup_run_logs')
    .insert({ status: 'running' })
    .select('id')
    .single();

  if (runLogError || !runLog) {
    console.error("Failed to create run log", runLogError);
    return new Response(JSON.stringify({ error: "Failed to initialize" }), { status: 500 });
  }

  const runId = runLog.id;
  let orphansDeletedCount = 0;
  let orphansDeletedBytes = 0;
  let rejectedDeletedCount = 0;
  let rejectedDeletedBytes = 0;

  try {
    // 2. Fetch media to cleanup via our RPC
    const { data: mediaToCleanup, error: rpcError } = await supabase.rpc('get_media_to_cleanup');

    if (rpcError) {
      throw new Error(`RPC failed: ${rpcError.message}`);
    }

    if (!mediaToCleanup || mediaToCleanup.length === 0) {
      // Nothing to do
      await supabase.from('cleanup_run_logs').update({
        status: 'success',
        run_ended_at: new Date().toISOString()
      }).eq('id', runId);
      
      return new Response(JSON.stringify({ message: "No media to clean up" }), { status: 200 });
    }

    // Process in batches of 100 for storage deletion
    const batchSize = 100;
    for (let i = 0; i < mediaToCleanup.length; i += batchSize) {
      const batch = mediaToCleanup.slice(i, i + batchSize);
      const pathsToDelete = batch.map((m: { storage_path: string }) => m.storage_path);
      
      // Delete from storage
      const { data: deletedObjects, error: deleteError } = await supabase
        .storage
        .from(BUCKET)
        .remove(pathsToDelete);

      if (deleteError) {
        throw new Error(`Storage delete failed: ${deleteError.message}`);
      }

      // Collect successfully deleted object paths
      const successfullyDeletedPaths = new Set(deletedObjects?.map((obj) => obj.name) || []);

      // Now process DB deletions and counting
      for (const item of batch) {
        if (!successfullyDeletedPaths.has(item.storage_path)) {
          console.warn(`Object ${item.storage_path} could not be deleted from storage`);
          continue;
        }

        if (item.cleanup_type === 'orphan') {
          orphansDeletedCount++;
          orphansDeletedBytes += item.size_bytes;
        } else if (item.cleanup_type === 'rejected') {
          // Delete from wish_media table
          const { error: dbDeleteError } = await supabase
            .from('wish_media')
            .delete()
            .eq('id', item.media_id);

          if (dbDeleteError) {
             console.warn(`Failed to delete wish_media ${item.media_id}:`, dbDeleteError);
          } else {
             rejectedDeletedCount++;
             rejectedDeletedBytes += item.size_bytes;
          }
        }
      }
    }

    // 3. Update run log to success
    await supabase.from('cleanup_run_logs').update({
      status: 'success',
      run_ended_at: new Date().toISOString(),
      orphans_deleted_count: orphansDeletedCount,
      orphans_deleted_bytes: orphansDeletedBytes,
      rejected_deleted_count: rejectedDeletedCount,
      rejected_deleted_bytes: rejectedDeletedBytes
    }).eq('id', runId);

    return new Response(JSON.stringify({
      message: "Cleanup completed",
      orphans_deleted_count: orphansDeletedCount,
      rejected_deleted_count: rejectedDeletedCount
    }), { status: 200, headers: { "Content-Type": "application/json" } });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Cleanup failed:", error);
    
    // Update run log to failed
    await supabase.from('cleanup_run_logs').update({
      status: 'failed',
      run_ended_at: new Date().toISOString(),
      error_details: errorMessage
    }).eq('id', runId);

    return new Response(JSON.stringify({ error: errorMessage }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
