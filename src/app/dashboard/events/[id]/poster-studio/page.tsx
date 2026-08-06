import { notFound } from "next/navigation"

import { PosterStudioAnalytics } from "@/components/analytics/poster-studio-analytics"
import { PosterAdvancedEditor } from "@/components/posters/PosterAdvancedEditor"
import { PosterQuickCreate } from "@/components/posters/PosterQuickCreate"
import { getOwnedEventById } from "@/features/events/dal"
import { getOwnedPosterDocument } from "@/features/posters/dal"
import { createPosterDocumentFromQuickCreate } from "@/features/posters/quick-create"
import { posterDocumentSchema, resolvePosterEventCategory } from "@/features/posters/schema"
import { buildPublicEventUrl } from "@/features/sharing/public-url"
import { getSiteUrl } from "@/lib/supabase/env"

export default async function PosterStudioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const event = await getOwnedEventById(id)
  if (!event) notFound()
  const publicUrl = buildPublicEventUrl(getSiteUrl(), event.slug)
  const category = resolvePosterEventCategory(event)
  const fallbackDocument = createPosterDocumentFromQuickCreate({ eventId: event.id, eventCategory: category, templateId: "graduation-glow-01", ratio: "4:5", title: event.title, tagline: "A moment worth remembering", date: event.event_date?.slice(0, 10) ?? "", location: "Memoria Hall", publicUrl, accent: "#c85b45" })
  let savedDocument: Awaited<ReturnType<typeof getOwnedPosterDocument>> = null
  try { savedDocument = await getOwnedPosterDocument(event.id) } catch { savedDocument = null }
  const savedResult = savedDocument ? posterDocumentSchema.safeParse(savedDocument.document_json) : null
  const initialDocument = savedResult?.success && savedResult.data.metadata.eventId === event.id ? savedResult.data : fallbackDocument
  return <div className="space-y-6"><div><p className="text-sm font-semibold text-primary">Poster Studio</p><h1 className="mt-1 font-heading text-2xl font-semibold">Tạo poster cho {event.title}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Tạo nhanh để bắt đầu nhanh chóng, sau đó dùng Trình biên tập nâng cao trên máy tính bảng và máy tính để bàn để tùy chỉnh chi tiết. Điện thoại di động sử dụng tính năng Tạo nhanh.</p></div><PosterStudioAnalytics><PosterQuickCreate eventId={event.id} eventTitle={event.title} eventDate={event.event_date} publicUrl={publicUrl} initialCategory={category} /></PosterStudioAnalytics><PosterAdvancedEditor eventId={event.id} initialDocument={initialDocument} initialRevision={savedDocument?.revision ?? 0} /></div>
}
