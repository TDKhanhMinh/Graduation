import { notFound } from "next/navigation"

import { ThemeEditor } from "@/components/events/ThemeEditor"
import { SectionHeading } from "@/components/ui/section-heading"
import { getOwnedEventById } from "@/features/events/dal"
import { updateEventAppearance } from "@/features/events/actions"

export const metadata = {
  title: "Appearance",
}

export default async function EventAppearancePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const event = await getOwnedEventById(id)

  if (!event) notFound()

  const boundAction = updateEventAppearance.bind(null, event.id)

  return (
    <div className="space-y-6 pb-10">
      <SectionHeading
        title="Appearance"
        description="Configure the public event identity with a Cloudinary cover and safe live preview."
      />
      <ThemeEditor
        action={boundAction}
        eventTitle={event.title}
        eventDescription={event.description || ""}
        initialTheme={event.theme_key}
        initialCover={event.cover_path}
      />
    </div>
  )
}
