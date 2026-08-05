import { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import Link from "next/link"
import { CalendarDays } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PageShell } from "@/components/ui/page-shell"
import { SectionHeading } from "@/components/ui/section-heading"
import { StatusBadge } from "@/components/ui/status-badge"
import { CopyEventLinkButton, PublicQrButton, ShareEventButton } from "@/components/event-wall/PublicEventShareButton"
import { RealtimeWall } from "@/components/event-wall/RealtimeWall"
import { WishComposer } from "@/components/wish-composer/WishComposer"
import { getPublicEventBySlug } from "@/features/events/dal"
import { getApprovedWishesPage } from "@/features/wishes/dal"
import { getSiteUrl } from "@/lib/supabase/env"

type Props = {
  params: Promise<{ slug: string }>
}

function getCloudinaryCover(path: string | null) {
  return path && /^https:\/\/res\.cloudinary\.com\//.test(path) ? path : null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const event = await getPublicEventBySlug(slug)
  const canonicalUrl = `${getSiteUrl()}/e/${encodeURIComponent(slug)}`

  if (!event) {
    return { title: "Không tìm thấy sự kiện" }
  }

  const isUnlisted = event.visibility === "unlisted"
  const description = event.description || "Hãy gửi lời chúc đến sự kiện này!"

  return {
    title: event.title,
    description,
    robots: { index: !isUnlisted, follow: !isUnlisted },
    openGraph: { title: event.title, description, url: canonicalUrl },
    alternates: { canonical: canonicalUrl },
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
      <main id="main-content" className="min-h-screen bg-surface-sunken">
        <PageShell className="flex min-h-screen items-center justify-center py-10">
          <Card className="w-full max-w-xl">
            <CardContent className="flex flex-col items-center gap-5 px-6 py-10 text-center sm:px-10">
              <StatusBadge tone="warning">Đã lưu trữ</StatusBadge>
              <div>
                <h1 className="font-heading text-2xl font-semibold">{event.title}</h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Sự kiện này đã được lưu trữ và không còn nhận lời chúc mới.
                </p>
              </div>
              <Link href="/">
                <Button variant="outline" className="min-h-(--control-min-size)">
                  Quay về trang chủ
                </Button>
              </Link>
            </CardContent>
          </Card>
        </PageShell>
      </main>
    )
  }

  const coverUrl = getCloudinaryCover(event.cover_path)
  const wishes = await getApprovedWishesPage(event.id, 20)

  return (
    <div className="event-theme min-h-screen pb-24 text-[var(--event-text)] sm:pb-0" data-event-theme={event.theme_key}>
      <header className="sticky top-0 z-10 border-b border-[var(--event-border)] bg-[var(--event-surface)] backdrop-blur-xl supports-[backdrop-filter]:bg-[var(--event-surface)]">
        <PageShell className="flex min-h-18 items-center justify-between gap-4 py-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Memoria
            </p>
            <h1 className="truncate font-heading text-lg font-semibold sm:text-xl">{event.title}</h1>
            {event.description ? (
              <p className="truncate text-sm text-muted-foreground">{event.description}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <PublicQrButton url={canonicalUrl} />
            <ShareEventButton title={event.title} url={canonicalUrl} />
          </div>
        </PageShell>
      </header>

      <main id="main-content">
        <PageShell className="space-y-8 py-6 sm:py-8">
          <section aria-labelledby="event-hero-title" className="overflow-hidden rounded-[2rem] border border-[var(--event-border)] bg-[var(--event-surface)] shadow-[0_28px_70px_-48px_var(--event-primary)]">
            <div className="grid min-h-[520px] lg:grid-cols-[3fr_2fr]">
              <div className="flex flex-col justify-center gap-6 p-6 sm:p-10 lg:p-14">
                <StatusBadge tone="info" className="w-fit">A digital yearbook</StatusBadge>
                <div className="space-y-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Memoria
                  </p>
                  <h2
                    id="event-hero-title"
                    className="max-w-3xl font-heading text-4xl font-semibold tracking-tight sm:text-5xl lg:text-7xl"
                  >
                    {event.title}
                  </h2>
                  {event.description ? (
                    <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                      {event.description}
                    </p>
                  ) : null}
                  {event.event_date ? (
                    <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <CalendarDays aria-hidden="true" className="size-4" />
                      {new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date(event.event_date))}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="#composer-heading"
                    className={buttonVariants({ size: "lg", className: "min-h-(--control-min-size) bg-[var(--event-primary)] text-[var(--event-on-primary)] hover:opacity-90" })}
                  >
                    Send a wish
                  </Link>
                  <CopyEventLinkButton url={canonicalUrl} />
                </div>
              </div>
              <div className="relative min-h-64 overflow-hidden bg-[radial-gradient(circle_at_20%_20%,var(--event-secondary),transparent_45%),linear-gradient(135deg,var(--event-primary),var(--event-secondary))] lg:min-h-full">
                {coverUrl ? (
                  <Image
                    src={coverUrl}
                    alt={event.title + " cover"}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-end p-6 sm:p-10" aria-label="Cover image unavailable">
                    <div className="max-w-sm rounded-2xl border border-white/30 bg-black/20 p-5 text-white backdrop-blur-sm">
                      <p className="text-sm font-medium">Your memories, beautifully kept.</p>
                      <p className="mt-2 text-sm leading-6 text-white/80">
                        Add a Cloudinary cover in event appearance settings when available.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section aria-labelledby="composer-heading" className="space-y-4">
            <SectionHeading
              as="h2"
              title="Gửi một lời chúc"
              description="Lời chúc của bạn sẽ được lưu nháp trên thiết bị cho đến khi gửi thành công."
              actions={<CopyEventLinkButton url={canonicalUrl} />}
            />
            <Card>
              <CardContent className="flex flex-col items-center gap-4 px-5 py-6 text-center sm:px-8">
                <h2 id="composer-heading" className="sr-only">Gửi một lời chúc</h2>
                <WishComposer
                  eventId={event.id}
                  eventTitle={event.title}
                  maxLength={event.max_wish_length}
                  submissionMode={event.submission_mode as "open" | "approval_required" | "closed"}
                  turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
                  allowAi={event.allow_ai}
                />
              </CardContent>
            </Card>
          </section>

          <section aria-labelledby="wall-heading" className="space-y-4">
            <SectionHeading
              as="h2"
              title="Bức tường lời chúc"
              description="Các lời chúc đã được duyệt sẽ xuất hiện ở đây theo thời gian thực."
            />
            <h2 id="wall-heading" className="sr-only">Bức tường lời chúc</h2>
            <RealtimeWall
              eventId={event.id}
              initialWishes={wishes}
              fetchWishesAction={async (eventId: string, limit: number) => {
                "use server"
                return getApprovedWishesPage(eventId, limit)
              }}
            />
          </section>
        </PageShell>
      </main>      <div className="fixed inset-x-3 bottom-3 z-20 sm:hidden">
        <Link href="#composer-heading" className={buttonVariants({ size: "lg", className: "w-full rounded-2xl bg-[var(--event-primary)] text-[var(--event-on-primary)] shadow-xl hover:opacity-90" })}>Gửi lời chúc</Link>
      </div>    </div>
  )
}