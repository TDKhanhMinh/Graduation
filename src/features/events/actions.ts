"use server";

import { verifySession } from "@/lib/auth/dal";
import { requireEventCapability } from "@/features/collaboration/access";
import { createError } from "@/lib/observability/error";
import { logger } from "@/lib/observability/logger";
import { createClient } from "@/lib/supabase/server";
import { Json } from "@/types/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { appearanceSchema, eventSchema, normalizeSlug } from "./schema";
import { eventScheduleSchema, normalizeLocalDateTime } from "./schedule";
import {
  applyEventScheduleWrite,
  type EventScheduleWrite,
} from "./write-contract";
import {
  getDefaultWelcomeHeroConfig,
  welcomeHeroConfigSchema,
} from "./welcome-config";

export type EventActionState = {
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

function readScheduleWrite(formData: FormData, mode: "create" | "update"): {
  data?: EventScheduleWrite;
  fieldErrors?: Record<string, string[]>;
} {
  const hasScheduleInput = [
    "starts_at",
    "ends_at",
    "timezone",
    "location_name",
    "location_address",
    "host_name",
    "host_title",
  ].some((field) => formData.has(field));
  const timezone = String(formData.get('timezone') || 'UTC').trim();
  const startsRaw = String(formData.get('starts_at') || '').trim();
  const endsRaw = String(formData.get('ends_at') || '').trim();
  const clear = formData.get('clear_schedule') === 'true';

  if (mode === "update" && !hasScheduleInput && !clear) {
    return {
      data: {
        starts_at: null,
        ends_at: null,
        timezone: "UTC",
        location_name: null,
        location_address: null,
        host_name: null,
        host_title: null,
        clear: false,
        provided: false,
      },
    };
  }

  if (clear) {
    return {
      data: {
        starts_at: null,
        ends_at: null,
        timezone: 'UTC',
        location_name: null,
        location_address: null,
        host_name: null,
        host_title: null,
        clear: true,
        provided: true,
      },
    };
  }

  const starts_at = normalizeLocalDateTime(startsRaw, timezone);
  const ends_at = normalizeLocalDateTime(endsRaw, timezone);
  const fieldErrors: Record<string, string[]> = {};
  if (startsRaw && !starts_at) fieldErrors.starts_at = ['Thời điểm bắt đầu không hợp lệ hoặc không tồn tại trong múi giờ đã chọn.'];
  if (endsRaw && !ends_at) fieldErrors.ends_at = ['Thời điểm kết thúc không hợp lệ hoặc không tồn tại trong múi giờ đã chọn.'];

  const parsed = eventScheduleSchema.safeParse({
    starts_at,
    ends_at,
    timezone,
    location_name: String(formData.get('location_name') || '').trim() || null,
    location_address: String(formData.get('location_address') || '').trim() || null,
    host_name: String(formData.get('host_name') || '').trim() || null,
    host_title: String(formData.get('host_title') || '').trim() || null,
  });
  if (!parsed.success) {
    Object.assign(fieldErrors, parsed.error.flatten().fieldErrors);
    return { fieldErrors };
  }
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const parsedData = parsed.data;
  return {
    data: {
      starts_at: parsedData.starts_at ?? null,
      ends_at: parsedData.ends_at ?? null,
      timezone: parsedData.timezone,
      location_name: parsedData.location_name ?? null,
      location_address: parsedData.location_address ?? null,
      host_name: parsedData.host_name ?? null,
      host_title: parsedData.host_title ?? null,
      clear: false,
      provided: true,
    },
  };
}

export async function createEvent(
  prevState: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
  const session = await verifySession();
  if (!session) {
    redirect("/auth/login");
  }

  const schedule = readScheduleWrite(formData, "create");
  if (!schedule.data) {
    return { error: 'Lịch sự kiện không hợp lệ.', fieldErrors: schedule.fieldErrors };
  }

  const rawData = {
    title: formData.get("title"),
    slug: normalizeSlug(String(formData.get("slug") || "")),
    description: formData.get("description"),
    date: schedule.data.starts_at,
    visibility: formData.get("visibility"),
    submission_mode: formData.get("submission_mode"),
  };

  const validated = eventSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      error: "Thông tin không hợp lệ.",
      fieldErrors: validated.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();

  // Verify slug uniqueness (Supabase unique constraint will also catch this, but good to check)
  const { count } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("slug", validated.data.slug);

  if (count && count > 0) {
    return {
      error:
        "Đường dẫn (slug) này đã được sử dụng. Vui lòng chọn đường dẫn khác.",
    };
  }

  const rawWelcomeHero = formData.get("welcome_hero");
  let welcomeHero = null;
  if (typeof rawWelcomeHero === "string" && rawWelcomeHero.trim()) {
    try {
      const parsedWelcomeHero = welcomeHeroConfigSchema.safeParse(
        JSON.parse(rawWelcomeHero),
      );
      if (parsedWelcomeHero.success) {
        welcomeHero = parsedWelcomeHero.data;
      }
    } catch {
      // ignore
    }
  }

  const coverPath = String(formData.get("cover_path") || "");

  const { data, error } = await supabase
    .from("events")
    .insert({
      owner_id: session.userId,
      title: validated.data.title,
      slug: validated.data.slug,
      description: validated.data.description,
      event_date: validated.data.date,
      starts_at: schedule.data.starts_at,
      ends_at: schedule.data.ends_at,
      timezone: schedule.data.timezone,
      location_name: schedule.data.location_name,
      location_address: schedule.data.location_address,
      host_name: schedule.data.host_name,
      host_title: schedule.data.host_title,
      visibility: validated.data.visibility,
      submission_mode: validated.data.submission_mode,
      cover_path: coverPath || null,
      welcome_hero: welcomeHero as unknown as Json,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        error:
          "Đường dẫn (slug) này đã được sử dụng. Vui lòng chọn đường dẫn khác.",
      };
    }

    logger.error("Failed to create event", error, { userId: session.userId });
    return {
      error: "Không thể tạo sự kiện. Vui lòng thử lại sau.",
    };
  }

  revalidatePath("/dashboard");
  redirect(`/dashboard/events/${data.id}?created=1`);
}

export async function updateEvent(
  eventId: string,
  prevState: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
  const session = await verifySession();
  if (!session) {
    redirect("/auth/login");
  }

  if (!await requireEventCapability(eventId, "event_settings")) {
    return { error: "Bạn không có quyền cập nhật cài đặt sự kiện này." };
  }

  const schedule = readScheduleWrite(formData, "update");
  if (!schedule.data) {
    return { error: 'Lịch sự kiện không hợp lệ.', fieldErrors: schedule.fieldErrors };
  }

  const rawData = {
    title: formData.get("title"),
    slug: normalizeSlug(String(formData.get("slug") || "")),
    description: formData.get("description"),
    date: schedule.data.starts_at,
    visibility: formData.get("visibility"),
    submission_mode: formData.get("submission_mode"),
  };

  const validated = eventSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      error: "Thông tin không hợp lệ.",
      fieldErrors: validated.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();

  // Capability authorization is checked above; RLS and the owner-control
  // trigger enforce the same boundary for direct client mutations.
  const eventUpdate = applyEventScheduleWrite({
    title: validated.data.title,
    slug: validated.data.slug,
    description: validated.data.description,
    visibility: validated.data.visibility,
    submission_mode: validated.data.submission_mode,
    updated_at: new Date().toISOString(),
  }, schedule.data);

  const { error } = await supabase
    .from("events")
    .update(eventUpdate)
    .eq("id", eventId)
    .is("deleted_at", null)
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "Đường dẫn (slug) này đã được sử dụng." };
    }
    logger.error("Failed to update event", error, {
      userId: session.userId,
      eventId,
    });
    return { error: "Không thể cập nhật sự kiện hoặc bạn không có quyền." };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/events/${eventId}`);

  return { message: "Đã cập nhật sự kiện thành công." };
}

export async function updateEventAppearance(
  eventId: string,
  prevState: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
  const session = await verifySession();
  if (!session) redirect("/auth/login");
  if (!await requireEventCapability(eventId, "event_settings")) {
    return { error: "Bạn không có quyền cập nhật giao diện sự kiện này." };
  }
  void prevState;
  const validated = appearanceSchema.safeParse({
    theme_key: formData.get("theme_key"),
    experience_preset: formData.get("experience_preset") || undefined,
    effect_intensity: formData.get("effect_intensity") || undefined,
    effect_quality: formData.get("effect_quality") || undefined,
    wall_layout: formData.get("wall_layout") || undefined,
    qr_visible: formData.getAll("qr_visible").includes("true"),
    qr_cta: String(formData.get("qr_cta") || "Gửi lời chúc"),
    animation_speed: formData.get("animation_speed") || undefined,
    cover_path: String(formData.get("cover_path") || ""),
  });

  if (!validated.success) {
    return {
      error: "Cài đặt giao diện không hợp lệ.",
      fieldErrors: validated.error.flatten().fieldErrors,
    };
  }

  const rawWelcomeHero = formData.get("welcome_hero");
  let welcomeHero = getDefaultWelcomeHeroConfig({
    experience_preset: validated.data.experience_preset,
    effect_intensity: validated.data.effect_intensity,
  });
  if (typeof rawWelcomeHero === "string" && rawWelcomeHero.trim()) {
    try {
      const parsedWelcomeHero = welcomeHeroConfigSchema.safeParse(
        JSON.parse(rawWelcomeHero),
      );
      if (!parsedWelcomeHero.success) {
        return {
          error: "Cấu hình Trang chào mừng không hợp lệ.",
          fieldErrors: { welcome_hero: ["Cấu hình không hợp lệ."] },
        };
      }
      welcomeHero = parsedWelcomeHero.data;
    } catch {
      return {
        error: "Cấu hình Trang chào mừng không hợp lệ.",
        fieldErrors: { welcome_hero: ["Cấu hình không hợp lệ."] },
      };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({
      theme_key: validated.data.theme_key,
      experience_preset: validated.data.experience_preset,
      effect_intensity: validated.data.effect_intensity,
      effect_quality: validated.data.effect_quality,
      wall_layout: validated.data.wall_layout,
      qr_visible: validated.data.qr_visible,
      qr_cta: validated.data.qr_cta,
      animation_speed: validated.data.animation_speed,
      cover_path: validated.data.cover_path || null,
      welcome_hero: welcomeHero as unknown as Json,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId)
    .is("deleted_at", null)
    .select("id")
    .single();

  if (error) {
    logger.error("Failed to update event appearance", error, {
      userId: session.userId,
      eventId,
    });
    return { error: "Không thể lưu cài đặt giao diện." };
  }

  revalidatePath("/dashboard/events/" + eventId);
  revalidatePath("/dashboard/events/" + eventId + "/appearance");
  revalidatePath("/(public)/e/[slug]", "page");
  return { message: "Đã lưu cài đặt giao diện." };
}

export async function archiveEvent(eventId: string) {
  const session = await verifySession();
  if (!session) {
    redirect("/auth/login");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId)
    .eq("owner_id", session.userId)
    .is("deleted_at", null)
    .select("id")
    .single();

  if (error) {
    logger.error("Failed to archive event", error, {
      userId: session.userId,
      eventId,
    });
    throw createError("INTERNAL_SERVER_ERROR", "Không thể lưu trữ sự kiện.");
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/events/${eventId}`);
}

export async function deleteEvent(eventId: string) {
  const session = await verifySession();
  if (!session) {
    redirect("/auth/login");
  }
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("events")
    .update({ deleted_at: now, updated_at: now })
    .eq("id", eventId)
    .eq("owner_id", session.userId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();
  if (error) {
    logger.error("Failed to delete event", error, {
      userId: session.userId,
      eventId,
    });
    throw createError(
      "INTERNAL_SERVER_ERROR",
      "Kh\u00f4ng th\u1ec3 x\u00f3a s\u1ef1 ki\u1ec7n.",
    );
  }
  if (!data) {
    throw createError(
      "NOT_FOUND",
      "Kh\u00f4ng t\u00ecm th\u1ea5y s\u1ef1 ki\u1ec7n.",
    );
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/events/" + eventId);
  revalidatePath("/dashboard/events/" + eventId + "/settings");
  revalidatePath("/(public)/e/[slug]", "page");
}

export async function closeEvent(eventId: string) {
  const session = await verifySession();
  if (!session) {
    redirect("/auth/login");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({
      submission_mode: "closed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId)
    .eq("owner_id", session.userId)
    .is("deleted_at", null)
    .select("id")
    .single();

  if (error) {
    logger.error("Failed to close event", error, {
      userId: session.userId,
      eventId,
    });
    throw createError(
      "INTERNAL_SERVER_ERROR",
      "Không thể đóng nhận lời chúc cho sự kiện.",
    );
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/events/${eventId}`);
  revalidatePath(`/dashboard/events/${eventId}/settings`);
}
