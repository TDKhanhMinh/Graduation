import { notFound } from "next/navigation"

import { DirectorMode } from "@/components/director/DirectorMode"
import { getOwnedEventById } from "@/features/events/dal"
import { getApprovedWishesPage } from "@/features/wishes/dal"

export const metadata = {
  title: "Director Mode",
}

export default async function DirectorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const event = await getOwnedEventById(id)

  if (!event) notFound()

  const wishes = await getApprovedWishesPage(event.id, 20)

  return (
    <DirectorMode
      eventId={event.id}
      initialWishes={wishes.map((wish) => ({
        id: wish.id,
        senderName: wish.sender_name,
        content: wish.content || "",
        hasMedia: Boolean(wish.media),
      }))}
      initialQrVisible={event.qr_visible}
      initialAnimationSpeed={event.animation_speed as "slow" | "normal" | "fast"}
    />
  )
}
