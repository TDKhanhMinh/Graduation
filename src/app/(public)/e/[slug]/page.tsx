import { notFound } from "next/navigation"
import { Metadata } from "next"

import { getPublicEventBySlug } from "@/features/events/dal"
import { getApprovedWishesPage } from "@/features/wishes/dal"
import { RealtimeWall } from "@/components/event-wall/RealtimeWall"
import { WishComposer } from "@/components/wish-composer/WishComposer"
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
        <section className="mb-8 flex flex-col items-center gap-3 rounded-2xl border bg-card px-5 py-6 text-center shadow-sm">
          <div>
            <h2 className="text-xl font-semibold">Gửi một lời chúc</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Nội dung của bạn sẽ được lưu nháp trên thiết bị cho đến khi gửi thành công.
            </p>
          </div>
          <WishComposer
            eventId={event.id}
            eventTitle={event.title}
            maxLength={event.max_wish_length}
            submissionMode={event.submission_mode as "open" | "approval_required" | "closed"}
            turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
            allowAi={event.allow_ai}
          />
        </section>

        <RealtimeWall 
          eventId={event.id}
          initialWishes={wishes}
          fetchWishesAction={async (eventId: string, limit: number) => {
            "use server"
            // Re-import internally to satisfy Next.js Server Action boundary rules if needed,
            // but the outer import works.
            return getApprovedWishesPage(eventId, limit)
          }}
        />
      </main>
    </div>
  )
}
