import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"

import { AmbientParticles } from "@/components/effects/ambient-particles"
import { AuroraBackground } from "@/components/effects/aurora-background"
import { FilmGrainOverlay } from "@/components/effects/film-grain-overlay"
import { FloatingPhotoMemories } from "@/components/effects/floating-photo-memories"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PageShell } from "@/components/ui/page-shell"
import { SectionHeading } from "@/components/ui/section-heading"
import { StatusBadge } from "@/components/ui/status-badge"
import { CopyEventLinkButton, PublicQrButton, ShareEventButton } from "@/components/event-wall/PublicEventShareButton"
import { RealtimeWall } from "@/components/event-wall/RealtimeWall"
import { WishComposer } from "@/components/wish-composer/WishComposer"
import { EventWelcome } from "@/components/event-welcome/event-welcome"
import { WelcomeExperience } from "@/components/event-welcome/WelcomeExperience"
import { WelcomeSession } from "@/components/event-welcome/welcome-session"
import { getPublicEventBySlug } from "@/features/events/dal"
import { getApprovedWishesPage } from "@/features/wishes/dal"
import { EffectProvider, type EffectQuality } from "@/components/effects/effect-provider"
import { getEffectConfig } from "@/components/effects/effect-config"
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
  const welcomeConfig = event.welcome_hero
  const effectConfig = getEffectConfig(welcomeConfig.effects.preset, welcomeConfig.effects.intensity)

  return (
    <EffectProvider preset={effectConfig.preset} intensity={effectConfig.intensity} quality={event.effect_quality as EffectQuality}>
      <div className="event-theme min-h-screen overflow-x-clip pb-[calc(6rem+env(safe-area-inset-bottom))] text-[var(--event-text)] sm:pb-0" data-event-theme={event.theme_key}>
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
          <WelcomeExperience slug={slug}>
            <WelcomeSession slug={slug}>
              <EventWelcome
                slug={slug}
                title={event.title}
                description={event.description}
                eventDate={event.event_date}
                submissionMode={event.submission_mode}
                coverUrl={coverUrl}
                themeKey={event.theme_key}
                welcomeConfig={welcomeConfig}
                decorativeLayers={
                  <>
                    <AuroraBackground preset={effectConfig.preset} intensity={effectConfig.intensity} className="z-0" />
                    {welcomeConfig.effects.particles ? (
                      <AmbientParticles preset={effectConfig.preset} intensity={effectConfig.intensity} className="z-0" />
                    ) : null}
                    <FloatingPhotoMemories featuredImage={coverUrl} />
                    <FilmGrainOverlay />
                  </>
                }
                shareAction={<CopyEventLinkButton url={canonicalUrl} />}
              />
            </WelcomeSession>
          </WelcomeExperience>

          <section id="submit-wish" aria-labelledby="composer-heading" className="space-y-4">
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

          <section id="gallery" aria-labelledby="wall-heading" className="space-y-4">
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
      </main>      <div className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-20 sm:hidden">
        <Link href="#composer-heading" className={buttonVariants({ size: "lg", className: "w-full rounded-2xl bg-[var(--event-primary)] text-[var(--event-on-primary)] shadow-xl hover:opacity-90" })}>Gửi lời chúc</Link>
      </div>    </div>
    </EffectProvider>
  )
}
