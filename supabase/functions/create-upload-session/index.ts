import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const IMAGE_TYPES = new Map([
  ["jpg", "image/jpeg"],
  ["jpeg", "image/jpeg"],
  ["png", "image/png"],
  ["webp", "image/webp"],
  ["heic", "image/heic"],
]);
const AUDIO_TYPES = new Map([
  ["mp3", "audio/mpeg"],
  ["mp4", "audio/mp4"],
  ["m4a", "audio/x-m4a"],
  ["webm", "audio/webm"],
  ["aac", "audio/aac"],
  ["wav", "audio/wav"],
  ["ogg", "audio/ogg"],
]);

const json = (body: Record<string, unknown>, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "Missing Supabase function environment" }, 500);
    }

    const body = await req.json() as Record<string, unknown>;
    const eventId = typeof body.event_id === "string" ? body.event_id : "";
    const clientRequestId =
      typeof body.client_request_id === "string" ? body.client_request_id : "";
    const ext = typeof body.ext === "string"
      ? body.ext.toLowerCase().replace(/^\./, "")
      : "";
    const mediaType = body.media_type === "image" || body.media_type === "audio"
      ? body.media_type
      : null;
    const mimeType = typeof body.mime_type === "string"
      ? body.mime_type.toLowerCase()
      : "";
    const isAvatar = body.is_avatar === true;

    if (!UUID_PATTERN.test(eventId) || !UUID_PATTERN.test(clientRequestId) || !mediaType) {
      return json({ error: "Invalid upload session fields" }, 400);
    }

    const expectedMime = mediaType === "image"
      ? IMAGE_TYPES.get(ext)
      : AUDIO_TYPES.get(ext);
    if (!expectedMime || expectedMime !== mimeType || (isAvatar && mediaType !== "image")) {
      return json({ error: "Unsupported media type" }, 415);
    }

    const maxSizeBytes = mediaType === "image" ? 5 * 1024 * 1024 : 8 * 1024 * 1024;
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id,visibility,submission_mode,deleted_at,archived_at,allow_images,allow_audio,media_quota_bytes,media_usage_bytes")
      .eq("id", eventId)
      .maybeSingle();

    if (eventError || !event || event.deleted_at || event.archived_at || event.visibility === "private") {
      return json({ error: "Event unavailable" }, 404);
    }
    if (event.submission_mode === "closed") {
      return json({ error: "Event is not accepting uploads" }, 409);
    }
    if ((mediaType === "image" && event.allow_images === false) ||
        (mediaType === "audio" && event.allow_audio === false)) {
      return json({ error: "Media type is disabled for this event" }, 403);
    }
    const fileUuid = crypto.randomUUID();
    const path = eventId + "/" + clientRequestId + "/" +
      (isAvatar ? "avatar_" : "") + fileUuid + "." + ext;
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const assetRole = isAvatar ? "sender_avatar" : "wish_media";

    const { error: sessionError } = await supabase.rpc("create_media_upload_session", {
      p_event_id: eventId,
      p_client_request_id: clientRequestId,
      p_storage_bucket: "event-media-private",
      p_storage_path: path,
      p_asset_role: assetRole,
      p_media_type: mediaType,
      p_mime_type: mimeType,
      p_max_size_bytes: maxSizeBytes,
      p_expires_at: expiresAt.toISOString(),
    });

    if (sessionError) {
      if (sessionError.message.includes("QUOTA_EXCEEDED")) {
        return json({ error: "QUOTA_EXCEEDED" }, 413);
      }
      return json({ error: "Could not create upload session" }, 500);
    }

    const { data, error } = await supabase.storage
      .from("event-media-private")
      .createSignedUploadUrl(path);
    if (error || !data) {
      await supabase.from("media_upload_sessions").delete().eq("storage_path", path);
      return json({ error: "Could not generate upload URL" }, 500);
    }

    return json({
      path,
      token: data.token,
      signedUrl: data.signedUrl,
      expiresAt: expiresAt.toISOString(),
    }, 200);
  } catch (error: unknown) {
    return json({
      error: error instanceof Error ? error.message : "Invalid upload request",
    }, 400);
  }
});
