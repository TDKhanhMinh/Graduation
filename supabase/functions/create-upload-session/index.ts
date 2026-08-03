import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.44.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    // We use service_role to generate signed upload URL, because the client might not have permissions to do so on a private bucket.
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { event_id, client_request_id, ext, is_avatar } = body;

    if (!event_id || !client_request_id || !ext) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Check media quota
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('media_quota_bytes, media_usage_bytes')
      .eq('id', event_id)
      .single();
      
    if (eventError || !event) {
      return new Response(JSON.stringify({ error: "Event not found or database error" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    if (event.media_usage_bytes >= event.media_quota_bytes) {
      return new Response(JSON.stringify({ error: "QUOTA_EXCEEDED", message: "Event media storage limit exceeded" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 413,
      });
    }

    // Generate random UUID for the file
    const fileUuid = crypto.randomUUID();
    
    // Determine path based on whether it's an avatar or not
    let path = "";
    if (is_avatar) {
      path = `${event_id}/${client_request_id}/avatar_${fileUuid}.${ext}`;
    } else {
      path = `${event_id}/${client_request_id}/${fileUuid}.${ext}`;
    }

    // Create signed upload URL
    const { data, error } = await supabase.storage
      .from('event-media-private')
      .createSignedUploadUrl(path);

    if (error) {
      console.error('Error generating signed URL:', error);
      return new Response(JSON.stringify({ error: "Could not generate upload URL" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    return new Response(
      JSON.stringify({
        path,
        token: data.token,
        signedUrl: data.signedUrl,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
