import { notFound } from "next/navigation"

import { ThemeEditor } from "@/components/events/ThemeEditor"
import { SectionHeading } from "@/components/ui/section-heading"
import { getOwnedEventById } from "@/features/events/dal"
import { updateEventAppearance } from "@/features/events/actions"

export const metadata = {
  title: "Giao diện",
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
        title="Giao diện"
        description="Cấu hình nhận diện sự kiện công khai với ảnh bìa Cloudinary và xem trước trực tiếp an toàn."
      />
      <ThemeEditor
        action={boundAction}
        eventTitle={event.title}
        eventDescription={event.description || ""}
        initialTheme={event.theme_key}
        initialCover={event.cover_path}
        initialExperiencePreset={event.experience_preset}
        initialEffectIntensity={event.effect_intensity as "off" | "low" | "medium" | "high"}
        initialEffectQuality={event.effect_quality as "auto" | "low" | "medium" | "high"}
        initialWallLayout={event.wall_layout as "spotlight" | "grid" | "photo-focus"}
        initialQrVisible={event.qr_visible}
        initialQrCta={event.qr_cta}
        initialAnimationSpeed={event.animation_speed as "slow" | "normal" | "fast"}
      />
    </div>
  )
}
