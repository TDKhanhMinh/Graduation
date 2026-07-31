import { notFound } from "next/navigation"
import { Metadata } from "next"

import { getPublicEventBySlug } from "@/features/events/dal"
import { getApprovedWishesPage } from "@/features/wishes/dal"
import { WishCard } from "@/components/event-wall/WishCard"
import { Button, buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { Share2 } from "lucide-react"
import { getSiteUrl } from "@/lib/supabase/env"

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { slug } = await params
  const event = await getPublicEventBySlug(slug)
  const canonicalUrl = `${getSiteUrl()}/e/${encodeURIComponent(slug)}`

  if (!event) {
    return {
      title: "Không tìm thấy sự kiện",
    }
  }

  // If unlisted, we could add noindex, as per ADR. Wait, let's keep it simple or follow ADR.
  const isUnlisted = event.visibility === "unlisted"

  return {
    title: event.title,
    description: event.description || "Hãy gửi lời chúc đến sự kiện này!",
    robots: {
      index: !isUnlisted,
      follow: !isUnlisted,
    },
    openGraph: {
      title: event.title,
      description: event.description || "Hãy gửi lời chúc đến sự kiện này!",
      url: canonicalUrl,
    },
    alternates: {
      canonical: canonicalUrl,
    },
  }
}

export default async function PublicEventPage({ params }: Props) {
  const { slug } = await params
  const canonicalUrl = `${getSiteUrl()}/e/${encodeURIComponent(slug)}`
  
  const event = await getPublicEventBySlug(slug)

  if (!event) {
    notFound()
  }

  if (event.archived_at) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
        <p className="text-muted-foreground mb-6">Sự kiện này đã được lưu trữ và không còn hoạt động.</p>
        <Link href="/">
          <Button variant="outline">Quay về trang chủ</Button>
        </Link>
      </div>
    )
  }

  // Fetch first page of wishes
  const wishes = await getApprovedWishesPage(event.id, 20)

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold line-clamp-1">{event.title}</h1>
            {event.description && (
              <p className="text-sm text-muted-foreground line-clamp-1">{event.description}</p>
            )}
          </div>
          <a
            aria-label="Mở đường dẫn chia sẻ sự kiện"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
            href={canonicalUrl}
            title="Chia sẻ sự kiện"
          >
            <Share2 className="h-5 w-5" />
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {wishes.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-lg border shadow-sm">
            <h3 className="text-lg font-semibold mb-2">Chưa có lời chúc nào</h3>
            <p className="text-muted-foreground mb-6">
              {event.submission_mode === 'closed' 
                ? "Sự kiện này đã đóng nhận lời chúc." 
                : "Hãy là người đầu tiên gửi lời chúc!"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 masonry-like">
            {wishes.map((wish) => (
              <WishCard key={wish.id} wish={wish} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
