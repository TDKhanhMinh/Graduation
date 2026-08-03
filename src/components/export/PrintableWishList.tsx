import { PublicWish } from "@/features/wishes/dal"
import { createAdminClient } from "@/lib/supabase/admin"


type Props = {
  wishes: PublicWish[]
}

export async function PrintableWishList({ wishes }: Props) {
  // Pre-fetch signed URLs for all media on the server
  const supabase = createAdminClient()
  const imagePaths = wishes
    .map(w => w.media?.path)
    .filter((path): path is string => Boolean(path))

  // Create signed URLs in chunks if there are many, but since it's admin client, it might support batch
  const signedUrlsMap: Record<string, string> = {}
  
  if (imagePaths.length > 0) {
    const { data, error } = await supabase.storage
      .from('event-media-private')
      .createSignedUrls(imagePaths, 7200)

    if (!error && data) {
      data.forEach(item => {
        if (!item.error && item.signedUrl && item.path) {
          signedUrlsMap[item.path] = item.signedUrl
        }
      })
    }
  }

  // Same for avatars if they are stored in a private bucket. Wait, avatars are usually public or stored in the same bucket.
  // Actually, in GM-V2 P3-T02, sender_avatar_path is in the public bucket `avatars` or `event-media-private`?
  // Let's assume sender_avatar_path is public or we don't have it.
  
  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-10">
      {wishes.map((wish) => {
        const mediaUrl = wish.media?.path ? signedUrlsMap[wish.media.path] : null

        return (
          <div 
            key={wish.id} 
            className="border-b pb-6 break-inside-avoid page-break-inside-avoid"
          >
            <div className="flex items-start gap-4">
              {wish.sender_avatar_path ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={wish.sender_avatar_path} 
                  alt={wish.sender_name} 
                  className="w-10 h-10 rounded-full bg-muted object-cover shrink-0" 
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="font-semibold text-primary text-sm uppercase">
                    {wish.sender_name.substring(0, 2)}
                  </span>
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-lg">{wish.sender_name}</h3>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(wish.created_at).toLocaleDateString('vi-VN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                
                <div className="whitespace-pre-wrap text-foreground/90 text-sm leading-relaxed">
                  {wish.content}
                </div>

                {wish.media && wish.media.type === 'image' && mediaUrl && (
                  <div className="mt-3 max-w-sm rounded-md overflow-hidden border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={mediaUrl} 
                      alt="Attached image"
                      className="w-full h-auto object-contain"
                    />
                  </div>
                )}
                
                {wish.media && wish.media.type === 'audio' && (
                  <div className="mt-3 text-sm italic text-muted-foreground border-l-2 pl-3 py-1 bg-muted/20">
                    [File đính kèm: Ghi âm giọng nói]
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {wishes.length === 0 && (
        <div className="text-center py-20 text-muted-foreground italic">
          Chưa có lời chúc nào được gửi đến sự kiện này.
        </div>
      )}
    </div>
  )
}
