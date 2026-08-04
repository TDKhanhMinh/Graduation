"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { verifySession } from "@/lib/auth/dal"
import { createClient } from "@/lib/supabase/server"
import { appearanceSchema, eventSchema, normalizeSlug } from "./schema"
import { createError } from "@/lib/observability/error"
import { logger } from "@/lib/observability/logger"

export type EventActionState = {
  error?: string
  message?: string
  fieldErrors?: Record<string, string[]>
}

export async function createEvent(
  prevState: EventActionState,
  formData: FormData
): Promise<EventActionState> {
  const session = await verifySession()
  if (!session) {
    redirect("/auth/login")
  }

  const rawData = {
    title: formData.get("title"),
    slug: normalizeSlug(String(formData.get("slug") || "")),
    description: formData.get("description"),
    date: formData.get("date") || null,
    visibility: formData.get("visibility"),
    submission_mode: formData.get("submission_mode"),
  }

  const validated = eventSchema.safeParse(rawData)
  if (!validated.success) {
    return {
      error: "Thông tin không hợp lệ.",
      fieldErrors: validated.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()

  // Verify slug uniqueness (Supabase unique constraint will also catch this, but good to check)
  const { count } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("slug", validated.data.slug)

  if (count && count > 0) {
    return {
      error: "Đường dẫn (slug) này đã được sử dụng. Vui lòng chọn đường dẫn khác.",
    }
  }

  const { data, error } = await supabase
    .from("events")
    .insert({
      owner_id: session.userId,
      title: validated.data.title,
      slug: validated.data.slug,
      description: validated.data.description,
      event_date: validated.data.date,
      visibility: validated.data.visibility,
      submission_mode: validated.data.submission_mode,
    })
    .select("id")
    .single()

  if (error) {
    if (error.code === "23505") {
      return {
        error: "Đường dẫn (slug) này đã được sử dụng. Vui lòng chọn đường dẫn khác.",
      }
    }

    logger.error("Failed to create event", error, { userId: session.userId })
    return {
      error: "Không thể tạo sự kiện. Vui lòng thử lại sau.",
    }
  }

  revalidatePath("/dashboard")
  redirect(`/dashboard/events/${data.id}`)
}

export async function updateEvent(
  eventId: string,
  prevState: EventActionState,
  formData: FormData
): Promise<EventActionState> {
  const session = await verifySession()
  if (!session) {
    redirect("/auth/login")
  }

  const rawData = {
    title: formData.get("title"),
    slug: normalizeSlug(String(formData.get("slug") || "")),
    description: formData.get("description"),
    date: formData.get("date") || null,
    visibility: formData.get("visibility"),
    submission_mode: formData.get("submission_mode"),
  }

  const validated = eventSchema.safeParse(rawData)
  if (!validated.success) {
    return {
      error: "Thông tin không hợp lệ.",
      fieldErrors: validated.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()

  // The RLS policy requires owner_id = current user's id.
  // We can just update and check if a row was affected.
  const { error } = await supabase
    .from("events")
    .update({
      title: validated.data.title,
      slug: validated.data.slug,
      description: validated.data.description,
      event_date: validated.data.date,
      visibility: validated.data.visibility,
      submission_mode: validated.data.submission_mode,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId)
    .eq("owner_id", session.userId)
    .select("id")
    .single()

  if (error) {
    if (error.code === '23505') {
      return { error: "Đường dẫn (slug) này đã được sử dụng." }
    }
    logger.error("Failed to update event", error, { userId: session.userId, eventId })
    return { error: "Không thể cập nhật sự kiện hoặc bạn không có quyền." }
  }

  revalidatePath("/dashboard")
  revalidatePath(`/dashboard/events/${eventId}`)
  
  return { message: "Đã cập nhật sự kiện thành công." }
}

export async function updateEventAppearance(
  eventId: string,
  prevState: EventActionState,
  formData: FormData
): Promise<EventActionState> {
  const session = await verifySession()
  if (!session) redirect("/auth/login")
  void prevState
  const validated = appearanceSchema.safeParse({
    theme_key: formData.get("theme_key"),
    cover_path: String(formData.get("cover_path") || ""),
  })

  if (!validated.success) {
    return {
      error: "Appearance settings are invalid.",
      fieldErrors: validated.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("events")
    .update({
      theme_key: validated.data.theme_key,
      cover_path: validated.data.cover_path || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId)
    .eq("owner_id", session.userId)
    .select("id")
    .single()

  if (error) {
    logger.error("Failed to update event appearance", error, { userId: session.userId, eventId })
    return { error: "Could not save appearance settings." }
  }

  revalidatePath("/dashboard/events/" + eventId)
  revalidatePath("/dashboard/events/" + eventId + "/appearance")
  // The public page reads the saved event projection on the next request.
  return { message: "Appearance settings saved." }
}

export async function archiveEvent(eventId: string) {
  const session = await verifySession()
  if (!session) {
    redirect("/auth/login")
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("events")
    .update({
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId)
    .eq("owner_id", session.userId)
    .select("id")
    .single()

  if (error) {
    logger.error("Failed to archive event", error, { userId: session.userId, eventId })
    throw createError("INTERNAL_SERVER_ERROR", "Không thể lưu trữ sự kiện.")
  }

  revalidatePath("/dashboard")
  revalidatePath(`/dashboard/events/${eventId}`)
}

export async function closeEvent(eventId: string) {
  const session = await verifySession()
  if (!session) {
    redirect("/auth/login")
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("events")
    .update({
      submission_mode: "closed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId)
    .eq("owner_id", session.userId)
    .select("id")
    .single()

  if (error) {
    logger.error("Failed to close event", error, { userId: session.userId, eventId })
    throw createError("INTERNAL_SERVER_ERROR", "Không thể đóng nhận lời chúc cho sự kiện.")
  }

  revalidatePath("/dashboard")
  revalidatePath(`/dashboard/events/${eventId}`)
  revalidatePath(`/dashboard/events/${eventId}/settings`)
}
