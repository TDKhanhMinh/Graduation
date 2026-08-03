-- Enforce one media per wish
ALTER TABLE public.wish_media ADD CONSTRAINT wish_media_wish_id_key UNIQUE (wish_id);

GRANT SELECT ON public.wish_media TO anon, authenticated;

-- Policies for wish_media

-- Policies for wish_media
CREATE POLICY "public can read approved media"
ON public.wish_media FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.wishes w
    WHERE w.id = wish_media.wish_id
      AND w.moderation_status = 'approved'
      AND w.deleted_at IS NULL
  )
);

CREATE POLICY "owners can read all media for their events"
ON public.wish_media FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.wishes w
    JOIN public.events e ON e.id = w.event_id
    WHERE w.id = wish_media.wish_id
      AND e.owner_id = (SELECT auth.uid())
  )
);

-- Insert bucket for private media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-media-private',
  'event-media-private',
  false,
  8388608, -- 8MB max for audio, images can be 5MB (checked in app)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'audio/mpeg', 'audio/mp4', 'audio/webm', 'audio/aac', 'audio/wav', 'audio/ogg', 'audio/x-m4a']
)
ON CONFLICT (id) DO UPDATE SET 
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage object policies
CREATE POLICY "owners can read their event media"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'event-media-private'
  AND EXISTS (
    SELECT 1 FROM public.events 
    WHERE owner_id = (SELECT auth.uid())
      AND id::text = split_part(storage.objects.name, '/', 1)
  )
);

CREATE POLICY "owners can delete their event media"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'event-media-private'
  AND EXISTS (
    SELECT 1 FROM public.events 
    WHERE owner_id = (SELECT auth.uid())
      AND id::text = split_part(storage.objects.name, '/', 1)
  )
);
