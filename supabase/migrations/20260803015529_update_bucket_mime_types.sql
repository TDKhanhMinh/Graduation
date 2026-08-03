update storage.buckets
set allowed_mime_types = array[
    'image/jpeg', 
    'image/png', 
    'image/webp', 
    'image/gif',
    'audio/webm',
    'audio/mp4',
    'audio/ogg',
    'audio/aac',
    'audio/wav',
    'audio/mpeg'
  ]
where id = 'event-media-private';
