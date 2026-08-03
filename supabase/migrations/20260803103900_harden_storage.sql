-- Update allowed mime types for event-media bucket
UPDATE storage.buckets
SET allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'event-media';

-- Update allowed mime types for yearbook-exports bucket
UPDATE storage.buckets
SET allowed_mime_types = array['application/pdf']
WHERE id = 'yearbook-exports';
