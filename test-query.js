import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const { data, error } = await supabase
    .from('wishes')
    .select('id,event_id,sender_name,sender_avatar_path,content,moderation_status,is_pinned,created_at,updated_at,media:wish_media(storage_path,media_type,mime_type,width,height,duration_ms)')
    .limit(1);

  if (error) {
    console.error("Error details:");
    console.error(JSON.stringify(error, null, 2));
    console.error(error.message);
  } else {
    console.log("Success:", data);
  }
}
test();
